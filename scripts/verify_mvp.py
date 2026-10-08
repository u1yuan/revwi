"""Complete Playwright smoke test for the local DevNet reviewer."""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = os.environ.get("REVIEWER_URL", "http://localhost:5173/")
ROOT = Path(__file__).resolve().parents[1]
V2 = "devnet-reviewer:state-v2"
V1 = "devnet-reviewer:mvp-session-v1"

MODULE2_IDS = [
    "midterm-026", "midterm-027", "midterm-028", "midterm-031", "midterm-032", "midterm-034",
    "midterm-035", "midterm-037", "midterm-038", "midterm-040", "midterm-041", "midterm-042",
    "midterm-044", "midterm-046", "midterm-047", "midterm-048", "midterm-049",
]

MILESTONE_CURRENT = {
    3: ("midterm-003", [1]),
    5: ("midterm-005", [0]),
    10: ("midterm-010", [0]),
    15: ("midterm-015", [3]),
    20: ("midterm-020", [0]),
}

AUDIO_MOCK = """
window.__audioEvents = [];
class MockAudioContext {
  constructor(){ this.state='running'; this.currentTime=0; this.destination={}; }
  createGain(){ return {gain:{value:1,cancelScheduledValues(){},setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}; }
  createOscillator(){ return {type:'',frequency:{setValueAtTime(v){window.__audioEvents.push('frequency:'+v)}},connect(){},start(){window.__audioEvents.push('oscillator:start')},stop(){}}; }
  resume(){ window.__audioEvents.push('context:resume'); return Promise.resolve(); }
}
window.AudioContext = MockAudioContext;
window.Audio = class {
  constructor(src){ this.src=src; this.volume=1; this.currentTime=0; }
  addEventListener(){}
  play(){ window.__audioEvents.push('media:play:'+this.src); return Promise.resolve(); }
  pause(){ window.__audioEvents.push('media:pause:'+this.src); }
};
"""


def empty_state():
    return {"version": 2, "activeSession": None, "attempts": [], "recency": {}, "preferences": {"muted": False, "volume": .55}}


def session(ids, index=0, mode="prep", draft=None, entries=None, phase="asking"):
    return {
        "ids": ids,
        "index": index,
        "mode": mode,
        "modules": sorted({1 if int(item.split("-")[1]) <= 25 else 2 if int(item.split("-")[1]) <= 50 else 3 if int(item.split("-")[1]) <= 74 else 4 for item in ids if item.startswith("midterm")}),
        "draft": draft if draft is not None else [],
        "entries": entries or {},
        "phase": phase,
    }


def seed(page, state):
    page.evaluate("([key, value]) => localStorage.setItem(key, JSON.stringify(value))", [V2, state])
    page.reload()


def stored(page):
    return page.evaluate("key => JSON.parse(localStorage.getItem(key))", V2)


def fresh_page(browser, viewport=None, reduced=False):
    context = browser.new_context(viewport=viewport or {"width": 1280, "height": 850}, reduced_motion="reduce" if reduced else "no-preference")
    context.add_init_script(AUDIO_MOCK)
    page = context.new_page()
    page.goto(URL)
    page.evaluate("localStorage.clear()")
    page.reload()
    return context, page


def open_setup(page):
    page.get_by_role("button", name="Start", exact=True).click()
    page.locator(".mode-card").first.click()


def select_only_module(page, module_index):
    for index in range(4):
        if index != module_index:
            page.locator(".module-chip").nth(index).click()


def active_with_streak(count, mode="prep", wrong=False, blank=False):
    current_id, answer = MILESTONE_CURRENT[count]
    ids = [f"midterm-{number:03d}" for number in range(1, count + 1)]
    ids[-1] = current_id
    entries = {item: {"answer": [0], "skipped": False, "correct": True} for item in ids[:-1]}
    draft = [] if blank else ([0] if wrong else answer)
    state = empty_state()
    state["activeSession"] = session(ids, count - 1, mode, draft, entries)
    return state


