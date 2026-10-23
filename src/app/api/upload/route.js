import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth.js';
import { uploadToSpaces, deleteFromSpaces, isSpacesUrl } from '@/lib/spaces.js';

export const maxDuration = 60;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/heic',
  'image/heif',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per image

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    // Support either multiple files or single file
    let files = formData.getAll('files');
    if (!files || files.length === 0) {
      const singleFile = formData.get('file');
      if (singleFile) {
        files = [singleFile];
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No image file provided for upload' },
        { status: 400 }
      );
    }

    if (files.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 images can be uploaded at a time' },
        { status: 400 }
      );
    }

    const uploadResults = [];

    for (const file of files) {
      if (typeof file === 'string' || !file.name) {
        continue;
      }

      let detectedType = (file.type || '').toLowerCase();
      if (!detectedType || detectedType === 'application/octet-stream') {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg') detectedType = 'image/jpeg';
        else if (ext === 'png') detectedType = 'image/png';
        else if (ext === 'webp') detectedType = 'image/webp';
        else if (ext === 'gif') detectedType = 'image/gif';
        else if (ext === 'avif') detectedType = 'image/avif';
        else if (ext === 'heic') detectedType = 'image/heic';
      }

      if (!ALLOWED_MIME_TYPES.has(detectedType)) {
        return NextResponse.json(
          { error: `Invalid file type "${file.type || 'unknown'}". Allowed formats: JPG, PNG, WEBP, GIF, AVIF.` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds maximum allowed size of 10MB.` },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const result = await uploadToSpaces(buffer, file.name, detectedType || file.type);
      uploadResults.push({
        url: result.url,
        key: result.key,
        name: file.name,
        size: file.size,
      });
    }

    if (uploadResults.length === 0) {
      return NextResponse.json(
        { error: 'No valid image files were processed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadResults.length} image(s) uploaded successfully`,
      files: uploadResults,
      urls: uploadResults.map((r) => r.url),
      // If single file uploaded, provide convenient url & key at top level
      url: uploadResults[0].url,
      key: uploadResults[0].key,
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload image to DigitalOcean Spaces' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (session.role !== 'ADMIN' && session.role !== 'STAFF') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges' },
        { status: 403 }
      );
    }

    let targetUrlOrKey = request.nextUrl.searchParams.get('url') || request.nextUrl.searchParams.get('key');

    if (!targetUrlOrKey) {
      try {
        const body = await request.json();
        targetUrlOrKey = body.url || body.key;
      } catch {
        // Body may be empty
      }
    }

    if (!targetUrlOrKey) {
      return NextResponse.json(
        { error: 'Image URL or key is required' },
        { status: 400 }
      );
    }

    // Only allow deletion if it is from our spaces
    if (targetUrlOrKey.startsWith('http') && !isSpacesUrl(targetUrlOrKey)) {
      return NextResponse.json(
        { error: 'URL does not belong to configured DigitalOcean Spaces bucket' },
        { status: 400 }
      );
    }

    const deleted = await deleteFromSpaces(targetUrlOrKey);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Image deleted successfully' : 'Failed to delete image',
    });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
