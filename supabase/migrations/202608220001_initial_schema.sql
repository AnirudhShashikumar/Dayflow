-- Dayflow HRMS initial schema, functions, RLS, and storage policies.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 100),
  role text not null default 'employee' check (role in ('employee','hr','admin')),
  avatar_url text,
  account_status text not null default 'active' check (account_status in ('active','inactive')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.departments (
  id uuid primary key default gen_random_uuid(), name text not null unique, code text not null unique,
  description text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.employee_profiles (
  id uuid primary key default gen_random_uuid(), profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_code text not null unique, phone text, address text, date_of_birth date,
  emergency_contact_name text, emergency_contact_phone text,
  department_id uuid references public.departments(id) on delete set null,
  designation text not null default 'Employee', manager_id uuid references public.employee_profiles(id) on delete set null,
  employment_type text not null default 'full_time' check (employment_type in ('full_time','part_time','contract','intern')),
  joining_date date not null default current_date,
  employment_status text not null default 'active' check (employment_status in ('active','inactive','probation','resigned')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  work_date date not null default current_date, check_in timestamptz, check_out timestamptz,
  total_minutes integer not null default 0 check (total_minutes >= 0),
  status text not null default 'present' check (status in ('present','absent','half_day','leave')),
  notes text, source text not null default 'web' check (source in ('web','mobile','hr_correction','system')),
  modified_by uuid references public.profiles(id) on delete set null, modification_reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(employee_id, work_date), check (check_out is null or (check_in is not null and check_out >= check_in)),
  check (source <> 'hr_correction' or modification_reason is not null)
);

create table public.leave_types (
  id uuid primary key default gen_random_uuid(), name text not null unique, code text not null unique,
  description text, color text not null default '#68235d', default_days numeric(5,1) not null default 0 check(default_days >= 0),
  paid boolean not null default true, requires_balance boolean not null default true, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.leave_balances (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict, year integer not null default extract(year from current_date)::integer,
  balance_days numeric(5,1) not null default 0 check(balance_days >= 0), used_days numeric(5,1) not null default 0 check(used_days >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(employee_id,leave_type_id,year)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null, end_date date not null, duration_days numeric(5,1) not null check(duration_days > 0), is_half_day boolean not null default false,
  remarks text not null check(char_length(remarks) between 3 and 500), attachment_path text,
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  reviewer_id uuid references public.profiles(id) on delete set null, reviewer_comment text, reviewed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(end_date >= start_date),
  check(not is_half_day or (start_date=end_date and duration_days=0.5))
);

create table public.leave_request_history (
  id uuid primary key default gen_random_uuid(), leave_request_id uuid not null references public.leave_requests(id) on delete cascade,
  from_status text, to_status text not null check(to_status in ('pending','approved','rejected','cancelled')),
  comment text, actor_id uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);

create table public.payroll_records (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  payroll_month text not null check(payroll_month ~ '^20[0-9]{2}-(0[1-9]|1[0-2])$'),
  basic_salary numeric(12,2) not null check(basic_salary >= 0), allowances numeric(12,2) not null default 0 check(allowances >= 0),
  deductions numeric(12,2) not null default 0 check(deductions >= 0),
  gross_salary numeric(12,2) generated always as (basic_salary + allowances) stored,
  net_salary numeric(12,2) generated always as (basic_salary + allowances - deductions) stored,
  status text not null default 'draft' check(status in ('draft','processed','paid')), payment_date date,
  notes text, created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(employee_id,payroll_month),
  check(status <> 'paid' or payment_date is not null)
);

create table public.employee_documents (
  id uuid primary key default gen_random_uuid(), employee_id uuid not null references public.employee_profiles(id) on delete cascade,
  category text not null check(category in ('identity','offer_letter','contract','certificate','payslip','other')),
  display_name text not null, file_path text not null unique, file_size bigint not null check(file_size > 0), mime_type text not null,
  uploaded_by uuid references public.profiles(id) on delete set null, visibility text not null default 'employee' check(visibility in ('employee','hr_only')),
  description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, message text not null, category text not null check(category in ('leave','attendance','payroll','announcement','profile','system')),
  is_read boolean not null default false, related_entity_type text, related_entity_id uuid, link text,
  created_at timestamptz not null default now(), read_at timestamptz
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(), title text not null, message text not null,
  priority text not null default 'normal' check(priority in ('normal','important','urgent')),
  audience text not null default 'all' check(audience in ('all','department','specific')),
  audience_department_id uuid references public.departments(id) on delete cascade, audience_employee_ids uuid[] not null default '{}',
  publish_date date not null default current_date, expiry_date date, active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(expiry_date is null or expiry_date >= publish_date), check(audience <> 'department' or audience_department_id is not null)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null,
  actor_name text not null, action text not null, entity_type text not null, entity_id uuid,
  summary text not null, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create table public.organization_settings (
  id uuid primary key default gen_random_uuid(), organization_name text not null default 'Dayflow Technologies',
  timezone text not null default 'Asia/Kolkata', currency text not null default 'INR', workday_start time not null default '09:00',
  workday_end time not null default '18:00', half_day_minutes integer not null default 240, full_day_minutes integer not null default 480,
  logo_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index idx_employee_department on public.employee_profiles(department_id);
create index idx_attendance_date_employee on public.attendance_records(work_date,employee_id);
create index idx_leave_status_dates on public.leave_requests(status,start_date,end_date);
create index idx_leave_employee on public.leave_requests(employee_id,created_at desc);
create index idx_payroll_month_status on public.payroll_records(payroll_month,status);
create index idx_documents_employee on public.employee_documents(employee_id);
create index idx_notifications_recipient on public.notifications(recipient_id,is_read,created_at desc);
create index idx_activity_created on public.activity_logs(created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
do $$ declare t text; begin foreach t in array array['profiles','departments','employee_profiles','attendance_records','leave_types','leave_balances','leave_requests','payroll_records','employee_documents','announcements','organization_settings'] loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t); end loop; end $$;

create or replace function public.current_role() returns text language sql stable security definer set search_path=public as $$ select role from profiles where id=auth.uid() $$;
create or replace function public.is_management() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(current_role() in ('hr','admin'),false) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select coalesce(current_role()='admin',false) $$;
create or replace function public.current_employee_id() returns uuid language sql stable security definer set search_path=public as $$ select id from employee_profiles where profile_id=auth.uid() $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare emp_code text;
begin
  emp_code:=coalesce(new.raw_user_meta_data->>'employee_code','DF-'||upper(substr(replace(new.id::text,'-',''),1,6)));
  insert into profiles(id,email,full_name,role) values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','New Employee'),'employee');
  insert into employee_profiles(profile_id,employee_code) values(new.id,emp_code);
  return new;
exception when unique_violation then raise exception 'Employee ID or email is already registered';
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.write_audit(p_action text,p_entity_type text,p_entity_id uuid,p_summary text,p_metadata jsonb default '{}') returns void language plpgsql security definer set search_path=public as $$
declare actor text; begin select full_name into actor from profiles where id=auth.uid(); insert into activity_logs(actor_id,actor_name,action,entity_type,entity_id,summary,metadata) values(auth.uid(),coalesce(actor,'System'),p_action,p_entity_type,p_entity_id,p_summary,p_metadata); end $$;

create or replace function public.write_management_audit(p_action text,p_entity_type text,p_entity_id uuid,p_summary text,p_metadata jsonb default '{}') returns void language plpgsql security definer set search_path=public as $$
begin if not is_management() then raise exception 'Permission denied'; end if; perform write_audit(p_action,p_entity_type,p_entity_id,p_summary,p_metadata); end $$;

create or replace function public.guard_profile_update() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and old.role<>new.role and not is_admin() then raise exception 'Only administrators can change roles'; end if;
  if auth.uid() is not null and not is_management() and (old.email<>new.email or old.full_name<>new.full_name or old.role<>new.role or old.account_status<>new.account_status) then raise exception 'Employees may only update their avatar'; end if;
  return new;
end $$;
create trigger guard_profile_columns before update on public.profiles for each row execute function public.guard_profile_update();

create or replace function public.guard_employee_update() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is not null and not is_management() and (old.profile_id<>new.profile_id or old.employee_code<>new.employee_code or old.department_id is distinct from new.department_id or old.designation<>new.designation or old.manager_id is distinct from new.manager_id or old.employment_type<>new.employment_type or old.joining_date<>new.joining_date or old.employment_status<>new.employment_status or old.date_of_birth is distinct from new.date_of_birth) then raise exception 'Employees may only update permitted personal fields'; end if;
  return new;
end $$;
create trigger guard_employee_columns before update on public.employee_profiles for each row execute function public.guard_employee_update();

create or replace function public.notify_employee_profile_update() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if old is distinct from new then
    insert into notifications(recipient_id,title,message,category,related_entity_type,related_entity_id,link) values(new.profile_id,'Profile updated','Your employee profile information was updated.','profile','employee',new.id,'/profile');
    perform write_audit('employee.updated','employee',new.id,'Employee profile updated');
  end if;
  return new;
end $$;
create trigger notify_employee_update after update on public.employee_profiles for each row execute function public.notify_employee_profile_update();

create or replace function public.check_in() returns attendance_records language plpgsql security definer set search_path=public as $$
declare emp uuid; result attendance_records;
begin
  emp:=current_employee_id(); if emp is null then raise exception 'Employee profile not found'; end if;
  if exists(select 1 from attendance_records where employee_id=emp and work_date=current_date) then raise exception 'You have already checked in today'; end if;
  insert into attendance_records(employee_id,work_date,check_in,status,source) values(emp,current_date,now(),'present','web') returning * into result;
  perform write_audit('attendance.checked_in','attendance',result.id,'Employee checked in',jsonb_build_object('work_date',current_date)); return result;
end $$;

create or replace function public.check_out() returns attendance_records language plpgsql security definer set search_path=public as $$
declare result attendance_records; mins integer;
begin
  select * into result from attendance_records where employee_id=current_employee_id() and work_date=current_date for update;
  if result.id is null or result.check_in is null then raise exception 'Check-in required before check-out'; end if;
  if result.check_out is not null then raise exception 'You have already checked out today'; end if;
  mins:=greatest(0,floor(extract(epoch from(now()-result.check_in))/60)::integer);
  update attendance_records set check_out=now(),total_minutes=mins,status=case when mins<240 then 'half_day' else 'present' end where id=result.id returning * into result;
  perform write_audit('attendance.checked_out','attendance',result.id,'Employee checked out',jsonb_build_object('total_minutes',mins)); return result;
end $$;

create or replace function public.submit_leave(p_leave_type_id uuid,p_start date,p_end date,p_half_day boolean,p_remarks text,p_attachment text default null) returns leave_requests language plpgsql security definer set search_path=public as $$
declare emp uuid; days numeric(5,1); available numeric(5,1); requires boolean; result leave_requests;
begin
  emp:=current_employee_id(); if emp is null then raise exception 'Employee profile not found'; end if;
  if p_start<current_date then raise exception 'Past dates are not allowed'; end if; if p_end<p_start then raise exception 'End date must be after start date'; end if;
  days:=case when p_half_day then 0.5 else (p_end-p_start)+1 end;
  if exists(select 1 from leave_requests where employee_id=emp and status in ('pending','approved') and daterange(start_date,end_date,'[]')&&daterange(p_start,p_end,'[]')) then raise exception 'This request overlaps existing leave'; end if;
  select requires_balance into requires from leave_types where id=p_leave_type_id and active;
  if not found then raise exception 'Invalid leave type'; end if;
  if requires then select balance_days into available from leave_balances where employee_id=emp and leave_type_id=p_leave_type_id and year=extract(year from p_start); if coalesce(available,0)<days then raise exception 'Insufficient leave balance'; end if;
  insert into leave_requests(employee_id,leave_type_id,start_date,end_date,duration_days,is_half_day,remarks,attachment_path) values(emp,p_leave_type_id,p_start,p_end,days,p_half_day,p_remarks,p_attachment) returning * into result;
  insert into leave_request_history(leave_request_id,to_status,comment,actor_id) values(result.id,'pending','Request submitted',auth.uid());
  insert into notifications(recipient_id,title,message,category,related_entity_type,related_entity_id,link) select id,'New leave request','A new leave request is waiting for review.','leave','leave_request',result.id,'/leave?id='||result.id from profiles where role in ('hr','admin') and account_status='active';
  perform write_audit('leave.submitted','leave_request',result.id,'Leave request submitted',jsonb_build_object('days',days)); return result;
end $$;

create or replace function public.review_leave(p_request_id uuid,p_decision text,p_comment text) returns leave_requests language plpgsql security definer set search_path=public as $$
declare req leave_requests; requires boolean; owner uuid; d date; result leave_requests;
begin
  if not is_management() then raise exception 'Permission denied'; end if; if p_decision not in ('approved','rejected') then raise exception 'Invalid decision'; end if;
  if char_length(trim(p_comment))<2 then raise exception 'A review comment is required'; end if;
  select * into req from leave_requests where id=p_request_id for update; if req.id is null then raise exception 'Request not found'; end if; if req.status<>'pending' then raise exception 'Only pending requests can be reviewed'; end if;
  select requires_balance into requires from leave_types where id=req.leave_type_id; select profile_id into owner from employee_profiles where id=req.employee_id;
  if p_decision='approved' and requires then update leave_balances set balance_days=balance_days-req.duration_days,used_days=used_days+req.duration_days where employee_id=req.employee_id and leave_type_id=req.leave_type_id and year=extract(year from req.start_date) and balance_days>=req.duration_days; if not found then raise exception 'Insufficient leave balance'; end if; end if;
  update leave_requests set status=p_decision,reviewer_id=auth.uid(),reviewer_comment=nullif(trim(p_comment),''),reviewed_at=now() where id=req.id returning * into result;
  insert into leave_request_history(leave_request_id,from_status,to_status,comment,actor_id) values(req.id,'pending',p_decision,p_comment,auth.uid());
  if p_decision='approved' then for d in select generate_series(req.start_date,req.end_date,'1 day')::date loop insert into attendance_records(employee_id,work_date,status,source,notes) values(req.employee_id,d,'leave','system','Approved leave') on conflict(employee_id,work_date) do update set status='leave',source='system',notes='Approved leave'; end loop; end if;
  insert into notifications(recipient_id,title,message,category,related_entity_type,related_entity_id,link) values(owner,'Leave request '||p_decision,'Your leave request has been '||p_decision||'.','leave','leave_request',req.id,'/leave');
  perform write_audit('leave.'||p_decision,'leave_request',req.id,'Leave request '||p_decision,jsonb_build_object('comment',p_comment)); return result;
end $$;

create or replace function public.cancel_leave(p_request_id uuid) returns leave_requests language plpgsql security definer set search_path=public as $$
declare result leave_requests; begin update leave_requests set status='cancelled' where id=p_request_id and employee_id=current_employee_id() and status='pending' returning * into result; if result.id is null then raise exception 'Only your pending request can be cancelled'; end if; insert into leave_request_history(leave_request_id,from_status,to_status,comment,actor_id) values(result.id,'pending','cancelled','Cancelled by employee',auth.uid()); insert into notifications(recipient_id,title,message,category,related_entity_type,related_entity_id,link) select id,'Leave request cancelled','An employee cancelled a pending leave request.','leave','leave_request',result.id,'/leave?id='||result.id from profiles where role in ('hr','admin') and account_status='active'; perform write_audit('leave.cancelled','leave_request',result.id,'Leave request cancelled'); return result; end $$;

alter table public.profiles enable row level security; alter table public.departments enable row level security; alter table public.employee_profiles enable row level security;
alter table public.attendance_records enable row level security; alter table public.leave_types enable row level security; alter table public.leave_balances enable row level security;
alter table public.leave_requests enable row level security; alter table public.leave_request_history enable row level security; alter table public.payroll_records enable row level security;
alter table public.employee_documents enable row level security; alter table public.notifications enable row level security; alter table public.announcements enable row level security;
alter table public.activity_logs enable row level security; alter table public.organization_settings enable row level security;

create policy profiles_select on profiles for select using(id=auth.uid() or is_management());
create policy profiles_self_update on profiles for update using(id=auth.uid()) with check(id=auth.uid() and role=current_role());
create policy profiles_hr_update on profiles for update using(is_management()) with check(is_management() and (current_role()='admin' or role<>'admin'));
create policy departments_read on departments for select using(auth.uid() is not null);
create policy departments_admin_all on departments for all using(is_admin()) with check(is_admin());
create policy employees_read on employee_profiles for select using(profile_id=auth.uid() or is_management());
create policy employees_self_update on employee_profiles for update using(profile_id=auth.uid()) with check(profile_id=auth.uid());
create policy employees_management_all on employee_profiles for all using(is_management()) with check(is_management());
create policy attendance_read on attendance_records for select using(employee_id=current_employee_id() or is_management());
create policy attendance_management_all on attendance_records for all using(is_management()) with check(is_management());
create policy leave_types_read on leave_types for select using(auth.uid() is not null);
create policy leave_types_management on leave_types for all using(is_management()) with check(is_management());
create policy balances_read on leave_balances for select using(employee_id=current_employee_id() or is_management());
create policy balances_management on leave_balances for all using(is_management()) with check(is_management());
create policy leave_requests_read on leave_requests for select using(employee_id=current_employee_id() or is_management());
create policy leave_requests_management on leave_requests for update using(is_management()) with check(is_management());
create policy leave_history_read on leave_request_history for select using(is_management() or exists(select 1 from leave_requests r where r.id=leave_request_id and r.employee_id=current_employee_id()));
create policy payroll_read on payroll_records for select using((employee_id=current_employee_id() and status in('processed','paid')) or is_management());
create policy payroll_management on payroll_records for all using(is_management()) with check(is_management());
create policy documents_read on employee_documents for select using((employee_id=current_employee_id() and visibility='employee') or is_management());
create policy documents_management on employee_documents for all using(is_management()) with check(is_management());
create policy notifications_read on notifications for select using(recipient_id=auth.uid());
create policy notifications_update on notifications for update using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy notifications_management_insert on notifications for insert with check(is_management());
create policy announcements_read on announcements for select using(auth.uid() is not null and active and publish_date<=current_date and (expiry_date is null or expiry_date>=current_date) and (audience='all' or (audience='department' and audience_department_id=(select department_id from employee_profiles where profile_id=auth.uid())) or (audience='specific' and current_employee_id()=any(audience_employee_ids)) or is_management()));
create policy announcements_management on announcements for all using(is_management()) with check(is_management());
create policy activity_management_read on activity_logs for select using(is_management());
create policy org_settings_read on organization_settings for select using(auth.uid() is not null);
create policy org_settings_admin on organization_settings for all using(is_admin()) with check(is_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('employee-documents','employee-documents',false,10485760,array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document']) on conflict(id) do nothing;
create policy storage_employee_read on storage.objects for select using(bucket_id='employee-documents' and (is_management() or exists(select 1 from employee_documents d where d.file_path=name and d.employee_id=current_employee_id() and d.visibility='employee')));
create policy storage_management_insert on storage.objects for insert with check(bucket_id='employee-documents' and is_management());
create policy storage_management_update on storage.objects for update using(bucket_id='employee-documents' and is_management());
create policy storage_management_delete on storage.objects for delete using(bucket_id='employee-documents' and is_management());

revoke execute on function public.write_audit(text,text,uuid,text,jsonb) from public;
grant execute on function public.write_management_audit(text,text,uuid,text,jsonb) to authenticated;
grant execute on function public.check_in() to authenticated; grant execute on function public.check_out() to authenticated;
grant execute on function public.submit_leave(uuid,date,date,boolean,text,text) to authenticated;
grant execute on function public.review_leave(uuid,text,text) to authenticated; grant execute on function public.cancel_leave(uuid) to authenticated;