def test_migration(browser):
    context, page = fresh_page(browser)
    legacy = session(["midterm-002", "midterm-004"], 1, "prep", [2], {"midterm-002": {"answer": [2], "skipped": False, "correct": True}}, "asking")
    page.evaluate("([key, value]) => { localStorage.removeItem('devnet-reviewer:state-v2'); localStorage.setItem(key, JSON.stringify(value)); }", [V1, legacy])
    page.reload()
    migrated = stored(page)
    assert migrated["version"] == 3
    assert migrated["activeSession"] == legacy
    assert page.evaluate("key => localStorage.getItem(key)", V1) is None
    assert page.get_by_role("button", name="Resume session").is_visible()
    context.close()
    print("Migration: v1 order, position, drafts, and locked entries preserved")


def test_selection_and_recency(browser):
    context, page = fresh_page(browser)
    assert "122 verified" in page.locator(".intro").inner_text()
    page.screenshot(path=str(ROOT / "design" / "complete-home-desktop.png"), full_page=True)
    open_setup(page)
    assert not page.locator(".length-option input").nth(1).is_disabled()
    assert not page.locator(".length-option input").nth(2).is_disabled()
    page.locator(".length-option input").nth(2).check()
    page.get_by_role("button", name="Start Prep").click()
    first_order = stored(page)["activeSession"]["ids"]
    assert len(first_order) == 50 and len(set(first_order)) == 50
    page.reload()
    page.get_by_role("button", name="Resume session").click()
    assert stored(page)["activeSession"]["ids"] == first_order

    page.get_by_role("button", name="DevNet Reviewer home").click()
    state = empty_state()
    base = datetime(2026, 1, 1, tzinfo=timezone.utc)
    state["recency"] = {item: {"seenCount": 1, "lastSeenAt": (base + timedelta(days=index)).isoformat()} for index, item in enumerate(MODULE2_IDS)}
    seed(page, state)
    open_setup(page)
    select_only_module(page, 1)
    page.locator(".length-option").last.click()
    page.get_by_role("button", name="Start Prep").click()
    assert stored(page)["activeSession"]["ids"] == MODULE2_IDS

    state = empty_state()
    state["recency"] = {item: {"seenCount": 2, "lastSeenAt": "2026-01-01T00:00:00.000Z"} for item in MODULE2_IDS}
    seed(page, state)
    open_setup(page)
    page.get_by_role("button", name="Start Prep").click()
    chosen = stored(page)["activeSession"]["ids"]
    assert not set(chosen).intersection(MODULE2_IDS)
    context.close()
    print("Selection: 10/25/50/all, no repeats, fixed reload, unseen-first, least-recent passed")


def test_dialog_history_and_retry(browser):
    context, page = fresh_page(browser)
    state = empty_state()
    state["activeSession"] = session(["midterm-002"], draft=[0])
    seed(page, state)
    page.get_by_role("button", name="Resume session").click()
    page.get_by_role("button", name="Next").click()
    assert page.locator(".feedback-card h2").inner_text() == "Incorrect"
    page.get_by_role("button", name="See results").click()
    assert page.locator(".score-panel").inner_text().startswith("0/1")
    assert page.locator(".celebration").count() == 0
    first = stored(page)["attempts"][0]
    page.get_by_role("button", name="Retry 1 missed in Prep").click()
    page.locator(".answer-tile").nth(2).click()
    page.get_by_role("button", name="Next").click()
    assert page.locator(".answer-labels", has_text="Your answer").count() == 1
    assert page.locator(".answer-labels", has_text="Correct answer").count() == 1
    page.get_by_role("button", name="See results").click()
    page.locator(".celebration").wait_for(state="attached")
    assert page.locator(".celebration").count() == 1
    attempts = stored(page)["attempts"]
    assert len(attempts) == 2 and attempts[0] == first and attempts[1]["retryOf"] == first["id"]
    page.locator(".history-link").click()
    page.locator(".history-card").first.wait_for()
    assert page.locator(".history-card").count() == 2
    page.screenshot(path=str(ROOT / "design" / "complete-history-desktop.png"), full_page=True)
    page.locator(".history-card").first.click()
    assert "Read-only review" in page.locator(".results-screen").inner_text()
    assert page.locator(".celebration").count() == 0

    state = empty_state()
    state["activeSession"] = session(["midterm-002"], draft=[])
    seed(page, state)
    page.get_by_role("button", name="Resume session").click()
    page.get_by_role("button", name="Next").click()
    assert page.get_by_role("alertdialog").is_visible()
    page.get_by_role("button", name="Cancel").click()
    assert page.locator(".question-stage h1").is_visible()
    page.get_by_role("button", name="Next").click()
    page.get_by_role("button", name="Skip question").click()
    assert page.locator(".feedback-card h2").inner_text() == "Skipped"
    page.get_by_role("button", name="DevNet Reviewer home").click()
    page.get_by_role("button", name="New run").click()
    assert page.get_by_role("alertdialog").is_visible()
    assert "Replace unfinished" in page.get_by_role("alertdialog").inner_text()
    context.close()
    print("Dialogs/history: skip, replace, immutable attempts, read-only history, separate retry passed")


