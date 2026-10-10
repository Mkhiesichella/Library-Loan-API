import { MemberModel } from "../models/memberModel.js";
import { sendError, httpError } from "../utils/helpers.js";

const pick = (body) => {
  const out = {};
  for (const k of ["name", "email", "phone", "address"]) {
    if (body[k] !== undefined) out[k] = body[k];
  }
  return out;
};

export const MemberController = {
  async getAll(req, res) {
    try {
      const data = await MemberModel.getAll();
      res.json({ count: data.length, data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async getById(req, res) {
    try {
      res.json({ data: await MemberModel.getById(req.params.id) });
    } catch (err) {
      sendError(res, err);
    }
  },

  async create(req, res) {
    try {
      const payload = pick(req.body || {});
      if (!payload.name) throw httpError(400, "name wajib diisi");
      const data = await MemberModel.create(payload);
      res.status(201).json({ message: "Anggota berhasil ditambahkan", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async update(req, res) {
    try {
      const payload = pick(req.body || {});
      if (!Object.keys(payload).length) throw httpError(400, "Tidak ada data untuk diubah");
      const data = await MemberModel.update(req.params.id, payload);
      res.json({ message: "Anggota berhasil diperbarui", data });
    } catch (err) {
      sendError(res, err);
    }
  },

  async remove(req, res) {
    try {
      await MemberModel.remove(req.params.id);
      res.json({ message: "Anggota berhasil dihapus" });
    } catch (err) {
      sendError(res, err);
    }
  },
};
