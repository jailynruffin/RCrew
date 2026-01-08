insert into public.employees (name, role) values
  ('Ava Carter', 'Lead'),
  ('Mia Johnson', 'Crew'),
  ('Noah Brooks', 'Crew'),
  ('Liam Parker', 'Crew');

insert into public.shifts (day, start_time, end_time, title) values
  ('2026-01-07', '09:00', '12:00', 'Morning Prep'),
  ('2026-01-07', '12:00', '16:00', 'Lunch Rush'),
  ('2026-01-07', '16:00', '20:00', 'Evening Close');

insert into public.availabilities (employee_id, day, start_time, end_time)
select id, '2026-01-07', '08:00', '16:00'
from public.employees
where name in ('Ava Carter', 'Mia Johnson');

insert into public.availabilities (employee_id, day, start_time, end_time)
select id, '2026-01-07', '11:30', '20:30'
from public.employees
where name in ('Noah Brooks', 'Liam Parker');
