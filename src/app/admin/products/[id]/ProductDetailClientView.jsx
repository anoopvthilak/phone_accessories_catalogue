'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';

export default function ProductDetailClientView({ product, user }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(
    product.images && product.images.length > 0 ? product.images[0] : null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isInStock = product.stock > 0 && product.status !== 'OUT_OF_STOCK';
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const specs = Object.entries(product.specifications || {});

  const canEdit = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const canDelete = user?.role === 'ADMIN';

  const handleDeleted = () => {
    router.push('/?deleted=1');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-32">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#161f30] border border-slate-700/60 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span>Catalogue</span>
          </Link>

          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-xs">
            {product.name}
          </h1>

          <div className="flex items-center gap-2">
            {canEdit && (
              <Link
                href={`/admin/products/${product._id}/edit`}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="hidden sm:inline">Edit Product</span>
                <span className="sm:hidden">Edit</span>
              </Link>
            )}

            {canDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Delete Product"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Showcase Image Gallery Card */}
        <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl overflow-hidden">
          <div className="w-full aspect-[16/10] sm:aspect-[2/1] bg-[#172032] rounded-2xl relative flex items-center justify-center p-6 overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-500 flex flex-col items-center">
                <svg className="w-12 h-12 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{product.name}</span>
              </div>
            )}

            {/* In stock badge */}
            <div className="absolute bottom-4 left-4 sm:left-6">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg ${isInStock
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${isInStock ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                {isInStock ? `In Stock • ${product.stock} Units Available` : 'Currently Out of Stock'}
              </span>
            </div>
          </div>

          {/* Multiple image thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 pt-4 overflow-x-auto no-scrollbar">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 rounded-xl bg-[#172032] border-2 p-1 overflow-hidden flex-shrink-0 cursor-pointer transition ${selectedImage === img
                    ? 'border-blue-500 shadow-md shadow-blue-500/30 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Product Info & Pricing Card */}
        <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {product.brandName}
              </span>
              <span className="text-xs text-slate-400">
                • {product.categoryName}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {product.name}
            </h2>
          </div>

          {/* Pricing Box */}
          <div className="p-5 rounded-2xl bg-[#161f30] border border-slate-700/60 flex items-center justify-between flex-wrap gap-4">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">
                MOP (Maximum offer price)
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-white">
                  ₹{product.price.toLocaleString('en-IN')}
                </span>
                {discountPercent > 0 && (
                  <span className="text-base text-slate-400 line-through">
                    MRP ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="text-right">
                <span className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm">
                  Save {discountPercent}% OFF
                </span>
              </div>
            )}
          </div>

          {/* Specifications */}
          {specs.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Specifications
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="p-3 rounded-2xl bg-[#182234] border border-slate-700/60 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <span className="text-slate-400 font-medium">{k}</span>
                    <span className="text-slate-100 font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compatibility */}
          {product.compatibility && product.compatibility.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Device Compatibility
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.compatibility.map((device, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#182234] text-slate-200 border border-slate-700/60"
                  >
                    {device}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Product Description
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Warranty */}
          <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
            <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Warranty: <strong className="text-slate-200">{product.warranty || 'Standard Store Warranty'}</strong></span>
          </div>
        </section>

        {/* Mobile Sticky Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-800 px-4 py-3.5 shadow-2xl safe-area-pb">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <Link
              href="/"
              className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition text-center"
            >
              ← Catalogue
            </Link>

            <div className="flex items-center gap-2">
              {canEdit && (
                <Link
                  href={`/admin/products/${product._id}/edit`}
                  className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition text-center"
                >
                  Edit Accessory
                </Link>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-3 rounded-2xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs sm:text-sm font-bold transition cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        product={product}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
