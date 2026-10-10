import { supabase } from "../config/supabaseClient.js";
import { httpError } from "../utils/helpers.js";

export const MemberModel = {
  async getAll() {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from("members")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("members")
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from("members")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from("members")
      .delete()
      .eq("id", id)
      .select();
    if (error) throw error;
    if (!data.length) throw httpError(404, "Data tidak ditemukan");
  },
};
