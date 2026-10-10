import { supabase } from "../config/supabaseClient.js";
import { httpError } from "../utils/helpers.js";

export const BookModel = {
  async getAll() {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("title", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("books")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("books")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from("books")
      .delete()
      .eq("id", id)
      .select();
    if (error) throw error;
    if (!data.length) throw httpError(404, "Data tidak ditemukan");
  },

  // Tambah/kurangi stok. Memakai optimistic lock agar aman dari balapan data.
  async adjustStock(id, delta) {
    const book = await this.getById(id);
    const newStock = book.stock + delta;
    if (newStock < 0) throw httpError(409, `Stok buku "${book.title}" habis`);

    const { data, error } = await supabase
      .from("books")
      .update({ stock: newStock })
      .eq("id", id)
      .eq("stock", book.stock)
      .select();
    if (error) throw error;
    if (!data.length) throw httpError(409, "Stok buku berubah, silakan coba lagi");
    return data[0];
  },
};
