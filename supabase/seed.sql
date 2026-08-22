-- Fictional Dayflow Technologies demo data. Password for every demo account: Dayflow@2026
-- Reset the public schema/project before re-running this file.
insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
values
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000001','authenticated','authenticated','admin@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Ananya Iyer","employee_code":"DF-001"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000002','authenticated','authenticated','hr@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Rohan Mehta","employee_code":"DF-002"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000003','authenticated','authenticated','employee@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Aarav Sharma","employee_code":"DF-003"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000004','authenticated','authenticated','priya@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Priya Nair","employee_code":"DF-004"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000005','authenticated','authenticated','vikram@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Vikram Rao","employee_code":"DF-005"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000006','authenticated','authenticated','meera@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Meera Kapoor","employee_code":"DF-006"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000007','authenticated','authenticated','kabir@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Kabir Singh","employee_code":"DF-007"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000008','authenticated','authenticated','isha@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Isha Kulkarni","employee_code":"DF-008"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000009','authenticated','authenticated','arjun@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Arjun Patel","employee_code":"DF-009"}',now(),now(),'','','',''),
('00000000-0000-0000-0000-000000000000','10000000-0000-0000-0000-000000000010','authenticated','authenticated','neha@dayflow.demo',crypt('Dayflow@2026',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Neha Verma","employee_code":"DF-010"}',now(),now(),'','','','');

insert into auth.identities (id,user_id,provider_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
select gen_random_uuid(),id,email,jsonb_build_object('sub',id::text,'email',email),'email',now(),now(),now() from auth.users where email like '%@dayflow.demo';

update public.profiles set role='admin' where email='admin@dayflow.demo'; update public.profiles set role='hr' where email='hr@dayflow.demo';

insert into public.departments(id,name,code,description) values
('20000000-0000-0000-0000-000000000001','Engineering','ENG','Product engineering and platform'),
('20000000-0000-0000-0000-000000000002','Product','PRD','Product strategy and delivery'),
('20000000-0000-0000-0000-000000000003','Design','DSN','Product and brand design'),
('20000000-0000-0000-0000-000000000004','Operations','OPS','Business and people operations'),
('20000000-0000-0000-0000-000000000005','Human Resources','HRS','People experience'),
('20000000-0000-0000-0000-000000000006','Finance','FIN','Finance and compliance');

update employee_profiles e set department_id='20000000-0000-0000-0000-000000000004',designation='Chief People Officer',joining_date=current_date-interval '900 days' from profiles p where e.profile_id=p.id and p.email='admin@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000005',designation='HR Business Partner',joining_date=current_date-interval '600 days' from profiles p where e.profile_id=p.id and p.email='hr@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000001',designation='Senior Software Engineer',joining_date=current_date-interval '420 days',phone='+91 98765 41003',address='Indiranagar, Bengaluru',emergency_contact_name='Kavita Sharma',emergency_contact_phone='+91 98765 42003' from profiles p where e.profile_id=p.id and p.email='employee@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000002',designation='Product Manager',joining_date=current_date-interval '350 days' from profiles p where e.profile_id=p.id and p.email='priya@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000001',designation='Platform Engineer',joining_date=current_date-interval '300 days' from profiles p where e.profile_id=p.id and p.email='vikram@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000003',designation='Product Designer',joining_date=current_date-interval '240 days' from profiles p where e.profile_id=p.id and p.email='meera@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000004',designation='Operations Analyst',joining_date=current_date-interval '180 days' from profiles p where e.profile_id=p.id and p.email='kabir@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000001',designation='Frontend Engineer',joining_date=current_date-interval '120 days' from profiles p where e.profile_id=p.id and p.email='isha@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000006',designation='Financial Analyst',joining_date=current_date-interval '75 days' from profiles p where e.profile_id=p.id and p.email='arjun@dayflow.demo';
update employee_profiles e set department_id='20000000-0000-0000-0000-000000000003',designation='Visual Designer',joining_date=current_date-interval '28 days',employment_status='probation' from profiles p where e.profile_id=p.id and p.email='neha@dayflow.demo';

insert into leave_types(id,name,code,description,color,default_days,paid,requires_balance) values
('30000000-0000-0000-0000-000000000001','Paid leave','PL','Planned personal time off','#68235d',18,true,true),
('30000000-0000-0000-0000-000000000002','Sick leave','SL','Health and recovery leave','#3e8f75',10,true,true),
('30000000-0000-0000-0000-000000000003','Unpaid leave','UL','Leave without pay','#d58a50',0,false,false);

insert into leave_balances(employee_id,leave_type_id,year,balance_days,used_days)
select e.id,l.id,extract(year from current_date)::integer,case l.code when 'PL' then 14 when 'SL' then 8 else 0 end,case l.code when 'PL' then 4 when 'SL' then 2 else 0 end from employee_profiles e cross join leave_types l;

-- Thirty days of deterministic attendance, excluding Sundays.
insert into attendance_records(employee_id,work_date,check_in,check_out,total_minutes,status,source)
select e.id,d::date,d::date+time '09:15'+((abs(hashtext(e.id::text||d::text))%35)||' minutes')::interval,d::date+time '17:45'+((abs(hashtext(d::text||e.id::text))%45)||' minutes')::interval,510+(abs(hashtext(e.id::text||d::text))%45),'present','system'
from employee_profiles e cross join generate_series(current_date-interval '30 days',current_date-interval '1 day',interval '1 day') d where extract(isodow from d)<7;

insert into leave_requests(id,employee_id,leave_type_id,start_date,end_date,duration_days,remarks,status,reviewer_id,reviewer_comment,reviewed_at,created_at)
select '40000000-0000-0000-0000-000000000001',e.id,'30000000-0000-0000-0000-000000000002',current_date+3,current_date+4,2,'Doctor advised two days of rest.','pending',null,null,null,now()-interval '2 hours' from employee_profiles e join profiles p on p.id=e.profile_id where p.email='employee@dayflow.demo';
insert into leave_requests(id,employee_id,leave_type_id,start_date,end_date,duration_days,remarks,status,reviewer_id,reviewer_comment,reviewed_at,created_at)
select '40000000-0000-0000-0000-000000000002',e.id,'30000000-0000-0000-0000-000000000001',current_date-12,current_date-11,2,'Family event out of station.','approved','10000000-0000-0000-0000-000000000002','Approved. Have a good break.',now()-interval '14 days',now()-interval '16 days' from employee_profiles e join profiles p on p.id=e.profile_id where p.email='priya@dayflow.demo';
insert into leave_requests(id,employee_id,leave_type_id,start_date,end_date,duration_days,remarks,status,reviewer_id,reviewer_comment,reviewed_at,created_at)
select '40000000-0000-0000-0000-000000000003',e.id,'30000000-0000-0000-0000-000000000001',current_date+8,current_date+12,5,'Personal travel.','rejected','10000000-0000-0000-0000-000000000002','Critical release week; please choose alternate dates.',now()-interval '1 day',now()-interval '3 days' from employee_profiles e join profiles p on p.id=e.profile_id where p.email='vikram@dayflow.demo';

insert into leave_request_history(leave_request_id,from_status,to_status,comment,actor_id) values
('40000000-0000-0000-0000-000000000001',null,'pending','Request submitted','10000000-0000-0000-0000-000000000003'),
('40000000-0000-0000-0000-000000000002','pending','approved','Approved. Have a good break.','10000000-0000-0000-0000-000000000002'),
('40000000-0000-0000-0000-000000000003','pending','rejected','Critical release week; please choose alternate dates.','10000000-0000-0000-0000-000000000002');

insert into payroll_records(employee_id,payroll_month,basic_salary,allowances,deductions,status,payment_date,created_by)
select e.id,to_char(m,'YYYY-MM'),case when p.role in('admin','hr') then 115000 else 75000+(abs(hashtext(e.id::text))%30000) end,12500,4500,'paid',(date_trunc('month',m)+interval '1 month - 3 days')::date,'10000000-0000-0000-0000-000000000001'
from employee_profiles e join profiles p on p.id=e.profile_id cross join generate_series(date_trunc('month',current_date)-interval '2 months',date_trunc('month',current_date)-interval '1 month',interval '1 month') m;
insert into payroll_records(employee_id,payroll_month,basic_salary,allowances,deductions,status,created_by)
select e.id,to_char(current_date,'YYYY-MM'),case when p.role in('admin','hr') then 115000 else 75000+(abs(hashtext(e.id::text))%30000) end,12500,4500,'processed','10000000-0000-0000-0000-000000000001' from employee_profiles e join profiles p on p.id=e.profile_id where p.email not in('neha@dayflow.demo','arjun@dayflow.demo');

insert into announcements(title,message,priority,audience,publish_date,expiry_date,created_by) values
('Quarterly town hall','Join us Friday at 4:00 PM in the all-hands space for product updates and team recognition.','important','all',current_date-2,current_date+12,'10000000-0000-0000-0000-000000000002'),
('Wellness Wednesday','A guided ergonomics session will be held in the collaboration room at 3:00 PM.','normal','all',current_date-1,current_date+6,'10000000-0000-0000-0000-000000000002');

insert into notifications(recipient_id,title,message,category,related_entity_type,related_entity_id,link,created_at)
select p.id,'Payroll published','Your payslip for last month is ready.','payroll','payroll',r.id,'/payroll',now()-interval '3 days' from profiles p join employee_profiles e on e.profile_id=p.id join payroll_records r on r.employee_id=e.id where p.email='employee@dayflow.demo' order by r.payroll_month desc limit 1;
insert into notifications(recipient_id,title,message,category,link,created_at)
select id,'Quarterly town hall','A new important announcement was published.','announcement','/overview',now()-interval '1 day' from profiles;

insert into activity_logs(actor_id,actor_name,action,entity_type,entity_id,summary,metadata,created_at) values
('10000000-0000-0000-0000-000000000002','Rohan Mehta','announcement.published','announcement',null,'Published “Quarterly town hall”','{}',now()-interval '1 day'),
('10000000-0000-0000-0000-000000000001','Ananya Iyer','payroll.processed','payroll',null,'Processed the monthly payroll run',jsonb_build_object('month',to_char(current_date,'YYYY-MM')),now()-interval '2 days'),
('10000000-0000-0000-0000-000000000002','Rohan Mehta','leave.approved','leave_request','40000000-0000-0000-0000-000000000002','Approved Priya Nair’s paid leave','{}',now()-interval '14 days');

insert into organization_settings(organization_name,timezone,currency) values('Dayflow Technologies','Asia/Kolkata','INR');
