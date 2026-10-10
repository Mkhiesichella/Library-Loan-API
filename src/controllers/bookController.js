import { BookModel } from "../models/bookModel.js";
import { sendError, httpError } from "../utils/helpers.js";

const pick = (body) => {
  const out = {};
  for (const k of ["title", "author", "isbn", "stock"]) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
};

const checkStock = (payload) => {
  if (payload.stock !== undefined && (!Number.isInteger(payload.stock) || payload.stock < 0)) {
    throw httpError(400, "stock harus berupa bilangan bulat >= 0");
  }
};

export const BookController = {
  async getAll(req, res) {
    try {
      const data = await BookModel.getAll();
      res.json({ count: data.length, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getById(req, res) {
    try {
      res.json({ data: await BookModel.getById(req.params.id) });
    } catch (err) {
      sendError(res, err);
    }
  },

  async create(req, res) {
    try {
      const payload = pick(req.body || {});
      if (!payload.title) throw httpError(400, "title wajib diisi");
      checkStock(payload);
      const data = await BookModel.create(payload);
      res.status(201).json({ message: "Buku berhasil ditambahkan", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async update(req, res) {
    try {
      const payload = pick(req.body || {});
      if (!Object.keys(payload).length) throw httpError(400, "Tidak ada data untuk diubah");
      checkStock(payload);
      const data = await BookModel.update(req.params.id, payload);
      res.json({ message: "Buku berhasil diperbarui", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async remove(req, res) {
    try {
      await BookModel.remove(req.params.id);
      res.json({ message: "Buku berhasil dihapus" });
    } catch (err) {
      sendError(res, err);
    }
  },
};
