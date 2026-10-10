-- (Opsional) Data contoh agar filter ?status=Terlambat langsung bisa dicoba

insert into members (name, email, phone, address) values
  ('Budi Santoso', 'budi@email.com', '08123456789', 'Jl. Merdeka No. 10, Semarang'),
  ('Siti Aminah',  'siti@email.com', '08129876543', 'Jl. Pemuda No. 5, Semarang');

insert into books (title, author, isbn, stock) values
  ('Laskar Pelangi', 'Andrea Hirata', '9789793062792', 3),
  ('Bumi Manusia', 'Pramoedya Ananta Toer', '9789799731234', 2),
  ('Pemrograman Web dengan Node.js', 'Penulis Contoh', '9786020000001', 5);

-- Terlambat (jatuh tempo sudah lewat, belum dikembalikan)
insert into loans (member_id, book_id, loan_date, due_date)
select m.id, b.id, current_date - 14, current_date - 7
from members m, books b
where m.email = 'budi@email.com' and b.isbn = '9789793062792';

-- Sedang dipinjam (belum jatuh tempo)
insert into loans (member_id, book_id, loan_date, due_date)
select m.id, b.id, current_date - 2, current_date + 5
from members m, books b
where m.email = 'siti@email.com' and b.isbn = '9789799731234';

-- Sudah dikembalikan
insert into loans (member_id, book_id, loan_date, due_date, return_date, status)
select m.id, b.id, current_date - 20, current_date - 13, current_date - 15, 'Dikembalikan'
from members m, books b
where m.email = 'siti@email.com' and b.isbn = '9786020000001';

-- Sesuaikan stok dengan peminjaman aktif
update books set stock = stock - 1 where isbn in ('9789793062792', '9789799731234');
