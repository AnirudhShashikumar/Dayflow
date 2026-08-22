-- Dayflow Technologies single employee seed
-- Password for the single employee account: Dayflow@2026

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
values (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '10000000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'employee@dayflow.com',
  '$2a$10$Q8WpDLjIm6MvMUjlUGgYY.zXzQ5bqj7ovS8aYqarjC6B2wRZg00HS',
  now(),
  jsonb_build_object('provider','email','providers',array['email']),
  jsonb_build_object('full_name','Alex Morgan','employee_code','DF-001'),
  now(),now(),'','','',''
) on conflict (id) do nothing;

insert into auth.identities (id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select gen_random_uuid(),'10000000-0000-0000-0000-000000000001'::uuid,'employee@dayflow.com',jsonb_build_object('sub','10000000-0000-0000-0000-000000000001','email','employee@dayflow.com'),'email',now(),now(),now()
on conflict do nothing;

insert into public.departments(id,name,code,description) values
('20000000-0000-0000-0000-000000000001','Engineering','ENG','Product engineering and platform'),
('20000000-0000-0000-0000-000000000002','Product','PRD','Product strategy and delivery'),
('20000000-0000-0000-0000-000000000003','Design','DSN','Product and brand design'),
('20000000-0000-0000-0000-000000000004','Operations','OPS','Business and people operations'),
('20000000-0000-0000-0000-000000000005','Human Resources','HRS','People experience'),
('20000000-0000-0000-0000-000000000006','Finance','FIN','Finance and compliance')
on conflict (id) do update set name=excluded.name, code=excluded.code, description=excluded.description;

update employee_profiles e set
  department_id='20000000-0000-0000-0000-000000000001',
  designation='Senior Software Engineer',
  joining_date='2026-01-01',
  phone='+91 98765 43210',
  address='Indiranagar, Bengaluru',
  emergency_contact_name='Sarah Morgan',
  emergency_contact_phone='+91 98765 43211'
from profiles p where e.profile_id=p.id and p.email='employee@dayflow.com';

insert into leave_types(id,name,code,description,color,default_days,paid,requires_balance) values
('30000000-0000-0000-0000-000000000001','Paid leave','PL','Planned personal time off','#68235d',18,true,true),
('30000000-0000-0000-0000-000000000002','Sick leave','SL','Health and recovery leave','#3e8f75',10,true,true),
('30000000-0000-0000-0000-000000000003','Unpaid leave','UL','Leave without pay','#d58a50',0,false,false)
on conflict (id) do update set name=excluded.name, code=excluded.code, default_days=excluded.default_days;

insert into leave_balances(employee_id,leave_type_id,year,balance_days,used_days)
select e.id,l.id,extract(year from current_date)::integer,case l.code when 'PL' then 18 when 'SL' then 10 else 0 end,0
from employee_profiles e cross join leave_types l
join profiles p on p.id=e.profile_id
where p.email='employee@dayflow.com'
on conflict (employee_id,leave_type_id,year) do update set balance_days=excluded.balance_days, used_days=excluded.used_days;

insert into organization_settings(id,organization_name,timezone,currency)
values('50000000-0000-0000-0000-000000000001','Dayflow Technologies','Asia/Kolkata','INR')
on conflict (id) do update set organization_name=excluded.organization_name;
