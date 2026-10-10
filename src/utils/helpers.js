// Membuat error dengan status HTTP tertentu
export const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// Tanggal hari ini (YYYY-MM-DD) pada zona waktu WIB
export const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

// Validasi format tanggal YYYY-MM-DD
export const isValidDate = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
};

// Tambah hari pada tanggal YYYY-MM-DD
export const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Mengubah error (Supabase/Postgres/custom) menjadi respons HTTP
export const sendError = (res, err) => {
  let status = err.status;
  let message = err.message;

  if (!status) {
    switch (err.code) {
      case "PGRST116": // .single() tidak menemukan baris
        status = 404;
        message = "Data tidak ditemukan";
        break;
      case "22P02": // format UUID salah
        status = 400;
        message = "Format ID tidak valid";
        break;
      case "23505": // unique violation
        status = 409;
        message = "Data duplikat (nilai unik sudah dipakai)";
        break;
      case "23503": // foreign key violation
        status = 409;
        message = "Data masih berelasi dengan data lain atau referensi tidak valid";
        break;
      case "23514": // check violation
        status = 400;
        message = "Nilai tidak memenuhi aturan validasi database";
        break;
      default:
        status = 500;
    }
  }
  return res.status(status).json({ error: message });
};
