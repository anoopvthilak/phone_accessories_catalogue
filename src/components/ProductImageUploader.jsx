'use client';

import { useState, useRef } from 'react';
import { compressImage } from '@/lib/imageCompression.js';

export default function ProductImageUploader({
  images = [],
  onChange,
  maxImages = 3,
  disabled = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');
  const [error, setError] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const remainingSlots = Math.max(0, maxImages - images.length);

  // Upload one or multiple files to DigitalOcean Spaces via /api/upload
  const handleUploadFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    setError('');

    const filesToUpload = Array.from(fileList).filter((f) => {
      return f && (f.type?.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif)$/i.test(f.name || ''));
    });

    if (filesToUpload.length === 0) {
      setError('Please select valid image files (JPG, PNG, WEBP, GIF, AVIF)');
      return;
    }

    if (filesToUpload.length > remainingSlots) {
      setError(
        `You can only add up to ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'
        } (maximum ${maxImages} total).`
      );
      return;
    }

    setIsUploading(true);

    try {
      const uploadedUrls = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const rawFile = filesToUpload[i];
        const stepNum = i + 1;
        const totalNum = filesToUpload.length;
        const prefix = totalNum > 1 ? `Image ${stepNum} of ${totalNum}: ` : '';

        // 1. Optimize mobile camera photos client-side (downscale to ~300KB-600KB)
        // This solves Vercel's 4.5MB Serverless Function payload limit error on mobiles
        setUploadProgressText(`${prefix}Optimizing photo for mobile upload...`);
        let fileToUpload = rawFile;
        try {
          fileToUpload = await compressImage(rawFile);
        } catch (compErr) {
          console.warn('Compression fallback to original file:', compErr);
          fileToUpload = rawFile;
        }

        const sizeKb = Math.round(fileToUpload.size / 1024);
        const sizeLabel = sizeKb >= 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

        // 2. Upload individual file to Spaces
        setUploadProgressText(`${prefix}Uploading to Spaces (${sizeLabel})...`);

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        // 3. Robust response parsing to avoid "Unexpected token 'R'..."
        let data;
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const rawText = await res.text();
          if (res.status === 413) {
            throw new Error(`"${rawFile.name}" is too large for the server (Vercel 4.5MB limit). Please select a smaller photo.`);
          }
          throw new Error(rawText || `Upload failed with HTTP status ${res.status}`);
        }

        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to upload "${rawFile.name}" to Spaces`);
        }

        const uploadedUrl = data.url || (data.urls && data.urls[0]);
        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const newImages = [...images, ...uploadedUrls].slice(0, maxImages);
        onChange(newImages);
      }
    } catch (err) {
      console.error('Spaces upload error:', err);
      setError(err.message || 'Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
    }
  };

  // Add URL manually
  const handleAddUrl = (urlToAdd) => {
    const target = (urlToAdd || customUrl).trim();
    if (!target) return;
    setError('');

    if (remainingSlots <= 0) {
      setError(`Maximum limit of ${maxImages} images reached.`);
      return;
    }

    if (target.startsWith('data:image/')) {
      setError('Image data-URIs / binaries are not allowed. Please enter an image URL.');
      return;
    }

    if (images.includes(target)) {
      setError('This image URL is already added.');
      return;
    }

    const updated = [...images, target].slice(0, maxImages);
    onChange(updated);
    setCustomUrl('');
  };

  // Remove image
  const handleRemoveImage = async (indexToRemove) => {
    const targetUrl = images[indexToRemove];
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);

    // If it's a Spaces image, trigger background deletion
    if (targetUrl && targetUrl.includes('.digitaloceanspaces.com')) {
      try {
        fetch(`/api/upload?url=${encodeURIComponent(targetUrl)}`, {
          method: 'DELETE',
        }).catch(() => { });
      } catch {
        // Silent catch for background cleanup
      }
    }
  };

  // Reorder / move to primary
  const handleSetPrimary = (index) => {
    if (index === 0) return;
    const item = images[index];
    const rest = images.filter((_, idx) => idx !== index);
    onChange([item, ...rest]);
  };

  const handleMoveLeft = (index) => {
    if (index === 0) return;
    const next = [...images];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveRight = (index) => {
    if (index === images.length - 1) return;
    const next = [...images];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    if (remainingSlots > 0 && !disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (remainingSlots > 0 && !disabled && !isUploading && e.dataTransfer.files) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  return (
    <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          Product Images
          <span className="text-slate-400 font-normal normal-case text-xs">
            (Up to {maxImages} images)
          </span>
        </h2>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${images.length === maxImages
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/60'
              }`}
          >
            {images.length} / {maxImages} images
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-rose-400 hover:text-rose-300 text-sm font-bold px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload Dropzone */}
      {remainingSlots > 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${isDragOver
              ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
              : 'border-slate-700 hover:border-purple-500/70 bg-[#151d2d]/60 hover:bg-[#182236]'
            } ${isUploading ? 'opacity-70 pointer-events-none' : ''}`}
        >
          {/* File Picker / Gallery Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/*"
            multiple={remainingSlots > 1}
            disabled={disabled || isUploading}
            onChange={(e) => handleUploadFiles(e.target.files)}
            className="hidden"
          />

          {/* Direct Camera Capture Input for Mobile Smartphones */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={disabled || isUploading}
            onChange={(e) => handleUploadFiles(e.target.files)}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-3">
              <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
              <p className="text-sm font-medium text-purple-300">{uploadProgressText}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 w-full max-w-md">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 mb-0.5">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <div>
                <p className="text-sm font-bold text-slate-200">
                  Upload Product Photos
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Up to {remainingSlots} more image{remainingSlots === 1 ? '' : 's'} (Camera & gallery photos auto-optimized)
                </p>
              </div>

              {/* Dedicated Camera & Gallery Buttons for Mobile and Desktop */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 w-full max-w-xs pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isUploading) {
                      if (cameraInputRef.current) cameraInputRef.current.value = '';
                      cameraInputRef.current?.click();
                    }
                  }}
                  disabled={disabled || isUploading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                  title="Open camera to capture product photo directly"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isUploading) {
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      fileInputRef.current?.click();
                    }
                  }}
                  disabled={disabled || isUploading}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 hover:text-white text-xs font-bold transition border border-slate-700/80 flex items-center justify-center gap-2 shadow cursor-pointer disabled:opacity-50"
                  title="Choose existing photos from device gallery"
                >
                  <svg className="w-4 h-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>From Gallery</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 hidden sm:block">
                or drag & drop image files directly here
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#151e2e] border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Maximum {maxImages} images added. Remove an image if you wish to upload or add another.</span>
        </div>
      )}

      {/* Manual URL Input Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-xs text-slate-400 hover:text-purple-400 font-medium flex items-center gap-1.5 transition cursor-pointer"
        >
          <span>{showUrlInput ? '▾ Hide URL input' : '▸ Or enter external image URL'}</span>
        </button>

        {showUrlInput && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-[#151e2e] border border-slate-800 space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                disabled={disabled || remainingSlots === 0}
                className="flex-1 px-4 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
              />
              <button
                type="button"
                onClick={() => handleAddUrl()}
                disabled={disabled || remainingSlots === 0 || !customUrl.trim()}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-xs transition cursor-pointer flex-shrink-0"
              >
                + Add URL
              </button>
            </div>

            {/* Quick Sample Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400">Sample Photos:</span>
              <button
                type="button"
                onClick={() => handleAddUrl('https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80')}
                disabled={remainingSlots === 0}
                className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer disabled:opacity-40"
              >
                ⚡ Charger
              </button>
              <button
                type="button"
                onClick={() => handleAddUrl('https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=800&q=80')}
                disabled={remainingSlots === 0}
                className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer disabled:opacity-40"
              >
                📱 Case
              </button>
              <button
                type="button"
                onClick={() => handleAddUrl('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80')}
                disabled={remainingSlots === 0}
                className="px-2 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:text-white border border-slate-700 cursor-pointer disabled:opacity-40"
              >
                🔌 Cable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Images Preview Cards */}
      {images.length > 0 && (
        <div className="pt-2 space-y-2">
          <p className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Current Product Images ({images.length} of {maxImages}):</span>
            <span className="text-[11px] text-slate-500 font-normal">
              First image is the Primary Cover photo
            </span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl bg-[#161f30] border ${idx === 0 ? 'border-purple-500/60 ring-2 ring-purple-500/20' : 'border-slate-700/80'
                  } p-2 flex flex-col justify-between shadow-lg group transition-all`}
              >
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] rounded-xl bg-[#0f141c] overflow-hidden flex items-center justify-center p-2 mb-2">
                  <img
                    src={img}
                    alt={`Product photo ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />

                  {/* Primary Badge */}
                  {idx === 0 ? (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      ★ Primary Cover
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-slate-300 text-[10px] font-semibold border border-slate-700">
                      Photo {idx + 1}
                    </span>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    disabled={disabled}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center text-xs font-bold shadow-md transition cursor-pointer"
                    title="Remove image"
                  >
                    ✕
                  </button>
                </div>

                {/* Card Action Toolbar */}
                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-300 px-1">
                  {idx !== 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(idx)}
                      disabled={disabled}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-slate-700/60 transition cursor-pointer"
                    >
                      Make Primary
                    </button>
                  ) : (
                    <span className="text-[11px] text-purple-400 font-medium">Cover Photo</span>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveLeft(idx)}
                        disabled={disabled}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer border border-slate-700"
                        title="Move left"
                      >
                        ←
                      </button>
                    )}
                    {idx < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveRight(idx)}
                        disabled={disabled}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs cursor-pointer border border-slate-700"
                        title="Move right"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
