
insert into branches (name, city, manager_name)
select 'الفرع الرئيسي', 'الرياض', 'مدير الفرع'
where not exists (select 1 from branches where name='الفرع الرئيسي');

insert into branches (name, city, manager_name)
select 'فرع السليمانية', 'الرياض', 'مدير السليمانية'
where not exists (select 1 from branches where name='فرع السليمانية');

insert into users_profiles (full_name, email, phone, role)
select 'مدثر صابر', 'mdthrsber@gmail.com', '', 'general_manager'
where not exists (select 1 from users_profiles where email='mdthrsber@gmail.com');
