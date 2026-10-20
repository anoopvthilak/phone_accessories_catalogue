'use client';

import { useState } from 'react';

export default function ProductCard({ product, onSelect }) {
  const [isLiked, setIsLiked] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isInStock = product.inStock !== false && product.status !== 'OUT_OF_STOCK' && (product.stock === undefined || product.stock > 0);
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  // Primary image or placeholder
  const imageUrl =
    !imageError && product.images && product.images.length > 0
      ? product.images[0]
      : null;

  return (
    <div
      onClick={() => onSelect && onSelect(product)}
      className="group bg-[#121826] hover:bg-[#161f30] border border-slate-800/80 hover:border-slate-700 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 shadow-xl shadow-black/40 hover:shadow-2xl hover:shadow-black/70 hover:-translate-y-1 cursor-pointer relative overflow-hidden"
    >
      {/* Top Media Container */}
      <div className="relative w-full aspect-[4/3] rounded-2xl bg-[#172032] overflow-hidden flex items-center justify-center p-3 mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-500">
            <svg
              className="w-10 h-10 mb-1 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[11px] font-medium tracking-wide">
              {product.categoryName}
            </span>
          </div>
        )}

        {/* Brand Pill Badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-[#0b0f19]/80 backdrop-blur-md text-slate-200 border border-slate-700/60 shadow-sm">
            {product.brandName}
          </span>
        </div>

        {/* Favorite / Quick Action Heart Button matching reference UI */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLiked(!isLiked);
          }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md cursor-pointer ${
            isLiked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              : 'bg-[#0b0f19]/70 text-slate-400 hover:text-white border border-slate-700/60'
          }`}
          title={isLiked ? 'Saved' : 'Save to shortlist'}
        >
          <svg
            className="w-4 h-4"
            fill={isLiked ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>

        {/* Stock Badge on bottom-left */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-md ${
              isInStock
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isInStock ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
              }`}
            />
            {isInStock ? `In Stock (${product.stock})` : 'Out of Stock'}
          </span>
          {!isInStock && (
            <span className="hidden sm:inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-sm">
              + Enquiry
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Category & SKU Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span>{product.categoryName}</span>
            <span className="font-mono text-[10px] text-slate-500">
              SKU: {product.sku}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-bold text-white text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          {/* Compatibility Chips */}
          {product.compatibility && product.compatibility.length > 0 && (
            <p className="text-xs text-slate-400 line-clamp-1 mb-3">
              <span className="text-slate-500">Fits:</span>{' '}
              {product.compatibility.slice(0, 2).join(' • ')}
              {product.compatibility.length > 2 && ' +more'}
            </p>
          )}
        </div>

        {/* Price & Details Row */}
        <div className="pt-3 border-t border-slate-800/80 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">
              Retail Price
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {discountPercent > 0 && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.mrp.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {discountPercent > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                {discountPercent}% OFF
              </span>
            )}
            <button
              type="button"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-blue-600 text-slate-300 hover:text-white transition"
              title="View Product Details"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
