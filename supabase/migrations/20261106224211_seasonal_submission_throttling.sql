-- Database enforcement also protects direct REST inserts that bypass the page.
create index seasonal_submissions_phone_created_idx
  on public.tnt_seasonal_form_submissions(form_key,phone,created_at desc);

create function private.throttle_seasonal_submissions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.form_key <> 'planksgiving-2026' then return new; end if;
  -- Serialize checks for this one small event so concurrent requests cannot all
  -- pass the same count. Callers receive no private contact information.
  perform pg_catalog.pg_advisory_xact_lock(20261126, 700);
  if (select count(*) from public.tnt_seasonal_form_submissions
      where form_key=new.form_key and created_at>now()-interval '1 minute') >= 30
    or (select count(*) from public.tnt_seasonal_form_submissions
      where form_key=new.form_key and created_at>now()-interval '1 hour') >= 200
    or (select count(*) from public.tnt_seasonal_form_submissions
      where form_key=new.form_key and phone=new.phone and created_at>now()-interval '1 hour') >= 3
  then
    raise sqlstate 'PT429' using message='Registration is receiving too many attempts. Please try again later or contact the Inferno team.';
  end if;
  return new;
end;
$$;
revoke all on function private.throttle_seasonal_submissions() from public,anon,authenticated,service_role;
create trigger throttle_seasonal_submissions before insert on public.tnt_seasonal_form_submissions
  for each row execute function private.throttle_seasonal_submissions();
