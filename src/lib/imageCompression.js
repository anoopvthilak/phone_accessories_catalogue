/**
 * Client-side Image Optimization & Compression Utility
 * Resizes and compresses smartphone camera photos (often 5MB - 15MB)
 * down to ~250KB - 700KB before uploading to DigitalOcean Spaces via /api/upload.
 * 
 * This prevents Vercel's 4.5MB Serverless Function payload limit error (HTTP 413: Request Entity Too Large)
 * and dramatically speeds up mobile uploads on cellular connections.
 */

export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    maxSizeToSkipCompression = 800 * 1024, // 800 KB
  } = options;

  // If not in a browser environment or invalid file, return file as-is
  if (typeof window === 'undefined' || typeof document === 'undefined' || !file) {
    return file;
  }

  // Preserve animated GIFs and SVG files without canvas conversion
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return file;
  }

  return new Promise((resolve) => {
    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      // If object URL cannot be created, return original file
      return resolve(file);
    }

    const img = new Image();

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(file); // fallback safely to uncompressed file
    };

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // If already small and within dimensions, skip re-encoding
      if (file.size <= maxSizeToSkipCompression && width <= maxWidth && height <= maxHeight) {
        return resolve(file);
      }

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Create offscreen canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(file);
      }

      // Choose output type: preserve PNG if already reasonably sized (< 1.5MB),
      // otherwise use JPEG for massive compression savings on camera photos
      const isPng = file.type === 'image/png';
      const keepPng = isPng && file.size < 1.5 * 1024 * 1024;
      const outputType = keepPng ? 'image/png' : 'image/jpeg';

      if (outputType === 'image/jpeg') {
        // Fill white background for transparent images converted to JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw image (modern browsers automatically orient according to EXIF metadata)
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }

          // If blob is somehow larger than original file and original was already small, keep original
          if (blob.size >= file.size && file.size < 4 * 1024 * 1024) {
            return resolve(file);
          }

          let newName = file.name || 'photo.jpg';
          if (outputType === 'image/jpeg' && !newName.match(/\.(jpe?g)$/i)) {
            newName = newName.replace(/\.[^/.]+$/, '') + '.jpg';
          }

          try {
            const compressedFile = new File([blob], newName, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } catch {
            // Older browser fallback
            blob.name = newName;
            blob.lastModified = Date.now();
            resolve(blob);
          }
        },
        outputType,
        outputType === 'image/jpeg' ? quality : undefined
      );
    };

    img.src = objectUrl;
  });
}
