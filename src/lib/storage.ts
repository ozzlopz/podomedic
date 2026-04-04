'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase';

function sanitizeFileName(fileName: string) {
  const [name, extension = 'jpg'] = fileName.split(/\.(?=[^.]+$)/);
  const safeName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${safeName || 'archivo'}-${Date.now()}.${extension.toLowerCase()}`;
}

export async function uploadBlogImage(file: File, folder: 'covers' | 'inline') {
  if (!storage) {
    throw new Error('Firebase Storage no está disponible.');
  }

  const storageRef = ref(storage, `blog-images/${folder}/${sanitizeFileName(file.name)}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
