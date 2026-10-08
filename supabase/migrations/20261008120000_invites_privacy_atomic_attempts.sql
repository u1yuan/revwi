-- Invite-only membership, public question safety, and atomic attempt transitions.
alter type public.attempt_status add value if not exists 'abandoned';
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid())
  );
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = (select auth.uid()) and p.role = 'admin'
  );
$$;
revoke all on function private.is_member() from public, anon;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_member() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Only an administrator invitation creates a usable application profile.
-- An unrelated OAuth signup can create an auth user but has no Revwi access.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.invited_at is not null then
    insert into public.profiles (user_id, role)
    values (new.id, 'student')
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_invited on auth.users;
create trigger on_auth_user_invited
  after update of invited_at on auth.users
  for each row when (new.invited_at is not null and old.invited_at is null)
  execute function public.handle_new_user();

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_select_own on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy profiles_admin_all on public.profiles for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists year_levels_read on public.year_levels;
drop policy if exists year_levels_admin on public.year_levels;
create policy year_levels_read on public.year_levels for select to authenticated
  using ((select private.is_member()));
create policy year_levels_admin on public.year_levels for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists courses_read on public.courses;
drop policy if exists courses_admin on public.courses;
create policy courses_read on public.courses for select to authenticated
  using ((select private.is_member()));
create policy courses_admin on public.courses for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists assessments_read on public.assessments;
drop policy if exists assessments_admin on public.assessments;
create policy assessments_read on public.assessments for select to authenticated
  using ((select private.is_member()));
create policy assessments_admin on public.assessments for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists questions_read_published on public.questions;
drop policy if exists questions_admin on public.questions;
create policy questions_read_published on public.questions for select to authenticated
  using ((select private.is_admin()) or (status = 'published' and (select private.is_member())));
create policy questions_admin on public.questions for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists question_keys_admin on public.question_keys;
create policy question_keys_admin on public.question_keys for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists bank_items_read on public.bank_items;
drop policy if exists bank_items_admin on public.bank_items;
create policy bank_items_read on public.bank_items for select to authenticated
  using (
    (select private.is_admin()) or
    ((select private.is_member()) and exists (
      select 1 from public.questions q
      where q.id = bank_items.question_id and q.status = 'published'
    ))
  );
create policy bank_items_admin on public.bank_items for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

drop policy if exists attempts_select_own on public.attempts;
create policy attempts_select_own on public.attempts for select to authenticated
  using (((select private.is_member()) and user_id = (select auth.uid())) or (select private.is_admin()));

drop policy if exists attempt_entries_select on public.attempt_entries;
create policy attempt_entries_select on public.attempt_entries for select to authenticated
  using (
    (select private.is_admin()) or exists (
      select 1 from public.attempts a
      where a.id = attempt_id
        and a.user_id = (select auth.uid())
        and (a.mode = 'prep' or a.status = 'finished')
    )
  );

drop policy if exists recency_select_own on public.question_recency;
create policy recency_select_own on public.question_recency for select to authenticated
  using (((select private.is_member()) and user_id = (select auth.uid())) or (select private.is_admin()));

-- New Supabase projects may require explicit Data API grants.
grant select on public.profiles, public.year_levels, public.courses,
  public.assessments, public.questions, public.bank_items, public.attempts,
  public.attempt_entries, public.question_recency to authenticated;
grant insert, update, delete on public.profiles, public.year_levels, public.courses,
  public.assessments, public.questions, public.question_keys, public.bank_items to authenticated;
grant select on public.question_keys to authenticated;

-- Published content must be complete, and the public payload cannot contain keys.
-- Clean any rows seeded by the earlier script before enabling the new guard.
update public.questions q
set payload = case
  when q.qtype = 'matching' then
    jsonb_set(q.payload, '{pairs}', coalesce((
      select jsonb_agg(pair - 'target' order by position)
      from jsonb_array_elements(coalesce(q.payload->'pairs', '[]'::jsonb)) with ordinality as p(pair, position)
    ), '[]'::jsonb)) - 'correct' - 'explanation'
  else
    (q.payload - 'correct' - 'explanation') ||
    jsonb_build_object('requiredCount', jsonb_array_length(coalesce(q.payload->'correct', '[]'::jsonb)))
end
where q.payload ? 'correct' or q.payload ? 'explanation' or
  (q.qtype = 'matching' and exists (
    select 1 from jsonb_array_elements(coalesce(q.payload->'pairs', '[]'::jsonb)) p where p ? 'target'
  ));

create or replace function public.guard_question_publish()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.payload ? 'correct' or new.payload ? 'explanation' or
     (new.qtype = 'matching' and exists (
       select 1 from jsonb_array_elements(coalesce(new.payload->'pairs', '[]'::jsonb)) p
       where p ? 'target'
     )) then
    raise exception 'Question payload cannot contain answer data';
  end if;
  if new.status = 'published' then
    if jsonb_typeof(new.citations) is distinct from 'array' or jsonb_array_length(new.citations) < 1 then
      raise exception 'Cannot publish without a citation';
    end if;
    if not exists (
      select 1 from public.question_keys k
      where k.question_id = new.id and length(trim(k.explanation)) > 0
        and jsonb_typeof(k.correct) = 'array' and jsonb_array_length(k.correct) > 0
    ) then
      raise exception 'Cannot publish without a complete question key';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists questions_publish_guard on public.questions;
