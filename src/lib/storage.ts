import crypto from 'crypto';

const cloud = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export const isPersistentStorageConfigured = Boolean(cloud && apiKey && apiSecret);

function sign(params: Record<string,string>, secret: string) {
  const body = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('sha1').update(body + secret).digest('hex');
}

export async function uploadPersistent(file: File, folder: string) {
  if (!isPersistentStorageConfigured) throw new Error('PERSISTENT_STORAGE_NOT_CONFIGURED');
  const timestamp = Math.floor(Date.now()/1000).toString();
  const folderName = `${process.env.CLOUDINARY_UPLOAD_FOLDER ?? 'empire-shop'}/${folder}`;
  const signature = sign({ folder: folderName, timestamp }, apiSecret!);
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', apiKey!);
  form.append('timestamp', timestamp);
  form.append('folder', folderName);
  form.append('signature', signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`STORAGE_UPLOAD_FAILED:${res.status}`);
  const data = await res.json() as { secure_url?: string; public_id?: string; resource_type?: string };
  if (!data.secure_url) throw new Error('STORAGE_NO_URL');
  return data;
}

export async function deletePersistent(url: string) {
  if (!isPersistentStorageConfigured) return;
  try {
    const u = new URL(url);
    const marker = '/upload/';
    const i = u.pathname.indexOf(marker);
    if (i < 0) return;
    const rest = u.pathname.slice(i + marker.length).replace(/^v\d+\//, '');
    const publicId = rest.replace(/\.[^.\/]+$/, '');
    const resourceType = u.pathname.includes('/video/upload/') ? 'video' : 'image';
    const timestamp = Math.floor(Date.now()/1000).toString();
    const signature = sign({ invalidate: 'true', public_id: publicId, timestamp }, apiSecret!);
    const form = new URLSearchParams({ public_id: publicId, timestamp, invalidate: 'true', api_key: apiKey!, signature });
    await fetch(`https://api.cloudinary.com/v1_1/${cloud}/${resourceType}/destroy`, { method: 'POST', headers: {'Content-Type':'application/x-www-form-urlencoded'}, body: form });
  } catch { /* best-effort cleanup */ }
}