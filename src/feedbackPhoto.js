export const MAX_FEEDBACK_PHOTO_BYTES = 5 * 1024 * 1024;

export const FEEDBACK_PHOTO_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export function validateFeedbackPhoto(file) {
  if (!file) return '';
  if (!FEEDBACK_PHOTO_TYPES.has(file.type)) {
    return 'Please choose a JPEG, PNG, WebP, HEIC, or HEIF image.';
  }
  if (file.size > MAX_FEEDBACK_PHOTO_BYTES) {
    return 'Please choose a photo smaller than 5 MB.';
  }
  return '';
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('photo-read-failed'));
    reader.onload = () => {
      const result = String(reader.result || '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.readAsDataURL(file);
  });
}
