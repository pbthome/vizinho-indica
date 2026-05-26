import { supabase } from '../services/supabase/client';

const REVIEW_PHOTOS_BUCKET = 'review-photos';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadReviewPhoto(params: {
  condominiumId: string;
  providerId: string;
  reviewId: string;
  userId: string;
  uri: string;
}) {
  const response = await fetch(params.uri);
  const blob = await response.blob();

  if (blob.size > MAX_IMAGE_BYTES) {
    throw new Error('A foto precisa ter no maximo 5 MB.');
  }

  const extension = getImageExtension(blob.type, params.uri);
  const storagePath = `${params.condominiumId}/${params.providerId}/${params.reviewId}/${params.userId}-${Date.now()}.${extension}`;

  const arrayBuffer = await blobToArrayBuffer(blob);
  const { error } = await supabase.storage.from(REVIEW_PHOTOS_BUCKET).upload(storagePath, arrayBuffer, {
    contentType: blob.type || `image/${extension}`,
    upsert: false
  });

  if (error) throw new Error(error.message);
  return storagePath;
}

async function blobToArrayBuffer(blob: Blob) {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }

  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Nao foi possivel preparar a foto para envio.'));
    };

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }

      reject(new Error('Formato de foto nao suportado para envio.'));
    };

    reader.readAsArrayBuffer(blob);
  });
}

export async function createReviewPhotoUrls(paths: string[]) {
  const uniquePaths = [...new Set(paths.filter(Boolean))];
  if (!uniquePaths.length) return new Map<string, string>();

  const { data, error } = await supabase.storage.from(REVIEW_PHOTOS_BUCKET).createSignedUrls(uniquePaths, 60 * 60);
  if (error) return new Map(uniquePaths.map((path) => [path, path]));

  return new Map(data.map((item) => [item.path, item.signedUrl]));
}

function getImageExtension(contentType: string, uri: string) {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('webp')) return 'webp';
  const match = uri.match(/\.(jpg|jpeg|png|webp)(\?|$)/i);
  if (match?.[1]) return match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
  return 'jpg';
}
