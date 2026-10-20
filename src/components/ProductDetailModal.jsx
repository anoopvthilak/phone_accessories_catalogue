'use client';

import { useState } from 'react';
import Link from 'next/link';
import DeleteConfirmModal from './DeleteConfirmModal';
import NewEnquiryModal from './NewEnquiryModal';
import NewWarrantyModal from './NewWarrantyModal';

export default function ProductDetailModal({
  product,
  onClose,
  user,
  onProductDeleted,
}) {
  const [isLiked, setIsLiked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(
    product?.images && product.images.length > 0 ? product.images[0] : null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  if (!product) return null;

  const isInStock = product.stock > 0 && product.status !== 'OUT_OF_STOCK';
  const discountPercent =
    product.mrp && product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  // Transform specifications Map/Object into entries
  const specs =
    product.specifications instanceof Map
      ? Array.from(product.specifications.entries())
      : typeof product.specifications === 'object' && product.specifications !== null
      ? Object.entries(product.specifications)
      : [];

  const canEdit = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const canDelete = user?.role === 'ADMIN';

  const handleDeleteSuccess = (deletedId) => {
    if (onProductDeleted) {
      onProductDeleted(deletedId);
    }
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
        {/* Backdrop click to close */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Card */}
        <div className="relative w-full max-w-2xl bg-[#0f141c] sm:border border-slate-800 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl z-10 h-full sm:h-auto sm:max-h-[92vh] flex flex-col my-auto">
          {/* Top Header bar with Back button, Edit, Delete, and Like */}
          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#161e2e]/90 hover:bg-[#1e2a40] text-slate-200 hover:text-white flex items-center justify-center border border-slate-700/60 shadow-lg backdrop-blur-md transition pointer-events-auto cursor-pointer"
              title="Back to catalogue"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right actions */}
            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Edit button */}
              {canEdit && (
                <Link
                  href={`/admin/products/${product._id}/edit`}
                  className="px-3 py-2 rounded-full bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-bold border border-blue-400/40 shadow-lg backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer"
                  title="Edit product"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Edit</span>
                </Link>
              )}

              {/* Delete button (ADMIN only) with confirmation */}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="w-10 h-10 rounded-full bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white flex items-center justify-center border border-rose-500/40 shadow-lg backdrop-blur-md transition cursor-pointer"
                  title="Delete product"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md shadow-lg transition cursor-pointer ${
                  isLiked
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : 'bg-[#161e2e]/90 text-slate-200 hover:text-white border-slate-700/60'
                }`}
                title={isLiked ? 'Saved' : 'Save'}
              >
                <svg
                  className="w-5 h-5"
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
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="overflow-y-auto no-scrollbar flex-1 pb-6">
            {/* Hero Showcase Image */}
            <div className="w-full aspect-[16/10] sm:aspect-[16/9] bg-[#141b28] relative flex items-center justify-center p-6 border-b border-slate-800/80">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center">
                  <svg className="w-12 h-12 mb-2 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{product.name}</span>
                </div>
              )}

              {/* In stock badge overlay */}
              <div className="absolute bottom-4 left-6">
                <span
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-lg ${
                    isInStock
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isInStock ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {isInStock
                    ? `In Stock • ${product.stock || 1} Units Available`
                    : 'Currently Out of Stock'}
                </span>
              </div>
            </div>

            {/* Thumbnail selector if product has multiple images */}
            {product.images && product.images.length > 1 && (
              <div className="flex items-center gap-2 px-6 pt-3 overflow-x-auto no-scrollbar">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`relative w-14 h-14 rounded-xl bg-[#141b28] border-2 overflow-hidden flex-shrink-0 p-1 cursor-pointer transition ${
                      selectedImage === img
                        ? 'border-blue-500 shadow-md shadow-blue-500/30 scale-105'
                        : 'border-slate-800 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Title & Brand */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    {product.brandName}
                  </span>
                  <span className="text-xs text-slate-400">
                    • {product.categoryName}
                  </span>
                  <span className="text-xs text-slate-500 ml-auto font-mono">
                    SKU: {product.sku}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {product.name}
                </h2>
              </div>

              {/* Price section */}
              <div className="p-4 rounded-2xl bg-[#161e2e] border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">
                    Retail Price
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {discountPercent > 0 && (
                      <span className="text-sm text-slate-500 line-through">
                        MRP ₹{product.mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
                {discountPercent > 0 && (
                  <div className="text-right">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Save {discountPercent}%
                    </span>
                  </div>
                )}
              </div>

              {/* Specifications Pill Chips */}
              {specs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Key Specifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {specs.map(([k, v]) => (
                      <div
                        key={k}
                        className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#1a2336] text-slate-200 border border-slate-700/60 flex items-center gap-1.5 shadow-sm"
                      >
                        <span className="text-slate-400">{k}:</span>
                        <span className="font-semibold">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compatibility Chips */}
              {product.compatibility && product.compatibility.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                    Compatible Devices
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {product.compatibility.map((device, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-xl text-xs font-medium bg-[#141c2c] text-slate-300 border border-slate-800"
                      >
                        {device}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Description
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Retail Staff Operations Bar */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#141d2f] to-[#111726] border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Store Employee Actions</span>
                  {!isInStock && (
                    <span className="text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px]">
                      Out of Stock — Customer Waiting?
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEnquiryModal(true)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span>+ Take Customer Enquiry</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(true)}
                    className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-600/20 active:scale-95 transition cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>+ Warranty RMA Intake</span>
                  </button>
                </div>

                {toastMessage && (
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center font-semibold animate-fade-in">
                    {toastMessage}
                  </div>
                )}
              </div>

              {/* Warranty & Actions */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span>
                    Warranty: <strong className="text-slate-200">{product.warranty || 'Standard Store Warranty'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && (
                    <Link
                      href={`/admin/products/${product._id}/edit`}
                      className="flex-1 sm:flex-none text-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition cursor-pointer"
                    >
                      Edit Product
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before deletion */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        product={product}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={handleDeleteSuccess}
      />

      {/* New Enquiry Modal pre-filled with this product */}
      <NewEnquiryModal
        isOpen={showEnquiryModal}
        onClose={() => setShowEnquiryModal(false)}
        initialProduct={product}
        onSuccess={(enquiry) => {
          setToastMessage(`Enquiry ${enquiry.enquiryNumber} recorded for ${enquiry.customerName}!`);
          setTimeout(() => setToastMessage(''), 4000);
        }}
      />

      {/* New Warranty Modal pre-filled with this product */}
      <NewWarrantyModal
        isOpen={showWarrantyModal}
        onClose={() => setShowWarrantyModal(false)}
        initialProduct={product}
        onSuccess={(claim) => {
          setToastMessage(`Warranty token ${claim.ticketNumber} registered for ${claim.customerName}!`);
          setTimeout(() => setToastMessage(''), 4000);
        }}
      />
    </>
  );
}

