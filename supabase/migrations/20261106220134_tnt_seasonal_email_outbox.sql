-- Mail is queued in the registration transaction; mail failures never erase intake.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.tnt_seasonal_email_outbox (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.tnt_seasonal_form_submissions(id) on delete cascade,
  kind text not null check (kind in ('client','staff')),
  status text not null default 'pending' check (status in ('pending','processing','accepted','uncertain','failed')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  lease_token uuid,
  locked_until timestamptz,
  last_error text,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (submission_id, kind)
);
alter table private.tnt_seasonal_email_outbox enable row level security;
revoke all on private.tnt_seasonal_email_outbox from public, anon, authenticated;
grant all on private.tnt_seasonal_email_outbox to service_role;
create policy seasonal_mail_worker on private.tnt_seasonal_email_outbox
  for all to service_role using (true) with check (true);
create index seasonal_mail_pending_idx on private.tnt_seasonal_email_outbox(available_at)
  where status='pending';

-- This internal trigger deliberately runs with owner privileges: anonymous inserts
-- must enqueue mail without gaining direct access to the private queue.
create function private.queue_seasonal_registration_mail() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.form_key = 'planksgiving-2026' then
    insert into private.tnt_seasonal_email_outbox(submission_id,kind)
      values (new.id,'client'),(new.id,'staff');
  end if;
  return new;
end;
$$;
revoke all on function private.queue_seasonal_registration_mail() from public,anon,authenticated;
create trigger queue_seasonal_mail after insert on public.tnt_seasonal_form_submissions
  for each row execute function private.queue_seasonal_registration_mail();

create function public.claim_seasonal_registration_mail() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  -- A crashed worker might have sent mail before it crashed. Hold these for review
  -- instead of automatically sending a duplicate.
  update private.tnt_seasonal_email_outbox set status='uncertain',last_error='worker_interrupted'
    where status='processing' and locked_until < now();
  with candidates as (
    select id from private.tnt_seasonal_email_outbox
    where status='pending' and available_at<=now() and attempts<5
    order by available_at,id for update skip locked limit 4
  ), claimed as (
    update private.tnt_seasonal_email_outbox o
    set status='processing', attempts=o.attempts+1, lease_token=gen_random_uuid(),
      locked_until=now()+interval '5 minutes'
    from candidates c where o.id=c.id returning o.*
  )
  select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease_token',c.lease_token,
    'kind',c.kind,'registration',jsonb_build_object('full_name',s.full_name,
    'email',s.email,'phone',s.phone,'membership',s.membership))), '[]'::jsonb)
  into result from claimed c join public.tnt_seasonal_form_submissions s on s.id=c.submission_id;
  return result;
end;
$$;

create function public.finish_seasonal_registration_mail(job_id uuid, token uuid, outcome text, error_code text default null)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare updated integer;
begin
  if outcome not in ('accepted','retry','uncertain','failed') then raise exception 'Invalid mail outcome'; end if;
  update private.tnt_seasonal_email_outbox set
    status=case when outcome='retry' then case when attempts<5 then 'pending' else 'failed' end else outcome end,
    available_at=now()+make_interval(secs => (60*power(2,attempts))::integer),
    accepted_at=case when outcome='accepted' then now() else null end,
    last_error=left(error_code,80), locked_until=null, lease_token=null
  where id=job_id and lease_token=token and status='processing';
  get diagnostics updated=row_count;
  return updated=1;
end;
$$;
revoke all on function public.claim_seasonal_registration_mail() from public,anon,authenticated;
revoke all on function public.finish_seasonal_registration_mail(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.claim_seasonal_registration_mail() to service_role;
grant execute on function public.finish_seasonal_registration_mail(uuid,uuid,text,text) to service_role;
