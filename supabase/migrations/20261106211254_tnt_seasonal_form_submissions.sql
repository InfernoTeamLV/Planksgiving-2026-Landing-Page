-- Reusable seasonal event intake. Public visitors can submit contact details,
-- but only TNT admins can read or manage submissions.
create table public.tnt_seasonal_forms (
  form_key text primary key check (form_key ~ '^[a-z0-9][a-z0-9-]{2,79}$'),
  title text not null,
  event_at timestamptz not null,
  closes_at timestamptz not null,
  accepting_submissions boolean not null default false,
  member_price_cents integer not null default 0 check (member_price_cents >= 0),
  guest_price_cents integer not null check (guest_price_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.tnt_seasonal_form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_key text not null references public.tnt_seasonal_forms(form_key),
  full_name text not null check (char_length(full_name) between 2 and 100 and full_name = btrim(full_name)),
  email text not null check (char_length(email) <= 254 and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  membership text not null check (membership in ('member', 'guest')),
  age_confirmed boolean not null check (age_confirmed = true),
  status text not null default 'new' check (status in ('new','contacted','confirmed','cancelled')),
  created_at timestamptz not null default now(),
  constraint tnt_seasonal_submission_email_unique unique (form_key, email)
);
create index tnt_seasonal_submissions_created_idx on public.tnt_seasonal_form_submissions(form_key, created_at desc);

alter table public.tnt_seasonal_forms enable row level security;
alter table public.tnt_seasonal_form_submissions enable row level security;
revoke all on public.tnt_seasonal_forms from public, anon, authenticated;
revoke all on public.tnt_seasonal_form_submissions from public, anon, authenticated;
grant select on public.tnt_seasonal_forms to anon, authenticated;
grant insert (form_key, full_name, email, phone, membership, age_confirmed)
  on public.tnt_seasonal_form_submissions to anon, authenticated;
grant select, update, delete on public.tnt_seasonal_form_submissions to authenticated;
grant insert, update, delete on public.tnt_seasonal_forms to authenticated;
grant all on public.tnt_seasonal_forms, public.tnt_seasonal_form_submissions to service_role;

create policy seasonal_forms_public_read on public.tnt_seasonal_forms
  for select to anon, authenticated using (true);
create policy seasonal_forms_admin_manage on public.tnt_seasonal_forms
  for all to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
  with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy seasonal_submissions_public_insert on public.tnt_seasonal_form_submissions
  for insert to anon, authenticated with check (
    exists (select 1 from public.tnt_seasonal_forms f
      where f.form_key = tnt_seasonal_form_submissions.form_key
        and f.accepting_submissions and f.closes_at > now())
  );
create policy seasonal_submissions_admin_read on public.tnt_seasonal_form_submissions
  for select to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy seasonal_submissions_admin_update on public.tnt_seasonal_form_submissions
  for update to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role') = 'admin')
  with check (((select auth.jwt())->'app_metadata'->>'role') = 'admin');
create policy seasonal_submissions_admin_delete on public.tnt_seasonal_form_submissions
  for delete to authenticated
  using (((select auth.jwt())->'app_metadata'->>'role') = 'admin');

insert into public.tnt_seasonal_forms
  (form_key, title, event_at, closes_at, accepting_submissions, guest_price_cents)
values ('planksgiving-2026', 'Planksgiving 2026', '2026-11-26 07:00:00-08',
  '2026-11-26 07:00:00-08', true, 4500);

comment on table public.tnt_seasonal_form_submissions is
  'Seasonal event intake. Membership is self-reported, not account authorization. Public clients cannot read submissions or set administrative status.';
