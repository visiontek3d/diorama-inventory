import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { Component, Diorama, Transaction } from '../types';

// ─── Photo Upload ─────────────────────────────────────────────────────────────

async function uploadPhotoIfLocal(uri: string, sku: string): Promise<string> {
  if (uri.startsWith('https://')) return uri;
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0] ?? 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const mimeType = safeExt === 'jpg' ? 'image/jpeg' : `image/${safeExt}`;
  const fileName = `${sku.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${safeExt}`;

  // Read file as base64 via expo-file-system (reliable on Android/iOS)
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' as any });

  // Decode base64 to Uint8Array for Supabase Storage upload
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error } = await supabase.storage
    .from('diorama-photos')
    .upload(fileName, bytes, { contentType: mimeType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('diorama-photos').getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getSetting(
  key: 'desired_stock' | 'carry_stock_color'
): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_settings')
    .select(key)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return null;
  return (data as any)[key]?.toString() ?? null;
}

export async function setSetting(
  key: 'desired_stock' | 'carry_stock_color',
  value: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const payload: any = { user_id: user.id };
  if (key === 'desired_stock') payload.desired_stock = parseInt(value, 10) || 0;
  else payload.carry_stock_color = value;
  await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
}

// ─── Dioramas ─────────────────────────────────────────────────────────────────

export async function getAllDioramas(): Promise<Diorama[]> {
  const { data, error } = await supabase
    .from('dioramas')
    .select('*')
    .order('sku', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Diorama[];
}

export async function getDiorama(sku: string): Promise<Diorama | null> {
  const { data } = await supabase
    .from('dioramas')
    .select('*')
    .eq('sku', sku)
    .maybeSingle();
  return (data as Diorama) ?? null;
}

export async function createDiorama(
  sku: string,
  description: string,
  photo_uri: string | null,
  carry_stock: boolean
): Promise<void> {
  let photo_url = photo_uri;
  if (photo_uri) photo_url = await uploadPhotoIfLocal(photo_uri, sku);
  const { error } = await supabase.from('dioramas').insert({
    sku,
    description,
    photo_url,
    carry_stock,
  });
  if (error) throw error;
}

export async function updateDiorama(
  sku: string,
  description: string,
  photo_uri: string | null,
  carry_stock: boolean
): Promise<void> {
  let photo_url = photo_uri;
  if (photo_uri) photo_url = await uploadPhotoIfLocal(photo_uri, sku);
  const { error } = await supabase
    .from('dioramas')
    .update({ description, photo_url, carry_stock })
    .eq('sku', sku);
  if (error) throw error;
}

export async function updateDioramaPhoto(sku: string, photo_uri: string): Promise<void> {
  const photo_url = await uploadPhotoIfLocal(photo_uri, sku);
  const { error } = await supabase
    .from('dioramas')
    .update({ photo_url })
    .eq('sku', sku);
  if (error) throw error;
}

export async function deleteDiorama(sku: string): Promise<void> {
  await supabase.from('transactions').delete().eq('sku', sku);
  const { error } = await supabase.from('dioramas').delete().eq('sku', sku);
  if (error) throw error;
}

export async function adjustInventory(
  sku: string,
  component: Component,
  qty: number
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.rpc('adjust_inventory', {
    p_sku: sku,
    p_component: component,
    p_delta: qty,
    p_user_email: user?.email ?? null,
  });
  if (error) throw error;
}

export async function adjustOneOffInventory(
  sku: string,
  liftQty: number,
  odQty: number,
  sign: 1 | -1
): Promise<void> {
  const { error } = await supabase.rpc('adjust_one_off_inventory', {
    p_sku: sku,
    p_lift_delta: sign * liftQty,
    p_od_delta: sign * odQty,
  });
  if (error) throw error;
}

export async function getTransactions(sku: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('sku', sku)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function searchDioramas(query: string): Promise<Diorama[]> {
  const { data, error } = await supabase
    .from('dioramas')
    .select('*')
    .or(`sku.ilike.%${query}%,description.ilike.%${query}%`)
    .order('sku', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Diorama[];
}

export type BulkImportResult = { inserted: number; skipped: number; errors: string[] };

export async function bulkImportDioramas(
  rows: { sku: string; description: string; walls: number; open_door: number; lift: number }[]
): Promise<BulkImportResult> {
  const result: BulkImportResult = { inserted: 0, skipped: 0, errors: [] };

  // Fetch existing SKUs in one query
  const { data: existing } = await supabase
    .from('dioramas')
    .select('sku')
    .in('sku', rows.map((r) => r.sku));
  const existingSkus = new Set((existing ?? []).map((r: any) => r.sku));

  const toInsert = rows.filter((r) => {
    if (existingSkus.has(r.sku)) { result.skipped++; return false; }
    return true;
  });

  if (toInsert.length === 0) return result;

  const { error } = await supabase.from('dioramas').upsert(
    toInsert.map((r) => ({
      sku: r.sku,
      description: r.description,
      walls_qty: r.walls,
      open_door_qty: r.open_door,
      lift_qty: r.lift,
    })),
    { onConflict: 'sku', ignoreDuplicates: true }
  );

  if (error) {
    result.errors.push(error.message);
  } else {
    result.inserted = toInsert.length;
  }

  return result;
}
