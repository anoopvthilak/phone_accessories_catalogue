'use client';

import { useState, useEffect } from 'react';

export default function NewEnquiryModal({
  isOpen,
  onClose,
  initialProduct = null,
  onSuccess,
}) {
  const [productMode, setProductMode] = useState(
    initialProduct ? 'CATALOGUE' : 'CATALOGUE'
  );
  const [catalogSearch, setCatalogSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: '',
    categoryName: 'General Accessories',
    brandName: 'General',
    quantity: 1,
    targetPrice: '',
    advancePaid: '',
    customerNotes: '',
    supplierName: '',
    supplierOrderRef: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [prevProduct, setPrevProduct] = useState(initialProduct);

  if (initialProduct !== prevProduct) {
    setPrevProduct(initialProduct);
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setProductMode('CATALOGUE');
      setFormData((prev) => ({
        ...prev,
        productName: initialProduct.name,
        categoryName: initialProduct.categoryName || 'General Accessories',
        brandName: initialProduct.brandName || 'General',
        targetPrice: initialProduct.price || '',
      }));
    }
  }

  // Search catalogue products when typing in search
  useEffect(() => {
    if (!catalogSearch.trim() || productMode !== 'CATALOGUE') {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await fetch(`/api/products?search=${encodeURIComponent(catalogSearch)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [catalogSearch, productMode]);

  if (!isOpen) return null;

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setCatalogSearch('');
    setSearchResults([]);
    setFormData((prev) => ({
      ...prev,
      productName: prod.name,
      categoryName: prod.categoryName || 'General Accessories',
      brandName: prod.brandName || 'General',
      targetPrice: prod.price || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.customerName.trim()) {
      setError('Please provide customer name');
      return;
    }

    if (!formData.customerPhone.trim()) {
      setError('Please provide customer phone number');
      return;
    }

    const finalProductName =
      productMode === 'CATALOGUE' && selectedProduct
        ? selectedProduct.name
        : formData.productName;

    if (!finalProductName.trim()) {
      setError('Please select or specify a product name');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        productType: productMode === 'CATALOGUE' && selectedProduct ? 'EXISTING_PRODUCT' : 'NEW_CUSTOM_ITEM',
        productId: productMode === 'CATALOGUE' && selectedProduct ? selectedProduct._id : null,
        productName: finalProductName.trim(),
        categoryName: formData.categoryName.trim(),
        brandName: formData.brandName.trim(),
        quantity: Number(formData.quantity) || 1,
        targetPrice: Number(formData.targetPrice) || 0,
        advancePaid: Number(formData.advancePaid) || 0,
        customerNotes: formData.customerNotes.trim(),
        supplierName: formData.supplierName.trim(),
        supplierOrderRef: formData.supplierOrderRef.trim(),
      };

      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enquiry');
      }

      if (onSuccess) {
        onSuccess(data.enquiry);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-[#0f141c] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#121826]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                New Customer Enquiry
              </h3>
              <p className="text-xs text-slate-400">
                Out-of-stock request or newly introduced accessory
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Product Type Switcher */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Item Source
            </label>
            <div className="grid grid-cols-2 gap-2 bg-[#141b2b] p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setProductMode('CATALOGUE')}
                className={`py-2 text-xs font-semibold rounded-xl transition ${
                  productMode === 'CATALOGUE'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Catalogue Item (Out of Stock)
              </button>
              <button
                type="button"
                onClick={() => {
                  setProductMode('CUSTOM');
                  setSelectedProduct(null);
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition ${
                  productMode === 'CUSTOM'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                New / Custom Accessory
              </button>
            </div>
          </div>

          {/* Catalogue Item Selector */}
          {productMode === 'CATALOGUE' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Product from Catalogue
              </label>

              {selectedProduct ? (
                <div className="p-3 rounded-2xl bg-[#141c2c] border border-blue-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedProduct.images?.[0] ? (
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-10 h-10 object-contain rounded-lg bg-black/40 p-1"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                        PA
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-white line-clamp-1">
                        {selectedProduct.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {selectedProduct.brandName} • SKU: {selectedProduct.sku} • ₹{selectedProduct.price}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="text-xs text-rose-400 hover:underline px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search by accessory title or SKU..."
                    className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                  {searching && (
                    <div className="absolute right-3 top-3 text-[11px] text-slate-400">
                      Searching...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#121826] border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-800 max-h-48 overflow-y-auto">
                      {searchResults.map((prod) => (
                        <div
                          key={prod._id}
                          onClick={() => handleSelectProduct(prod)}
                          className="p-2.5 hover:bg-blue-600/10 cursor-pointer flex items-center justify-between transition"
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{prod.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {prod.brandName} • {prod.categoryName} • ₹{prod.price}
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              prod.inStock
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {prod.inStock ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Custom New Item Fields */
            <div className="space-y-3 p-3.5 rounded-2xl bg-[#141c2c]/50 border border-slate-800/80">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product / Accessory Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. Spigen Ultra Hybrid Case for iPhone 16 Pro (Clear)"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g. Spigen, Anker, Apple"
                    className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    placeholder="e.g. Mobile Covers, Chargers"
                    className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Full name of customer"
                className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Customer Phone Number *
              </label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Price, Advance & Qty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Expected Price (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.targetPrice}
                onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
                placeholder="0"
                className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                value={formData.advancePaid}
                onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                placeholder="0"
                className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Customer Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Customer Preference / Notes
            </label>
            <textarea
              rows={2}
              value={formData.customerNotes}
              onChange={(e) => setFormData({ ...formData, customerNotes: e.target.value })}
              placeholder="e.g. Matte finish requested, customer needs before weekend, preferred color Black..."
              className="w-full bg-[#141b2b] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Supplier details (optional) */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/60">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Vendor / Distributor (Optional)
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                placeholder="e.g. Supreme Electronics"
                className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Supplier PO / Ref No (Optional)
              </label>
              <input
                type="text"
                value={formData.supplierOrderRef}
                onChange={(e) => setFormData({ ...formData, supplierOrderRef: e.target.value })}
                placeholder="e.g. PO-8921"
                className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Save Customer Enquiry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