create trigger questions_publish_guard before insert or update on public.questions
  for each row execute function public.guard_question_publish();

create or replace function public.guard_published_key()
returns trigger language plpgsql set search_path = '' as $$
declare qid text;
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.questions q where q.id = old.question_id and q.status = 'published') then
      raise exception 'Cannot remove a key from a published question';
    end if;
    return old;
  end if;
  qid := coalesce(new.question_id, old.question_id);
  if exists (select 1 from public.questions q where q.id = qid and q.status = 'published') then
    if new.question_id is distinct from old.question_id or
       length(trim(new.explanation)) = 0 or
       jsonb_typeof(new.correct) is distinct from 'array' or jsonb_array_length(new.correct) = 0 then
      raise exception 'Cannot remove a complete key from a published question';
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger published_key_guard before update or delete on public.question_keys
  for each row execute function public.guard_published_key();

-- Only the service-role client can call these RPCs. It has already graded in TS.
create or replace function public.commit_attempt_submission(
  p_user_id uuid, p_attempt_id uuid, p_question_id text, p_answer jsonb,
  p_skipped boolean, p_correct boolean, p_next_status public.attempt_status,
  p_score integer, p_best_streak integer
) returns public.attempts language plpgsql security invoker set search_path = '' as $$
declare a public.attempts;
begin
  select * into a from public.attempts where id = p_attempt_id for update;
  if not found or a.user_id <> p_user_id then raise exception 'Attempt not found'; end if;
  if a.status <> 'asking' or a.question_ids[a.cursor + 1] is distinct from p_question_id then
    raise exception 'Attempt cursor out of sync';
  end if;
  if (a.mode = 'prep' and p_next_status <> 'feedback') or
     (a.mode = 'exam' and p_next_status <> case when a.cursor + 1 = array_length(a.question_ids, 1) then 'finished'::public.attempt_status else 'asking'::public.attempt_status end) then
    raise exception 'Invalid next status';
  end if;
  insert into public.attempt_entries (attempt_id, question_id, answer, skipped, correct)
    values (p_attempt_id, p_question_id, p_answer, p_skipped, p_correct);
  insert into public.question_recency (user_id, question_id, seen_count, last_seen_at)
    values (p_user_id, p_question_id, 1, now())
    on conflict (user_id, question_id) do update
    set seen_count = public.question_recency.seen_count + 1, last_seen_at = now();
  update public.attempts
  set cursor = case when a.mode = 'exam' then a.cursor + 1 else a.cursor end,
      status = p_next_status, draft = '[]'::jsonb,
      score = case when a.mode = 'exam' and p_next_status <> 'finished' then null else p_score end,
      best_streak = case when a.mode = 'exam' and p_next_status <> 'finished' then null else p_best_streak end,
      finished_at = case when p_next_status = 'finished' then now() else null end
  where id = p_attempt_id returning * into a;
  return a;
end;
$$;
revoke all on function public.commit_attempt_submission(uuid, uuid, text, jsonb, boolean, boolean, public.attempt_status, integer, integer) from public, anon, authenticated;
grant execute on function public.commit_attempt_submission(uuid, uuid, text, jsonb, boolean, boolean, public.attempt_status, integer, integer) to service_role;

create or replace function public.continue_attempt_feedback(p_user_id uuid, p_attempt_id uuid)
returns public.attempts language plpgsql security invoker set search_path = '' as $$
declare a public.attempts;
begin
  select * into a from public.attempts where id = p_attempt_id for update;
  if not found or a.user_id <> p_user_id or a.mode <> 'prep' or a.status <> 'feedback' then
    raise exception 'Attempt is not awaiting feedback';
  end if;
  update public.attempts
  set cursor = a.cursor + 1,
      status = case when a.cursor + 1 = array_length(a.question_ids, 1) then 'finished'::public.attempt_status else 'asking'::public.attempt_status end,
      finished_at = case when a.cursor + 1 = array_length(a.question_ids, 1) then now() else null end
  where id = p_attempt_id returning * into a;
  return a;
end;
$$;
revoke all on function public.continue_attempt_feedback(uuid, uuid) from public, anon, authenticated;
grant execute on function public.continue_attempt_feedback(uuid, uuid) to service_role;

create or replace function public.abandon_attempt(p_user_id uuid, p_attempt_id uuid)
returns public.attempts language plpgsql security invoker set search_path = '' as $$
declare a public.attempts;
begin
  update public.attempts
  set status = 'abandoned', draft = '[]'::jsonb
  where id = p_attempt_id and user_id = p_user_id and status in ('asking', 'feedback')
  returning * into a;
  if not found then raise exception 'Unfinished attempt not found'; end if;
  return a;
end;
$$;
revoke all on function public.abandon_attempt(uuid, uuid) from public, anon, authenticated;
grant execute on function public.abandon_attempt(uuid, uuid) to service_role;
