'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import ProductImageUploader from '@/components/ProductImageUploader';

export default function EditProductForm({
  initialProduct,
  initialCategories = [],
  initialBrands = [],
  user,
}) {
  const router = useRouter();

  // Form states
  const [name, setName] = useState(initialProduct.name || '');
  const [categoryId, setCategoryId] = useState(
    initialProduct.category || (initialCategories[0]?._id ?? '')
  );
  const [brandName, setBrandName] = useState(
    initialProduct.brandName ||
    initialBrands.find((b) => b._id === initialProduct.brand)?.name ||
    ''
  );
  const [price, setPrice] = useState(initialProduct.price?.toString() || '');
  const [mrp, setMrp] = useState(initialProduct.mrp?.toString() || '');
  const [inStock, setInStock] = useState(initialProduct.inStock !== false && initialProduct.status !== 'OUT_OF_STOCK');
  const [stock, setStock] = useState(initialProduct.stock?.toString() || '1');
  const [images, setImages] = useState(initialProduct.images || []);
  const [description, setDescription] = useState(initialProduct.description || '');
  const [specKey, setSpecKey] = useState('');
  const [specVal, setSpecVal] = useState('');
  const [specifications, setSpecifications] = useState(initialProduct.specifications || {});
  const [compatibility, setCompatibility] = useState(initialProduct.compatibility || []);
  const [customDevice, setCustomDevice] = useState('');
  const [warranty, setWarranty] = useState(initialProduct.warranty || '1 Year Manufacturer Warranty');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const canDelete = user?.role === 'ADMIN';

  // Toggle compatibility tag
  const toggleCompatibility = (device) => {
    if (compatibility.includes(device)) {
      setCompatibility(compatibility.filter((d) => d !== device));
    } else {
      setCompatibility([...compatibility, device]);
    }
  };

  // Add custom compatibility device
  const handleAddCustomDevice = (e) => {
    e.preventDefault();
    if (customDevice.trim() && !compatibility.includes(customDevice.trim())) {
      setCompatibility([...compatibility, customDevice.trim()]);
      setCustomDevice('');
    }
  };

  // Add specification
  const handleAddSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setSpecifications({
        ...specifications,
        [specKey.trim()]: specVal.trim(),
      });
      setSpecKey('');
      setSpecVal('');
    }
  };

  // Remove specification
  const handleRemoveSpec = (keyToRemove) => {
    const updated = { ...specifications };
    delete updated[keyToRemove];
    setSpecifications(updated);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Product title is required');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!brandName.trim()) {
      setError('Product brand is required');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!price || parseFloat(price) < 0) {
      setError('Please enter a valid MOP (Maximum offer price)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const numPrice = parseFloat(price);
    const numMrp = mrp ? parseFloat(mrp) : numPrice;

    if (numMrp < numPrice) {
      setError('MRP cannot be lower than the MOP (selling price)');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const finalImages =
      images.length > 0
        ? images
        : ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80'];

    setLoading(true);

    try {
      const res = await fetch(`/api/products/${initialProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          categoryId,
          brand: brandName.trim(),
          brandName: brandName.trim(),
          price: numPrice,
          mrp: numMrp,
          inStock: inStock,
          stock: inStock ? Math.max(1, parseInt(stock, 10) || 1) : 0,
          status: inStock ? 'ACTIVE' : 'OUT_OF_STOCK',
          images: finalImages,
          description: description.trim(),
          specifications,
          compatibility,
          warranty: warranty.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleted = () => {
    router.push('/?deleted=1');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 pb-36">
      {/* Mobile Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            href={`/admin/products/${initialProduct._id}`}
            className="flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#161f30] border border-slate-700/60 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span>Back</span>
          </Link>

          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Edit Accessory
          </h1>

          {/* Delete action button in header */}
          {canDelete ? (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold px-2 py-1 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
            >
              Delete
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </header>

      {/* Main Form Container */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Success Banner */}
        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-sm">Product Updated Successfully!</h4>
                <p className="text-xs text-emerald-400/80">Changes are now live across store catalogue and search.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Link
                href={`/admin/products/${initialProduct._id}`}
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-xs font-semibold text-white border border-emerald-500/40 text-center"
              >
                View Product
              </Link>
              <Link
                href="/"
                className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold text-center"
              >
                Catalogue
              </Link>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Basic Information */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              1. Basic Information
            </h2>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Product Title / Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anker Prime 67W GaN Wall Charger"
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            {/* Category & Brand Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                >
                  {initialCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  required
                  list="brand-options"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Anker, Apple, boAt..."
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <datalist id="brand-options">
                  {initialBrands.map((b) => (
                    <option key={b._id} value={b.name} />
                  ))}
                </datalist>
              </div>
            </div>
          </section>

          {/* Card 2: Pricing & Stock Inventory */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              2. Pricing & Inventory
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  MOP (Maximum offer price) (₹) *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="2999"
                    className="w-full pl-8 pr-3 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  MRP (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="3999"
                    className="w-full pl-8 pr-3 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-300 font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Stock Units */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Stock Units Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => {
                    setStock(e.target.value);
                    if (parseInt(e.target.value, 10) > 0) {
                      setInStock(true);
                    } else if (parseInt(e.target.value, 10) === 0) {
                      setInStock(false);
                    }
                  }}
                  className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>

              {/* Stock Availability Toggle */}
              <div className="col-span-2 sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Availability Status *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setInStock(true);
                      if (parseInt(stock, 10) <= 0) setStock('1');
                    }}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      inStock
                        ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/60 shadow-md shadow-emerald-500/10'
                        : 'bg-[#182234] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    In Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInStock(false);
                      setStock('0');
                    }}
                    className={`py-3 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      !inStock
                        ? 'bg-rose-500/20 text-rose-300 border-2 border-rose-500/60 shadow-md shadow-rose-500/10'
                        : 'bg-[#182234] text-slate-400 hover:text-slate-200 border border-slate-700/60'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Out of Stock
                  </button>
                </div>
              </div>
            </div>

            {/* Discount Preview */}
            {price && mrp && parseFloat(mrp) > parseFloat(price) && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                <span>Calculated MOP Discount:</span>
                <strong className="font-bold">
                  {Math.round(((parseFloat(mrp) - parseFloat(price)) / parseFloat(mrp)) * 100)}% OFF
                </strong>
              </div>
            )}
          </section>

          {/* Card 3: Product Images (Up to 3, DigitalOcean Spaces) */}
          <ProductImageUploader
            images={images}
            onChange={setImages}
            maxImages={3}
            disabled={loading}
          />

          {/* Card 4: Device Compatibility & Specifications */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              4. Compatibility & Specs
            </h2>

            {/* Device Compatibility */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Device Compatibility
              </label>

              {/* Custom Device Input */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customDevice}
                  onChange={(e) => setCustomDevice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomDevice(e);
                    }
                  }}
                  placeholder="Enter model name (e.g. iPhone 16 Pro, Galaxy S24, Universal USB-C)"
                  className="flex-1 px-4 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDevice}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  Add Model
                </button>
              </div>

              {/* Active Compatibility List */}
              {compatibility.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {compatibility.map((device) => (
                    <div
                      key={device}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium"
                    >
                      <span>{device}</span>
                      <button
                        type="button"
                        onClick={() => toggleCompatibility(device)}
                        className="text-amber-400/70 hover:text-amber-200 font-bold ml-1 cursor-pointer"
                        title="Remove device"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No device models added yet.</p>
              )}
            </div>

            {/* Specifications Key-Value Pairs */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Specifications
              </label>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  type="text"
                  value={specKey}
                  onChange={(e) => setSpecKey(e.target.value)}
                  placeholder="Feature (e.g. Wattage, Material, Cable Length)"
                  className="px-3.5 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpec();
                      }
                    }}
                    placeholder="Value (e.g. 65W, Braided Nylon, 1.8m)"
                    className="flex-1 px-3.5 py-2.5 bg-[#182234] border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Active Specs list */}
              {Object.keys(specifications).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {Object.entries(specifications).map(([k, v]) => (
                    <div
                      key={k}
                      className="px-3 py-1.5 rounded-xl bg-[#1b2538] border border-slate-700 text-xs flex items-center gap-2 text-slate-200"
                    >
                      <span className="text-slate-400">{k}:</span>
                      <span className="font-semibold">{v}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(k)}
                        className="text-rose-400 hover:text-rose-300 font-bold ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Card 5: Description & Warranty */}
          <section className="bg-[#121826] border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-4 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              5. Description & Warranty
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product overview, packaging contents, key benefits..."
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Warranty
              </label>
              <input
                type="text"
                value={warranty}
                onChange={(e) => setWarranty(e.target.value)}
                placeholder="e.g. 1 Year Replacement Warranty"
                className="w-full px-4 py-3 bg-[#182234] border border-slate-700/60 rounded-2xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </section>

          {/* Card 6: Danger Zone (ADMIN only) */}
          {canDelete && (
            <section className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-5 sm:p-7 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Danger Zone
              </h2>
              <p className="text-xs text-slate-400">
                Permanently delete this accessory from the catalogue. This action requires confirmation and cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-xs font-bold transition cursor-pointer flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Delete Accessory Permanently</span>
              </button>
            </section>
          )}

          {/* Mobile Sticky Bottom Submit Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b0f19]/95 backdrop-blur-md border-t border-slate-800 px-4 py-3.5 shadow-2xl safe-area-pb">
            <div className="max-w-3xl mx-auto flex items-center gap-3">
              <Link
                href={`/admin/products/${initialProduct._id}`}
                className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>💾 Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Confirmation Modal before deletion */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        product={initialProduct}
        onClose={() => setShowDeleteModal(false)}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
