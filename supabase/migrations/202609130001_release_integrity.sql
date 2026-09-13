-- Additive release safeguards. Apply after the initial schema; no table is reset.
-- Database policies must honor deactivation even for direct Supabase clients.
create or replace function public.get_current_role() returns text
language sql stable security definer set search_path = public
as $$ select role from public.profiles where id = auth.uid() and account_status = 'active' $$;

create or replace function public.current_employee_id() returns uuid
language sql stable security definer set search_path = public
as $$ select e.id from public.employee_profiles e join public.profiles p on p.id = e.profile_id
  where e.profile_id = auth.uid() and p.account_status = 'active' and e.employment_status in ('active', 'probation') $$;

alter policy departments_read on public.departments using (public.get_current_role() is not null);
alter policy leave_types_read on public.leave_types using (public.get_current_role() is not null);
alter policy org_settings_read on public.organization_settings using (public.get_current_role() is not null);
alter policy employees_read on public.employee_profiles using (
  (profile_id = auth.uid() and public.get_current_role() is not null) or public.is_management()
);
alter policy employees_self_update on public.employee_profiles
  using (profile_id = auth.uid() and public.get_current_role() is not null)
  with check (profile_id = auth.uid() and public.get_current_role() is not null);
alter policy notifications_read on public.notifications using (
  recipient_id = auth.uid() and public.get_current_role() is not null
);
alter policy notifications_update on public.notifications
  using (recipient_id = auth.uid() and public.get_current_role() is not null)
  with check (recipient_id = auth.uid() and public.get_current_role() is not null);

create or replace function public.business_timezone() returns text
language sql stable security definer set search_path = public
as $$ select coalesce((select timezone from public.organization_settings order by created_at limit 1), 'UTC') $$;

-- Public signup metadata cannot claim an HR-assigned employee code or privileged role.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare generated_code text;
begin
  generated_code := 'DF-' || upper(substr(replace(new.id::text, '-', ''), 1, 24));
  insert into public.profiles(id, email, full_name, role)
  values (new.id, new.email, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'New Employee'), 'employee');
  insert into public.employee_profiles(profile_id, employee_code) values (new.id, generated_code);
  return new;
end $$;

create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if old.email is distinct from new.email then raise exception 'Work email must be changed through Supabase Auth'; end if;
    if old.role is distinct from new.role and (not public.is_admin() or old.id = auth.uid()) then
      raise exception 'Only administrators can change another account role';
    end if;
    if old.account_status is distinct from new.account_status and
      coalesce(current_setting('dayflow.status_change', true), '') <> 'authorized' then
      raise exception 'Change account status through the employee status action';
    end if;
    if not public.is_management() and
      (old.full_name is distinct from new.full_name or old.account_status is distinct from new.account_status) then
      raise exception 'Employees may only update their avatar';
    end if;
  end if;
  return new;
end $$;

create or replace function public.audit_profile_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.role is distinct from new.role then
    perform public.write_audit('role.changed', 'profile', new.id, 'Role changed to ' || new.role);
  end if;
  if old.account_status is distinct from new.account_status then
    perform public.write_audit('account.' || new.account_status, 'profile', new.id, 'Account status changed');
  end if;
  if old.full_name is distinct from new.full_name then
    perform public.write_audit('profile.renamed', 'profile', new.id, 'Profile name changed');
  end if;
  return new;
end $$;
create trigger audit_profile_update after update on public.profiles
for each row execute function public.audit_profile_change();

-- Employee codes and profile links are immutable after provisioning. Management
-- may not bypass the administrator boundary by writing employee_profiles directly.
create or replace function public.guard_employee_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare target_role text;
begin
  if auth.uid() is not null then
    if old.profile_id is distinct from new.profile_id or old.employee_code is distinct from new.employee_code then
      raise exception 'Employee identity cannot be reassigned';
    end if;
    if public.is_management() then
      select role into target_role from public.profiles where id = old.profile_id;
      if target_role = 'admin' and not public.is_admin() then
        raise exception 'Only administrators can change administrator accounts';
      end if;
      if old.employment_status is distinct from new.employment_status and
        coalesce(current_setting('dayflow.status_change', true), '') <> 'authorized' then
        raise exception 'Change employment status through the employee status action';
      end if;
    elsif old.department_id is distinct from new.department_id or old.designation is distinct from new.designation or
      old.manager_id is distinct from new.manager_id or old.employment_type is distinct from new.employment_type or
      old.joining_date is distinct from new.joining_date or old.employment_status is distinct from new.employment_status or
      old.date_of_birth is distinct from new.date_of_birth then
      raise exception 'Employees may only update permitted personal fields';
    end if;
  end if;
  return new;
