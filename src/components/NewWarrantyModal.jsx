'use client';

import { useState, useEffect } from 'react';

const COMMON_ISSUES = [
  'No Power / Dead',
  'Charging Port Loose / Not Charging',
  'One Side No Sound (Audio Defect)',
  'Slow / Intermittent Charging',
  'Bluetooth Disconnecting',
  'Microphone Not Working',
  'Buttons Not Responding',
  'Physical Damage Inspection',
];

export default function NewWarrantyModal({
  isOpen,
  onClose,
  initialProduct = null,
  onSuccess,
}) {
  const [catalogSearch, setCatalogSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(initialProduct);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    productName: '',
    brandName: '',
    categoryName: 'General Accessories',
    serialNumber: '',
    billNumber: '',
    purchaseDate: '',
    warrantyType: 'Brand Warranty',
    issueDescription: '',
    physicalCondition: 'Good condition, minor regular wear',
    accessoriesIncluded: 'Original box and accessories',
    serviceCenterName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [prevProduct, setPrevProduct] = useState(initialProduct);

  if (initialProduct !== prevProduct) {
    setPrevProduct(initialProduct);
    if (initialProduct) {
      setSelectedProduct(initialProduct);
      setFormData((prev) => ({
        ...prev,
        productName: initialProduct.name,
        brandName: initialProduct.brandName || '',
        categoryName: initialProduct.categoryName || 'General Accessories',
      }));
    }
  }

  useEffect(() => {
    if (!catalogSearch.trim()) {
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
  }, [catalogSearch]);

  if (!isOpen) return null;

  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    setCatalogSearch('');
    setSearchResults([]);
    setFormData((prev) => ({
      ...prev,
      productName: prod.name,
      brandName: prod.brandName || '',
      categoryName: prod.categoryName || 'General Accessories',
    }));
  };

  const handleAddIssueTag = (tag) => {
    setFormData((prev) => ({
      ...prev,
      issueDescription: prev.issueDescription ? `${prev.issueDescription}, ${tag}` : tag,
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
    if (!formData.productName.trim()) {
      setError('Please provide product name');
      return;
    }
    if (!formData.issueDescription.trim()) {
      setError('Please describe the problem / defect');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim(),
        productId: selectedProduct ? selectedProduct._id : null,
        productName: formData.productName.trim(),
        brandName: formData.brandName.trim() || 'General',
        categoryName: formData.categoryName.trim() || 'General Accessories',
        serialNumber: formData.serialNumber.trim(),
        billNumber: formData.billNumber.trim(),
        purchaseDate: formData.purchaseDate || null,
        warrantyType: formData.warrantyType,
        issueDescription: formData.issueDescription.trim(),
        physicalCondition: formData.physicalCondition.trim(),
        accessoriesIncluded: formData.accessoriesIncluded.trim(),
        serviceCenterName: formData.serviceCenterName.trim(),
      };

      const res = await fetch('/api/warranties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to register warranty claim');
      }

      if (onSuccess) {
        onSuccess(data.warranty);
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

      <div className="relative w-full max-w-2xl bg-[#0f141c] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#121826]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Customer Warranty Intake
              </h3>
              <p className="text-xs text-slate-400">
                Register customer item handed over for warranty / RMA repair
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            ✕
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

          {/* Customer Details Box */}
          <div className="p-4 rounded-2xl bg-[#141c2c] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              1. Customer Information
            </h4>
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
                  placeholder="Full name"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Customer Phone Number (For Call Lookup) *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Product Identification Box */}
          <div className="p-4 rounded-2xl bg-[#141c2c] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Accessory & Warranty Details
              </h4>
              <span className="text-[11px] text-slate-400">Search catalogue or type below</span>
            </div>

            {/* Quick search catalogue to prefill */}
            {!selectedProduct && (
              <div className="relative">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Type to search and link catalogue accessory (optional)..."
                  className="w-full bg-[#121826] border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#121826] border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden divide-y divide-slate-800 max-h-40 overflow-y-auto">
                    {searchResults.map((prod) => (
                      <div
                        key={prod._id}
                        onClick={() => handleSelectProduct(prod)}
                        className="p-2.5 hover:bg-indigo-600/10 cursor-pointer flex items-center justify-between"
                      >
                        <div className="text-xs font-semibold text-white">{prod.name}</div>
                        <div className="text-[10px] text-slate-400">{prod.brandName} • SKU: {prod.sku}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedProduct && (
              <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
                <div className="text-xs text-indigo-300">
                  Linked to catalogue: <strong>{selectedProduct.name}</strong> ({selectedProduct.brandName})
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Unlink
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product / Accessory Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. boAt Airdopes 141 ANC"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g. boAt, Apple, Samsung, Anker"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Serial No / IMEI / Batch Code
                </label>
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="e.g. SN-8921880"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Purchase Invoice / Bill No
                </label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                  placeholder="e.g. INV-2024-991"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Warranty Type
                </label>
                <select
                  value={formData.warrantyType}
                  onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value })}
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Brand Warranty">Brand Warranty</option>
                  <option value="Shop Warranty">Shop Warranty</option>
                  <option value="Replacement Warranty">Replacement Warranty</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          {/* Issue & Condition Box */}
          <div className="p-4 rounded-2xl bg-[#141c2c] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              3. Defect & Handover Condition
            </h4>

            {/* Quick tags */}
            <div>
              <span className="text-[11px] text-slate-400 mb-1.5 block">
                Quick Issue Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_ISSUES.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddIssueTag(tag)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-[#121826] hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-800 transition"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reported Defect / Problem *
              </label>
              <textarea
                rows={2}
                required
                value={formData.issueDescription}
                onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
                placeholder="Detailed description of customer defect complaint..."
                className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Physical Condition Inspection
                </label>
                <input
                  type="text"
                  value={formData.physicalCondition}
                  onChange={(e) => setFormData({ ...formData, physicalCondition: e.target.value })}
                  placeholder="e.g. Minor scratches, no liquid damage"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Accessories Handed Over
                </label>
                <input
                  type="text"
                  value={formData.accessoriesIncluded}
                  onChange={(e) => setFormData({ ...formData, accessoriesIncluded: e.target.value })}
                  placeholder="e.g. Case + Cable, Original Box"
                  className="w-full bg-[#121826] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-md shadow-indigo-500/20 active:scale-95 transition disabled:opacity-50"
            >
              {loading ? 'Registering Intake...' : 'Generate Warranty Token & Intake'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
