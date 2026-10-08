-- Revwi core schema

create type public.profile_role as enum ('admin', 'student');
create type public.question_status as enum ('draft', 'verified', 'published');
create type public.attempt_status as enum ('asking', 'feedback', 'finished');
create type public.attempt_mode as enum ('prep', 'exam');

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.profile_role not null default 'student',
  display_name text,
  created_at timestamptz not null default now()
);

create table public.year_levels (
  id uuid primary key default gen_random_uuid(),
  ordinal smallint not null unique check (ordinal between 1 and 4),
  name text not null
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  year_level_id uuid not null references public.year_levels (id) on delete cascade,
  code text not null,
  title text not null,
  alias text,
  slug text not null unique,
  planet jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  kind text not null check (kind in ('summative', 'major')),
  number smallint,
  exam text check (exam in ('midterm', 'final')),
  label text not null,
  ordinal smallint not null,
  slug text not null,
  modules smallint[] not null default '{1,2,3,4}',
  unique (course_id, slug),
  check (
    (kind = 'summative' and number is not null and exam is null)
    or (kind = 'major' and exam is not null and number is null)
  )
);

create table public.questions (
  id text primary key,
  course_id uuid not null references public.courses (id) on delete cascade,
  status public.question_status not null default 'draft',
  module smallint not null,
  topic text not null,
  qtype text not null check (qtype in ('single', 'multiple', 'matching')),
  prompt text not null,
  payload jsonb not null,
  citations jsonb not null default '[]'::jsonb,
  exhibit_path text,
  created_at timestamptz not null default now()
);

create table public.question_keys (
  question_id text primary key references public.questions (id) on delete cascade,
  correct jsonb not null,
  explanation text not null
);

create table public.bank_items (
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  source_number int not null,
  primary key (assessment_id, question_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  mode public.attempt_mode not null,
  status public.attempt_status not null default 'asking',
  question_ids text[] not null,
  cursor int not null default 0,
  draft jsonb not null default '[]'::jsonb,
  retry_of uuid references public.attempts (id),
  score int,
  best_streak int,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create unique index attempts_one_active_per_user_assessment
  on public.attempts (user_id, assessment_id)
  where status in ('asking', 'feedback');

create table public.attempt_entries (
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id text not null references public.questions (id),
  answer jsonb not null,
  skipped boolean not null default false,
  correct boolean not null,
  primary key (attempt_id, question_id)
);

create table public.question_recency (
  user_id uuid not null references auth.users (id) on delete cascade,
  question_id text not null references public.questions (id) on delete cascade,
  seen_count int not null default 0,
  last_seen_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = auth.uid() and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.year_levels enable row level security;
alter table public.courses enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.question_keys enable row level security;
alter table public.bank_items enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_entries enable row level security;
alter table public.question_recency enable row level security;

create policy profiles_select_own on public.profiles for select using (auth.uid() = user_id or public.is_admin());
create policy profiles_admin_all on public.profiles for all using (public.is_admin());

create policy year_levels_read on public.year_levels for select to authenticated using (true);
create policy year_levels_admin on public.year_levels for all using (public.is_admin());

create policy courses_read on public.courses for select to authenticated using (true);
create policy courses_admin on public.courses for all using (public.is_admin());

create policy assessments_read on public.assessments for select to authenticated using (true);
create policy assessments_admin on public.assessments for all using (public.is_admin());

create policy questions_read_published on public.questions for select to authenticated
  using (status = 'published' or public.is_admin());
create policy questions_admin on public.questions for all using (public.is_admin());

create policy question_keys_admin on public.question_keys for all using (public.is_admin());

create policy bank_items_read on public.bank_items for select to authenticated using (true);
create policy bank_items_admin on public.bank_items for all using (public.is_admin());

create policy attempts_select_own on public.attempts for select using (auth.uid() = user_id or public.is_admin());

create policy attempt_entries_select on public.attempt_entries for select using (
  exists (
    select 1 from public.attempts a
    where a.id = attempt_id
      and (a.user_id = auth.uid() or public.is_admin())
      and (
        public.is_admin()
        or a.mode = 'prep'
        or a.status = 'finished'
        or not attempt_entries.correct
      )
  )
);

create policy recency_select_own on public.question_recency for select using (auth.uid() = user_id or public.is_admin());

create or replace function public.guard_question_publish()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and old.status is distinct from 'published' then
    if not exists (select 1 from public.question_keys k where k.question_id = new.id) then
      raise exception 'Cannot publish without a question key';
    end if;
    if jsonb_array_length(new.citations) < 1 then
      raise exception 'Cannot publish without a citation';
    end if;
  end if;
  return new;
end;
$$;

create trigger questions_publish_guard
  before update on public.questions
  for each row execute function public.guard_question_publish();