end $$;

create or replace function public.business_date() returns date
language sql stable security definer set search_path = public
as $$ select (now() at time zone public.business_timezone())::date $$;

create or replace function public.validate_organization_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid organization timezone';
  end if;
  if new.currency !~ '^[A-Z]{3}$' or char_length(trim(new.organization_name)) < 2 then
    raise exception 'Invalid organization settings';
  end if;
  if tg_op = 'INSERT' then
    perform pg_advisory_xact_lock(9152026);
    if exists (select 1 from public.organization_settings) then raise exception 'Organization settings already exist'; end if;
  end if;
  return new;
end $$;
create trigger validate_org_settings before insert or update on public.organization_settings
for each row execute function public.validate_organization_settings();

create or replace function public.audit_organization_settings() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.write_audit('settings.updated', 'organization_settings', new.id, 'Organization settings updated');
  return new;
end $$;
create trigger audit_org_settings after insert or update on public.organization_settings
for each row execute function public.audit_organization_settings();

create or replace function public.check_in() returns public.attendance_records
language plpgsql security definer set search_path = public as $$
declare emp uuid; result public.attendance_records; workday date;
begin
  emp := public.current_employee_id();
  if emp is null then raise exception 'Employee profile not found'; end if;
  workday := public.business_date();
  if exists (select 1 from public.attendance_records where employee_id = emp and check_in is not null and check_out is null) then
    raise exception 'You have already checked in';
  end if;
  insert into public.attendance_records(employee_id, work_date, check_in, status, source)
  values (emp, workday, now(), 'present', 'web') on conflict (employee_id, work_date) do nothing returning * into result;
  if result.id is null then raise exception 'Attendance already recorded for today'; end if;
  perform public.write_audit('attendance.checked_in', 'attendance', result.id, 'Employee checked in', jsonb_build_object('work_date', workday));
  return result;
end $$;

create or replace function public.check_out() returns public.attendance_records
language plpgsql security definer set search_path = public as $$
declare emp uuid; result public.attendance_records; mins integer; half_day integer;
begin
  emp := public.current_employee_id();
  if emp is null then raise exception 'Employee profile not found'; end if;
  select * into result from public.attendance_records
  where employee_id = emp and check_in is not null and check_out is null
  order by check_in desc limit 1 for update;
  if result.id is null then raise exception 'Check-in required before check-out'; end if;
  mins := greatest(0, floor(extract(epoch from (now() - result.check_in)) / 60)::integer);
  select coalesce((select half_day_minutes from public.organization_settings order by created_at limit 1), 240) into half_day;
  update public.attendance_records set check_out = now(), total_minutes = mins,
    status = case when mins < half_day then 'half_day' else 'present' end
  where id = result.id returning * into result;
  perform public.write_audit('attendance.checked_out', 'attendance', result.id, 'Employee checked out', jsonb_build_object('total_minutes', mins));
  return result;
end $$;

create or replace function public.submit_leave(p_leave_type_id uuid, p_start date, p_end date, p_half_day boolean, p_remarks text, p_attachment text default null)
returns public.leave_requests language plpgsql security definer set search_path = public as $$
declare emp uuid; days numeric(5,1); available numeric(5,1); requires boolean; result public.leave_requests;
begin
  emp := public.current_employee_id(); if emp is null then raise exception 'Employee profile not found'; end if;
  if p_start is null or p_end is null or p_start < public.business_date() then raise exception 'Past dates are not allowed'; end if;
  if p_end < p_start then raise exception 'End date must be on or after start date'; end if;
  if p_half_day and p_start <> p_end then raise exception 'Half-day leave must have one date'; end if;
  if extract(year from p_start) <> extract(year from p_end) then raise exception 'Submit a separate request for each calendar year'; end if;
  if char_length(trim(coalesce(p_remarks, ''))) not between 3 and 500 then raise exception 'Remarks must be 3–500 characters'; end if;
  days := case when p_half_day then 0.5 else (p_end - p_start) + 1 end;
  -- Serialize submissions by employee so the overlap check cannot race another request.
  perform pg_advisory_xact_lock(hashtextextended(emp::text, 0));
  if exists (select 1 from public.leave_requests where employee_id = emp and status in ('pending', 'approved')
    and daterange(start_date, end_date, '[]') && daterange(p_start, p_end, '[]')) then
    raise exception 'This request overlaps existing leave';
  end if;
  select requires_balance into requires from public.leave_types where id = p_leave_type_id and active;
  if not found then raise exception 'Invalid leave type'; end if;
  if requires then
    select balance_days into available from public.leave_balances
    where employee_id = emp and leave_type_id = p_leave_type_id and year = extract(year from p_start);
    if coalesce(available, 0) < days then raise exception 'Insufficient leave balance'; end if;
  end if;
  insert into public.leave_requests(employee_id, leave_type_id, start_date, end_date, duration_days, is_half_day, remarks, attachment_path)
  values (emp, p_leave_type_id, p_start, p_end, days, p_half_day, trim(p_remarks), p_attachment) returning * into result;
  insert into public.leave_request_history(leave_request_id, to_status, comment, actor_id)
  values (result.id, 'pending', 'Request submitted', auth.uid());
  insert into public.notifications(recipient_id, title, message, category, related_entity_type, related_entity_id, link)
  select id, 'New leave request', 'A new leave request is waiting for review.', 'leave', 'leave_request', result.id, '/leave?id=' || result.id
  from public.profiles where role in ('hr', 'admin') and account_status = 'active';
  perform public.write_audit('leave.submitted', 'leave_request', result.id, 'Leave request submitted', jsonb_build_object('days', days));
  return result;
