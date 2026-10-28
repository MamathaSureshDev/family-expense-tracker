-- Family Expense Tracker database setup
-- This intentionally allows public, unauthenticated access to the ledger.
-- Anyone with the app URL can read, add, edit, and delete expenses.
create extension if not exists pgcrypto;

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  amount numeric(12,2) not null check (amount > 0),
  paid_by text not null check (paid_by in ('Manjula', 'Mamatha', 'Mahesh')),
  expense_date date not null default current_date,
  category text not null default 'Other',
  split_between text[] not null default array['Manjula','Mamatha','Mahesh']::text[],
  notes text,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

drop policy if exists "Public can view family expenses" on public.expenses;
create policy "Public can view family expenses"
on public.expenses for select to anon using (true);

drop policy if exists "Public can add family expenses" on public.expenses;
create policy "Public can add family expenses"
on public.expenses for insert to anon with check (
  paid_by in ('Manjula', 'Mamatha', 'Mahesh')
  and amount > 0
  and char_length(title) between 1 and 120
);

drop policy if exists "Public can edit family expenses" on public.expenses;
create policy "Public can edit family expenses"
on public.expenses for update to anon using (true) with check (
  paid_by in ('Manjula', 'Mamatha', 'Mahesh')
  and amount > 0
  and char_length(title) between 1 and 120
);

drop policy if exists "Public can delete family expenses" on public.expenses;
create policy "Public can delete family expenses"
on public.expenses for delete to anon using (true);

grant select, insert, update, delete on public.expenses to anon;
