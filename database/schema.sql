-- Jalankan di Supabase: SQL Editor > New query > RUN

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique,
  phone text,
  address text
);

create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  isbn text unique,
  stock integer not null default 1 check (stock >= 0)
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete restrict,
  book_id uuid not null references books(id) on delete restrict,
  loan_date date not null default current_date,
  due_date date not null default (current_date + 7),
  return_date date,
  status text not null default 'Dipinjam'
    check (status in ('Dipinjam', 'Dikembalikan')),
  created_at timestamptz not null default now(),
  check (due_date >= loan_date)
);

create index loans_status_due_idx on loans (status, due_date);
create index loans_member_idx on loans (member_id);
create index loans_book_idx on loans (book_id);
