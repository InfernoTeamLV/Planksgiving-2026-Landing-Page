create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Only a database-owned scheduled job can read the worker's dedicated Vault key.
create function private.dispatch_seasonal_mail() returns void
language plpgsql security invoker set search_path = '' as $$
declare worker_key text;
begin
  if not exists (select 1 from private.tnt_seasonal_email_outbox
    where (status='pending' and available_at<=now())
      or (status='processing' and locked_until<now())) then return; end if;
  select decrypted_secret into worker_key from vault.decrypted_secrets
    where name='seasonal_email_worker_secret';
  if worker_key is null then return; end if;
  perform net.http_post(
    url := 'https://jngvmbwwrjlgglqsrggw.supabase.co/functions/v1/seasonal-email-worker',
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||worker_key),
    body := '{}'::jsonb, timeout_milliseconds := 120000
  );
end;
$$;
revoke all on function private.dispatch_seasonal_mail() from public,anon,authenticated,service_role;
select cron.schedule('tnt-seasonal-registration-mail','* * * * *',
  'select private.dispatch_seasonal_mail()');