end $$;

create or replace function public.review_leave(p_request_id uuid, p_decision text, p_comment text)
returns public.leave_requests language plpgsql security definer set search_path = public as $$
declare req public.leave_requests; requires boolean; owner uuid; result public.leave_requests;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  if p_decision not in ('approved', 'rejected') then raise exception 'Invalid decision'; end if;
  if char_length(trim(coalesce(p_comment, ''))) < 2 then raise exception 'A review comment is required'; end if;
  select * into req from public.leave_requests where id = p_request_id for update;
  if req.id is null then raise exception 'Request not found'; end if;
  if req.status <> 'pending' then raise exception 'Only pending requests can be reviewed'; end if;
  select requires_balance into requires from public.leave_types where id = req.leave_type_id;
  select profile_id into owner from public.employee_profiles where id = req.employee_id;
  if p_decision = 'approved' then
    -- A worked or manually corrected day must never be relabeled as leave.
    if not req.is_half_day and exists (select 1 from public.attendance_records where employee_id = req.employee_id
      and work_date between req.start_date and req.end_date) then
      raise exception 'Attendance already exists for a requested date';
    end if;
    if requires then
      update public.leave_balances set balance_days = balance_days - req.duration_days, used_days = used_days + req.duration_days
      where employee_id = req.employee_id and leave_type_id = req.leave_type_id
        and year = extract(year from req.start_date) and balance_days >= req.duration_days;
      if not found then raise exception 'Insufficient leave balance'; end if;
    end if;
    if not req.is_half_day then
      insert into public.attendance_records(employee_id, work_date, status, source, notes)
      select req.employee_id, day::date, 'leave', 'system', 'Approved leave'
      from generate_series(req.start_date, req.end_date, interval '1 day') day;
    end if;
  end if;
  update public.leave_requests set status = p_decision, reviewer_id = auth.uid(), reviewer_comment = trim(p_comment), reviewed_at = now()
  where id = req.id returning * into result;
  insert into public.leave_request_history(leave_request_id, from_status, to_status, comment, actor_id)
  values (req.id, 'pending', p_decision, trim(p_comment), auth.uid());
  insert into public.notifications(recipient_id, title, message, category, related_entity_type, related_entity_id, link)
  values (owner, 'Leave request ' || p_decision, 'Your leave request has been ' || p_decision || '.', 'leave', 'leave_request', req.id, '/leave?id=' || req.id);
  perform public.write_audit('leave.' || p_decision, 'leave_request', req.id, 'Leave request ' || p_decision, jsonb_build_object('comment', p_comment));
  return result;
end $$;

