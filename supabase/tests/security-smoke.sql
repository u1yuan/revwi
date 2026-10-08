-- Run in Supabase SQL Editor after migrations, seed, and at least one student
-- invitation. The transaction rolls back its test rows and role changes.
begin;

create temp table revwi_security_ids as
select
  (select user_id from public.profiles where role = 'student' limit 1) as student_id,
  (select user_id from public.profiles where role = 'admin' limit 1) as admin_id,
  (select id from public.courses limit 1) as course_id,
  (select id from public.assessments limit 1) as assessment_id,
  (select id from public.questions where status = 'published' limit 1) as question_id;

do $$
begin
  if exists (select 1 from revwi_security_ids where student_id is null or admin_id is null or course_id is null or assessment_id is null or question_id is null) then
    raise exception 'Seed the bank and invite one student and one admin before running security-smoke.sql';
  end if;
end;
$$;

update public.attempts
set status = 'abandoned'
where user_id = (select student_id from revwi_security_ids)
  and assessment_id = (select assessment_id from revwi_security_ids)
  and status in ('asking', 'feedback');

insert into public.attempts (id, user_id, assessment_id, mode, status, question_ids)
select '00000000-0000-4000-8000-000000000001'::uuid, student_id, assessment_id,
       'exam', 'asking', array[question_id]
from revwi_security_ids;
insert into public.attempt_entries (attempt_id, question_id, answer, correct)
select '00000000-0000-4000-8000-000000000001'::uuid, question_id, '[0]'::jsonb, true
from revwi_security_ids;

grant select on revwi_security_ids to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', (select student_id::text from revwi_security_ids), true);
do $$
begin
  if (select count(*) from public.question_keys) <> 0 then
    raise exception 'Student can read answer keys';
  end if;
  if (select count(*) from public.attempt_entries where attempt_id = '00000000-0000-4000-8000-000000000001') <> 0 then
    raise exception 'Student can read unfinished Exam entries';
  end if;
  if (select count(*) from public.questions where status = 'published') = 0 then
    raise exception 'Invited student cannot read the published bank';
  end if;
  if has_table_privilege('authenticated', 'public.attempts', 'INSERT') or
     has_table_privilege('authenticated', 'public.attempt_entries', 'INSERT') then
    raise exception 'Authenticated clients can write graded attempts directly';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
do $$
begin
  if (select count(*) from public.questions) <> 0 or (select count(*) from public.courses) <> 0 then
    raise exception 'Uninvited authenticated user can read catalog';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', (select admin_id::text from revwi_security_ids), true);
do $$
begin
  if (select count(*) from public.question_keys) = 0 then
    raise exception 'Admin cannot read question keys';
  end if;
end;
$$;

reset role;
do $$
declare c uuid;
begin
  select course_id into c from revwi_security_ids;
  begin
    insert into public.questions (id, course_id, status, module, topic, qtype, prompt, payload, citations)
    values ('security-smoke-insert', c, 'published', 1, 'test', 'single', 'test', '{"choices":["A","B"],"requiredCount":1}', '[]');
    raise exception 'Published insert without key/citation was accepted';
  exception when others then
    if sqlerrm not like 'Cannot publish without%' then raise; end if;
  end;

  insert into public.questions (id, course_id, status, module, topic, qtype, prompt, payload, citations)
  values ('security-smoke-update', c, 'draft', 1, 'test', 'single', 'test', '{"choices":["A","B"],"requiredCount":1}', '[]');
  begin
    update public.questions set status = 'published' where id = 'security-smoke-update';
    raise exception 'Published update without key/citation was accepted';
  exception when others then
    if sqlerrm not like 'Cannot publish without%' then raise; end if;
  end;
end;
$$;

rollback;
