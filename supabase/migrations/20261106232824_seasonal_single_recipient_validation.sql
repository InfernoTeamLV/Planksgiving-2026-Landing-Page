-- Reject display names, address lists and header syntax even on direct API writes.
alter table public.tnt_seasonal_form_submissions
  add constraint seasonal_email_single_recipient check (
    char_length(split_part(email,'@',1)) <= 64
    and split_part(email,'@',1) !~ '(^\.|\.$|\.\.)'
    and email ~ $rx$^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$$rx$
  ) not valid;
alter table public.tnt_seasonal_form_submissions
  validate constraint seasonal_email_single_recipient;