create or replace function public.save_payroll_draft(p_employee_id uuid, p_month text, p_basic numeric, p_allowances numeric, p_deductions numeric)
returns public.payroll_records language plpgsql security definer set search_path = public as $$
declare result public.payroll_records;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  if p_month !~ '^20[0-9]{2}-(0[1-9]|1[0-2])$' then raise exception 'Invalid payroll month'; end if;
  if p_basic is null or p_allowances is null or p_deductions is null or least(p_basic, p_allowances, p_deductions) < 0
    or p_deductions > p_basic + p_allowances then raise exception 'Invalid payroll amounts'; end if;
  insert into public.payroll_records(employee_id, payroll_month, basic_salary, allowances, deductions, status, created_by, updated_by)
  values (p_employee_id, p_month, p_basic, p_allowances, p_deductions, 'draft', auth.uid(), auth.uid())
  on conflict (employee_id, payroll_month) do update set basic_salary = excluded.basic_salary,
    allowances = excluded.allowances, deductions = excluded.deductions, updated_by = auth.uid()
  where public.payroll_records.status = 'draft' returning * into result;
  if result.id is null then raise exception 'Published payroll cannot be edited'; end if;
  return result;
end $$;

create or replace function public.publish_payroll(p_payroll_id uuid, p_status text)
returns public.payroll_records language plpgsql security definer set search_path = public as $$
declare result public.payroll_records;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  select * into result from public.payroll_records where id = p_payroll_id for update;
  if result.id is null then raise exception 'Payroll record not found'; end if;
  if not ((result.status = 'draft' and p_status = 'processed') or (result.status = 'processed' and p_status = 'paid')) then
    raise exception 'Invalid payroll status transition';
  end if;
  update public.payroll_records set status = p_status,
    payment_date = case when p_status = 'paid' then public.business_date() else null end,
    updated_by = auth.uid() where id = result.id returning * into result;
  return result;
end $$;

create or replace function public.guard_payroll_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then raise exception 'New payroll must start as draft'; end if;
  else
    if old.status = 'paid' then raise exception 'Paid payroll is immutable'; end if;
    if old.status = 'processed' and
      (new.status not in ('processed', 'paid') or old.basic_salary is distinct from new.basic_salary or
       old.allowances is distinct from new.allowances or old.deductions is distinct from new.deductions or
       old.employee_id is distinct from new.employee_id or old.payroll_month is distinct from new.payroll_month) then
      raise exception 'Published payroll cannot be edited';
    end if;
    if old.status = 'draft' and new.status not in ('draft', 'processed') then
      raise exception 'Invalid payroll status transition';
    end if;
  end if;
  return new;
end $$;
create trigger guard_payroll_insert before insert on public.payroll_records
for each row execute function public.guard_payroll_write();
create trigger guard_payroll_update before update on public.payroll_records
for each row execute function public.guard_payroll_write();

create or replace function public.audit_payroll_write() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if tg_op = 'INSERT' then
    perform public.write_audit('payroll.created', 'payroll', new.id, 'Payroll draft created',
      jsonb_build_object('month', new.payroll_month));
  elsif old.status is distinct from new.status then
    select profile_id into owner from public.employee_profiles where id = new.employee_id;
    insert into public.notifications(recipient_id, title, message, category, related_entity_type, related_entity_id, link)
    values (owner, 'Payroll published', 'Your payroll for ' || new.payroll_month || ' is now ' || new.status || '.',
      'payroll', 'payroll', new.id, '/payroll?month=' || new.payroll_month);
    perform public.write_audit('payroll.' || new.status, 'payroll', new.id, 'Payroll marked ' || new.status,
      jsonb_build_object('month', new.payroll_month));
  elsif old is distinct from new then
    perform public.write_audit('payroll.updated', 'payroll', new.id, 'Payroll draft updated',
      jsonb_build_object('month', new.payroll_month));
  end if;
  return new;
end $$;
create trigger audit_payroll_insert after insert on public.payroll_records
for each row execute function public.audit_payroll_write();
create trigger audit_payroll_update after update on public.payroll_records
for each row execute function public.audit_payroll_write();

create or replace function public.guard_notification_read_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_management() and
    (old.recipient_id is distinct from new.recipient_id or old.title is distinct from new.title or
     old.message is distinct from new.message or old.category is distinct from new.category or
     old.related_entity_type is distinct from new.related_entity_type or
     old.related_entity_id is distinct from new.related_entity_id or old.link is distinct from new.link or
     old.created_at is distinct from new.created_at) then
    raise exception 'Only notification read state can be changed';
  end if;
  return new;
end $$;
create trigger guard_notification_read before update on public.notifications
for each row execute function public.guard_notification_read_update();

create or replace function public.notify_document_assignment() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if new.visibility = 'employee' then
    select profile_id into owner from public.employee_profiles where id = new.employee_id;
    insert into public.notifications(recipient_id, title, message, category, related_entity_type, related_entity_id, link)
    values (owner, 'New document shared', new.display_name || ' is ready to view.', 'system', 'document', new.id, '/documents');
  end if;
  perform public.write_audit('document.uploaded', 'document', new.id, 'Employee document uploaded');
  return new;