def test_streaks_exam_and_audio(browser):
    context, page = fresh_page(browser)
    events = page.evaluate("window.__audioEvents")
    assert events == [] or events == ["sfx:stop"]
    page.evaluate("window.__audioEvents.length = 0")
    page.get_by_role("button", name="Start", exact=True).click()
    page.locator(".mode-card").nth(1).click()
    assert page.evaluate("window.__audioEvents.length") > 0

    for count in [3, 5, 10, 15, 20]:
        seed(page, active_with_streak(count))
        page.get_by_role("button", name="Resume session").click()
        page.get_by_role("button", name="Next").click()
        page.locator(".milestone-overlay").wait_for(state="visible")
        assert page.locator(".flame-meter").get_attribute("aria-label") == f"Current streak {count}"
        if count == 3:
            page.get_by_role("button", name="Audio settings").click()
            page.get_by_role("button", name="Sound effects on").click()
            assert any("sfx:stop" in event for event in page.evaluate("window.__audioEvents"))

    seed(page, active_with_streak(3, wrong=True))
    page.get_by_role("button", name="Resume session").click()
    page.get_by_role("button", name="Next").click()
    assert page.locator(".milestone-overlay").count() == 0
    assert page.locator(".flame-meter").get_attribute("aria-label") == "Current streak 0"

    exam_state = active_with_streak(3, mode="exam")
    exam_state["activeSession"]["ids"].append("midterm-004")
    seed(page, exam_state)
    page.get_by_role("button", name="Resume session").click()
    assert page.locator(".flame-meter").count() == 0
    page.evaluate("window.__audioEvents.length = 0")
    page.get_by_role("button", name="Next").click()
    events = page.evaluate("window.__audioEvents")
    assert "frequency:520" in events
    assert not any("correct.wav" in event or "incorrect.wav" in event for event in events)
    assert "Correct answer:" not in page.locator("main").inner_text()
    assert page.locator(".milestone-overlay").count() == 0

    page.get_by_role("button", name="Audio settings").click()
    page.get_by_role("button", name="Sound effects on").click()
    assert stored(page)["preferences"]["sfxOn"] is False
    page.reload()
    page.get_by_role("button", name="Audio settings").click()
    assert page.get_by_role("button", name="Sound effects off").is_visible()
    context.close()
    print("Streak/audio: milestones 3/5/10/15/20, reset, Exam-neutral cues, persistence passed")


def test_mobile_and_reduced_motion(browser):
    context, page = fresh_page(browser, {"width": 390, "height": 844})
    state = active_with_streak(3)
    seed(page, state)
    page.get_by_role("button", name="Resume session").click()
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    page.screenshot(path=str(ROOT / "design" / "complete-quiz-phone.png"), full_page=True)
    context.close()

    context, page = fresh_page(browser, {"width": 390, "height": 844}, reduced=True)
    seed(page, active_with_streak(3))
    page.get_by_role("button", name="Resume session").click()
    page.locator(".question-transition").wait_for()
    assert page.evaluate("getComputedStyle(document.querySelector('.question-transition')).animationName") == "none"
    page.get_by_role("button", name="Next").click()
    assert page.evaluate("getComputedStyle(document.querySelector('.milestone-overlay')).animationName") == "none"
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    context.close()
    print("Responsive/accessibility: 390px width and reduced-motion static states passed")


def run():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        test_migration(browser)
        test_selection_and_recency(browser)
        test_dialog_history_and_retry(browser)
        test_streaks_exam_and_audio(browser)
        test_mobile_and_reduced_motion(browser)
        browser.close()
    print("Complete Playwright smoke test passed")


if __name__ == "__main__":
    run()
