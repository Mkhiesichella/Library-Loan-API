import { supabase } from "../config/supabaseClient.js";
import { BookModel } from "./bookModel.js";
import { MemberModel } from "./memberModel.js";
import { httpError, today, addDays } from "../utils/helpers.js";

const SELECT =
  "id, member_id, book_id, loan_date, due_date, return_date, status, created_at, " +
  "members(id, name, email), books(id, title, author)";

export const LOAN_DURATION_DAYS = 7;
export const VALID_STATUS = ["Dipinjam", "Dikembalikan", "Terlambat"];

// Status "Terlambat" dihitung otomatis: masih dipinjam & lewat jatuh tempo
const withStatus = (loan) => {
  if (loan && loan.status === "Dipinjam" && loan.due_date < today()) {
    return { ...loan, status: "Terlambat" };
  }
  return loan;
};

export const LoanModel = {
  // filters: { status, member_id, book_id }
  async getAll(filters = {}) {
    let query = supabase
      .from("loans")
      .select(SELECT)
      .order("loan_date", { ascending: false });

    if (filters.member_id) query = query.eq("member_id", filters.member_id);
    if (filters.book_id) query = query.eq("book_id", filters.book_id);

    if (filters.status) {
      const wanted = VALID_STATUS.find(
        (s) => s.toLowerCase() === String(filters.status).toLowerCase()
      );
      if (!wanted) {
        throw httpError(
          400,
          `Status tidak valid. Gunakan salah satu: ${VALID_STATUS.join(", ")}`
        );
      }
      if (wanted === "Dikembalikan") {
        query = query.eq("status", "Dikembalikan");
      } else if (wanted === "Terlambat") {
        query = query.eq("status", "Dipinjam").lt("due_date", today());
      } else {
        query = query.eq("status", "Dipinjam").gte("due_date", today());
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(withStatus);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("loans")
      .select(SELECT)
      .eq("id", id)
      .single();
    if (error) throw error;
    return withStatus(data);
  },

  async create({ member_id, book_id, loan_date, due_date }) {
    await MemberModel.getById(member_id).catch((e) => {
      throw e.code === "PGRST116" ? httpError(404, "Anggota tidak ditemukan") : e;
    });
    await BookModel.getById(book_id).catch((e) => {
      throw e.code === "PGRST116" ? httpError(404, "Buku tidak ditemukan") : e;
    });

    const start = loan_date || today();
    const due = due_date || addDays(start, LOAN_DURATION_DAYS);
    if (due < start) throw httpError(400, "due_date tidak boleh sebelum loan_date");

    // Kurangi stok dulu; jika insert gagal, stok dikembalikan
    await BookModel.adjustStock(book_id, -1);
    try {
      const { data, error } = await supabase
        .from("loans")
        .insert([{ member_id, book_id, loan_date: start, due_date: due, status: "Dipinjam" }])
        .select(SELECT)
        .single();
      if (error) throw error;
      return withStatus(data);
    } catch (err) {
      await BookModel.adjustStock(book_id, +1);
      throw err;
    }
  },

  // Mengubah loan_date, due_date, dan/atau status
  async update(id, payload) {
    const current = await this.getById(id);
    const raw = current.status === "Terlambat" ? "Dipinjam" : current.status;
    const changes = {};

    if (payload.loan_date) changes.loan_date = payload.loan_date;
    if (payload.due_date) changes.due_date = payload.due_date;

    const start = changes.loan_date || current.loan_date;
    const due = changes.due_date || current.due_date;
    if (due < start) throw httpError(400, "due_date tidak boleh sebelum loan_date");

    if (payload.status) {
      // "Terlambat" bersifat otomatis, bukan nilai yang boleh diisi manual
      if (!["Dipinjam", "Dikembalikan"].includes(payload.status)) {
        throw httpError(400, 'status hanya boleh "Dipinjam" atau "Dikembalikan"');
      }
      if (payload.status !== raw) {
        if (payload.status === "Dikembalikan") {
          await BookModel.adjustStock(current.book_id, +1);
          changes.status = "Dikembalikan";
          changes.return_date = payload.return_date || today();
        } else {
          await BookModel.adjustStock(current.book_id, -1);
          changes.status = "Dipinjam";
          changes.return_date = null;
        }
      }
    }

    if (!Object.keys(changes).length) return current;

    const { data, error } = await supabase
      .from("loans")
      .update(changes)
      .eq("id", id)
      .select(SELECT)
      .single();
    if (error) throw error;
    return withStatus(data);
  },

  // Pengembalian buku
  async returnBook(id) {
    const loan = await this.getById(id);
    if (loan.status === "Dikembalikan") {
      throw httpError(409, "Buku sudah dikembalikan sebelumnya");
    }
    return this.update(id, { status: "Dikembalikan" });
  },

  async remove(id) {
    const loan = await this.getById(id);
    const { error } = await supabase.from("loans").delete().eq("id", id);
    if (error) throw error;
    // Jika peminjaman masih aktif, stok buku dikembalikan
    if (loan.status !== "Dikembalikan") {
      await BookModel.adjustStock(loan.book_id, +1);
    }
  },
};