end $$;
create trigger notify_document_insert after insert on public.employee_documents
for each row execute function public.notify_document_assignment();

create or replace function public.audit_document_revoke() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.write_audit('document.revoked', 'document', old.id, 'Employee document revoked');
  return old;
end $$;
create trigger audit_document_delete after delete on public.employee_documents
for each row execute function public.audit_document_revoke();

create or replace function public.set_employee_status(p_employee_id uuid, p_status text)
returns public.employee_profiles language plpgsql security definer set search_path = public as $$
declare result public.employee_profiles; target_role text;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  if p_status not in ('active', 'inactive') then raise exception 'Invalid status'; end if;
  select p.role into target_role from public.employee_profiles e join public.profiles p on p.id = e.profile_id
  where e.id = p_employee_id for update of e, p;
  if target_role is null then raise exception 'Employee not found'; end if;
  if target_role = 'admin' and not public.is_admin() then raise exception 'Only administrators can change administrator accounts'; end if;
  if p_employee_id = public.current_employee_id() and p_status = 'inactive' then raise exception 'You cannot deactivate your own account'; end if;
  perform set_config('dayflow.status_change', 'authorized', true);
  update public.employee_profiles set employment_status = p_status where id = p_employee_id returning * into result;
  update public.profiles set account_status = p_status where id = result.profile_id;
  perform set_config('dayflow.status_change', '', true);
  return result;
end $$;

create or replace function public.update_employee_job(p_employee_id uuid, p_name text, p_designation text,
  p_department_id uuid, p_employment_type text, p_joining_date date, p_phone text, p_role text default null)
returns public.employee_profiles language plpgsql security definer set search_path = public as $$
declare result public.employee_profiles; target_profile uuid; old_role text;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 100 or char_length(trim(coalesce(p_designation, ''))) < 2
    or p_joining_date is null or p_employment_type not in ('full_time', 'part_time', 'contract', 'intern') then
    raise exception 'Invalid employee details';
  end if;
  if p_department_id is not null and not exists (select 1 from public.departments where id = p_department_id and active) then
    raise exception 'Invalid department';
  end if;
  select e.profile_id, p.role into target_profile, old_role from public.employee_profiles e
  join public.profiles p on p.id = e.profile_id where e.id = p_employee_id for update of e, p;
  if target_profile is null then raise exception 'Employee not found'; end if;
  if old_role = 'admin' and not public.is_admin() then raise exception 'Only administrators can change administrator accounts'; end if;
  if p_role is not null and (not public.is_admin() or p_role not in ('employee', 'hr', 'admin')) then
    raise exception 'Only administrators can change roles';
  end if;
  if target_profile = auth.uid() and p_role is not null and p_role <> old_role then
    raise exception 'You cannot change your own role';
  end if;
  update public.profiles set full_name = trim(p_name), role = coalesce(p_role, role) where id = target_profile;
  update public.employee_profiles set designation = trim(p_designation), department_id = p_department_id,
    employment_type = p_employment_type, joining_date = p_joining_date, phone = nullif(trim(coalesce(p_phone, '')), '')
  where id = p_employee_id returning * into result;
  return result;
end $$;

create or replace function public.publish_announcement(p_title text, p_message text, p_priority text, p_expiry_date date)
returns public.announcements language plpgsql security definer set search_path = public as $$
declare result public.announcements;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  if char_length(trim(coalesce(p_title, ''))) not between 2 and 120 or
    char_length(trim(coalesce(p_message, ''))) not between 2 and 2000 or
    p_priority not in ('normal', 'important', 'urgent') or
    (p_expiry_date is not null and p_expiry_date < public.business_date()) then
    raise exception 'Invalid announcement';
  end if;
  insert into public.announcements(title, message, priority, audience, publish_date, expiry_date, created_by)
  values (trim(p_title), trim(p_message), p_priority, 'all', public.business_date(), p_expiry_date, auth.uid())
  returning * into result;
  return result;
end $$;

create or replace function public.audit_announcement_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.active and new.publish_date <= public.business_date() then
      insert into public.notifications(recipient_id, title, message, category, related_entity_type, related_entity_id, link)
      select p.id, 'New announcement', new.title, 'announcement', 'announcement', new.id, '/home'
      from public.profiles p
      left join public.employee_profiles e on e.profile_id = p.id
      where p.account_status = 'active' and (new.audience = 'all' or
        (new.audience = 'department' and e.department_id = new.audience_department_id) or
        (new.audience = 'specific' and e.id = any(new.audience_employee_ids)));
    end if;
    perform public.write_audit('announcement.published', 'announcement', new.id, 'Announcement published');
  elsif old.active is distinct from new.active then
    perform public.write_audit('announcement.updated', 'announcement', new.id, 'Announcement visibility updated');
  end if;
  return new;
