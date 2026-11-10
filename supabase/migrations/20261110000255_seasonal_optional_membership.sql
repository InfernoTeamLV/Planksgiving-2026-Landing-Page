-- The current landing form no longer asks for membership. Keep historical
-- member/guest values, while new general registrations leave this unspecified.
alter table public.tnt_seasonal_form_submissions
  alter column membership drop not null;
comment on column public.tnt_seasonal_form_submissions.membership is
  'Optional historical self-reported membership. Null means not collected; never infer member status from omission.';
