import { LoanModel } from "../models/loanModel.js";
import { sendError, httpError, isValidDate } from "../utils/helpers.js";

const checkDates = (body) => {
  for (const k of ["loan_date", "due_date", "return_date"]) {
    if (body[k] !== undefined && !isValidDate(body[k])) {
      throw httpError(400, `${k} harus berformat YYYY-MM-DD`);
    }
  }
};

export const LoanController = {
  // GET /loans?status=Terlambat&member_id=...&book_id=...
  async getAll(req, res) {
    try {
      const { status, member_id, book_id } = req.query;
      const data = await LoanModel.getAll({ status, member_id, book_id });
      res.json({ count: data.length, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getById(req, res) {
    try {
      res.json({ data: await LoanModel.getById(req.params.id) });
    } catch (err) {
      sendError(res, err);
    }
  },

  async create(req, res) {
    try {
      const body = req.body || {};
      if (!body.member_id || !body.book_id) {
        throw httpError(400, "member_id dan book_id wajib diisi");
      }
      checkDates(body);
      const data = await LoanModel.create(body);
      res.status(201).json({ message: "Peminjaman berhasil dicatat", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async update(req, res) {
    try {
      const body = req.body || {};
      const allowed = ["loan_date", "due_date", "status", "return_date"];
      const payload = Object.fromEntries(
        Object.entries(body).filter(([k]) => allowed.includes(k))
      );
      if (!Object.keys(payload).length) {
        throw httpError(400, "Kirim minimal satu field: loan_date, due_date, atau status");
      }
      checkDates(payload);
      const data = await LoanModel.update(req.params.id, payload);
      res.json({ message: "Peminjaman berhasil diperbarui", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  // PATCH /loans/:id/return
  async returnBook(req, res) {
    try {
      const data = await LoanModel.returnBook(req.params.id);
      res.json({ message: "Buku berhasil dikembalikan", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async remove(req, res) {
    try {
      await LoanModel.remove(req.params.id);
      res.json({ message: "Data peminjaman berhasil dihapus" });
    } catch (err) {
      sendError(res, err);
    }
  },
};