end $$;
create trigger audit_announcement_insert after insert on public.announcements
for each row execute function public.audit_announcement_write();
create trigger audit_announcement_update after update on public.announcements
for each row execute function public.audit_announcement_write();

alter policy announcements_read on public.announcements using (
  public.is_management() or
  (public.get_current_role() is not null and active and publish_date <= public.business_date() and
    (expiry_date is null or expiry_date >= public.business_date()) and
    (audience = 'all' or
      (audience = 'department' and audience_department_id =
        (select department_id from public.employee_profiles where profile_id = auth.uid())) or
      (audience = 'specific' and public.current_employee_id() = any(audience_employee_ids))))
);

create or replace function public.correct_attendance(p_record_id uuid, p_check_in timestamptz,
  p_check_out timestamptz, p_status text, p_reason text)
returns public.attendance_records language plpgsql security definer set search_path = public as $$
declare result public.attendance_records; mins integer;
begin
  if not public.is_management() then raise exception 'Permission denied'; end if;
  if p_status not in ('present', 'absent', 'half_day', 'leave') or char_length(trim(coalesce(p_reason, ''))) < 3 then
    raise exception 'Invalid attendance correction';
  end if;
  select * into result from public.attendance_records where id = p_record_id for update;
  if result.id is null then raise exception 'Attendance record not found'; end if;
  if p_check_out is not null and (p_check_in is null or p_check_out < p_check_in) then
    raise exception 'Check-out must be after check-in';
  end if;
  if p_check_in is not null and (p_check_in at time zone public.business_timezone())::date <> result.work_date then
    raise exception 'Check-in must match the work date';
  end if;
  if p_status in ('present', 'half_day') and p_check_in is null then raise exception 'Check-in is required for worked days'; end if;
  if p_status in ('absent', 'leave') and p_check_in is not null then raise exception 'Non-working days cannot have a check-in'; end if;
  mins := case when p_check_in is not null and p_check_out is not null
    then floor(extract(epoch from (p_check_out - p_check_in)) / 60)::integer else 0 end;
  update public.attendance_records set check_in = p_check_in, check_out = p_check_out,
    total_minutes = mins, status = p_status, source = 'hr_correction',
    modified_by = auth.uid(), modification_reason = trim(p_reason)
  where id = p_record_id returning * into result;
  return result;
end $$;

create or replace function public.notify_attendance_correction() returns trigger
language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  if new.source = 'hr_correction' and old is distinct from new then
    select profile_id into owner from public.employee_profiles where id = new.employee_id;
    insert into public.notifications(recipient_id, title, message, category, related_entity_type, related_entity_id, link)
    values (owner, 'Attendance corrected', 'HR updated your attendance for ' || new.work_date || '.',
      'attendance', 'attendance', new.id, '/attendance');
    perform public.write_audit('attendance.corrected', 'attendance', new.id, 'Attendance record corrected',
      jsonb_build_object('reason', new.modification_reason));
  end if;
  return new;
end $$;
create trigger notify_attendance_update after update on public.attendance_records
for each row execute function public.notify_attendance_correction();

revoke execute on function public.business_timezone() from public;
revoke execute on function public.business_date() from public;
revoke execute on function public.save_payroll_draft(uuid,text,numeric,numeric,numeric) from public;
revoke execute on function public.publish_payroll(uuid,text) from public;
revoke execute on function public.set_employee_status(uuid,text) from public;
revoke execute on function public.update_employee_job(uuid,text,text,uuid,text,date,text,text) from public;
revoke execute on function public.publish_announcement(text,text,text,date) from public;
revoke execute on function public.correct_attendance(uuid,timestamptz,timestamptz,text,text) from public;
grant execute on function public.business_timezone(), public.business_date(), public.save_payroll_draft(uuid,text,numeric,numeric,numeric), public.publish_payroll(uuid,text), public.set_employee_status(uuid,text), public.update_employee_job(uuid,text,text,uuid,text,date,text,text), public.publish_announcement(text,text,text,date), public.correct_attendance(uuid,timestamptz,timestamptz,text,text) to authenticated;
