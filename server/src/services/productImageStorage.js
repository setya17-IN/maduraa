import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

let supabaseClient;

const getStorage = () => {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey || !env.supabaseStorageBucket) {
    throw new Error('Product image storage is not configured');
  }

  supabaseClient ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return supabaseClient.storage.from(env.supabaseStorageBucket);
};

export const getPathFromPublicUrl = (publicUrl) => {
  try {
    const url = new URL(publicUrl);
    const supabaseUrl = new URL(env.supabaseUrl);
    const prefix = `/storage/v1/object/public/${encodeURIComponent(env.supabaseStorageBucket)}/`;
    if (url.origin !== supabaseUrl.origin || !url.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    if (!path || path.startsWith('/') || path.includes('..')) return null;
    return path;
  } catch {
    return null;
  }
};

export const productImageStorage = {
  async upload({ buffer, contentType, extension }) {
    const path = `products/${randomUUID()}.${extension}`;
    const storage = getStorage();
    const { error } = await storage.upload(path, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw new Error('Product image upload failed');

    const { data } = storage.getPublicUrl(path);
    if (!data?.publicUrl) throw new Error('Product image URL could not be created');
    return { path, publicUrl: data.publicUrl };
  },

  async remove(path) {
    const { error } = await getStorage().remove([path]);
    if (error) throw new Error('Product image removal failed');
  },

  async removeByPublicUrl(publicUrl) {
    const path = getPathFromPublicUrl(publicUrl);
    if (path) await this.remove(path);
  },
};
