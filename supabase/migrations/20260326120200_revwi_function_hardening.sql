revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create or replace function public.guard_question_publish()
returns trigger
language plpgsql
set search_path = public
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
