'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import NewEnquiryModal from './NewEnquiryModal';

const STATUS_CONFIG = {
  ENQUIRED: {
    label: 'Enquired',
    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400',
    step: 1,
    desc: 'Customer asked, awaiting store order',
  },
  ORDERED: {
    label: 'Ordered',
    color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
    step: 2,
    desc: 'Placed order with distributor/vendor',
  },
  ON_THE_WAY: {
    label: 'On The Way',
    color: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    dot: 'bg-purple-400',
    step: 3,
    desc: 'Dispatched and in transit to shop',
  },
  DELIVERED: {
    label: 'Delivered to Shop',
    color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    dot: 'bg-cyan-400',
    step: 4,
    desc: 'Arrived at store counter',
  },
  NOTIFIED: {
    label: 'Notified Customer',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    step: 5,
    desc: 'Customer informed to visit & pick up',
  },
  COMPLETED: {
    label: 'Completed / Selled',
    color: 'bg-green-500/15 text-green-400 border-green-500/30',
    dot: 'bg-green-400',
    step: 6,
    desc: 'Handed over to customer & payment settled',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
    step: 0,
    desc: 'Cancelled or item unavailable',
  },
};

const ORDERED_STEPS = [
  'ENQUIRED',
  'ORDERED',
  'ON_THE_WAY',
  'DELIVERED',
  'NOTIFIED',
  'COMPLETED',
];

export default function EnquiriesView({ initialUser }) {
  const [enquiries, setEnquiries] = useState([]);
  const [stats, setStats] = useState({
    TOTAL: 0,
    ENQUIRED: 0,
    ORDERED: 0,
    ON_THE_WAY: 0,
    DELIVERED: 0,
    NOTIFIED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [statusModalEnquiry, setStatusModalEnquiry] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const fetchEnquiries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeStatus && activeStatus !== 'ALL') {
        params.set('status', activeStatus);
      }
      if (search.trim()) {
        params.set('search', search.trim());
      }
      params.set('limit', '50');

      const res = await fetch(`/api/enquiries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEnquiries(data.enquiries || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [activeStatus, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnquiries();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchEnquiries]);

  // Open Quick Status Update modal
  const handleOpenStatusModal = (enq, targetStatus) => {
    setStatusModalEnquiry(enq);
    setNewStatus(targetStatus || enq.status);
    setStatusNote('');
  };

  // Submit Status Update
  const handleUpdateStatus = async (e) => {
    e?.preventDefault();
    if (!statusModalEnquiry || !newStatus) return;

    try {
      setUpdatingId(statusModalEnquiry._id);
      const res = await fetch(`/api/enquiries/${statusModalEnquiry._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          statusNote: statusNote.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update local list
        setEnquiries((prev) =>
          prev.map((item) => (item._id === data.enquiry._id ? data.enquiry : item))
        );
        if (selectedEnquiry?._id === data.enquiry._id) {
          setSelectedEnquiry(data.enquiry);
        }
        setStatusModalEnquiry(null);
        // Refresh counts
        fetchEnquiries();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Pre-filled WhatsApp message helper
  const getWhatsAppLink = (enq) => {
    const cleanPhone = enq.customerPhone.replace(/[^0-9]/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    let message = `Hello ${enq.customerName}, regarding your enquiry for "${enq.productName}" (Ref: ${enq.enquiryNumber}) at our accessories shop: `;

    if (enq.status === 'DELIVERED' || enq.status === 'NOTIFIED') {
      message += `Great news! Your product has arrived at our store. Please visit us to collect it. Thank you!`;
    } else if (enq.status === 'ORDERED' || enq.status === 'ON_THE_WAY') {
      message += `Your order has been placed with our distributor and is on the way. We will notify you once it reaches our counter.`;
    } else if (enq.status === 'COMPLETED') {
      message += `Thank you for shopping with us! Let us know if you need any other accessories.`;
    } else {
      message += `We have recorded your enquiry and will update you shortly.`;
    }

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white pb-24 md:pb-12">
      <Header user={initialUser} />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Page Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Customer Enquiries & Special Orders
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Manage out-of-stock customer requests, new item orders, and fulfillment pipeline
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 hover:from-amber-500 hover:to-orange-500 shadow-lg shadow-amber-600/20 active:scale-95 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>+ Take Customer Enquiry</span>
          </button>
        </div>

        {/* Status Pipeline Cards (Filter Tabs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          <button
            type="button"
            onClick={() => setActiveStatus('ALL')}
            className={`p-3 rounded-2xl border text-left transition ${
              activeStatus === 'ALL'
                ? 'bg-[#161f33] border-blue-500/50 shadow-md shadow-blue-500/10'
                : 'bg-[#0f1422] border-slate-800/80 hover:border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              All Requests
            </div>
            <div className="text-xl font-extrabold text-white mt-1">
              {stats.TOTAL}
            </div>
          </button>

          {ORDERED_STEPS.map((st) => {
            const conf = STATUS_CONFIG[st];
            const isActive = activeStatus === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => setActiveStatus(st)}
                className={`p-3 rounded-2xl border text-left transition ${
                  isActive
                    ? 'bg-[#161f33] border-amber-500/50 shadow-md shadow-amber-500/10'
                    : 'bg-[#0f1422] border-slate-800/80 hover:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 line-clamp-1">
                    {conf.label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                </div>
                <div className="text-xl font-extrabold text-white mt-1">
                  {stats[st] || 0}
                </div>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#111726] border border-slate-800/80 p-2.5 rounded-2xl">
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Instant Search by Customer Phone, Customer Name, Product, or Enquiry Ticket #..."
              className="w-full bg-[#161e30] border border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              Clear
            </button>
          )}
        </div>

        {/* Enquiries List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading customer enquiries...</span>
          </div>
        ) : enquiries.length === 0 ? (
          <div className="py-20 rounded-3xl bg-[#0f1422] border border-slate-800/80 text-center flex flex-col items-center justify-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 border border-amber-500/20">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              No customer enquiries found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mb-4">
              {search
                ? `No results matching "${search}". Try searching another name or phone number.`
                : 'No enquiries logged under this status yet. Click below to add an enquiry when a customer asks for a product.'}
            </p>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition"
            >
              + Record Customer Enquiry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enquiries.map((enq) => {
              const conf = STATUS_CONFIG[enq.status] || STATUS_CONFIG.ENQUIRED;
              const currentStepIdx = ORDERED_STEPS.indexOf(enq.status);

              return (
                <div
                  key={enq._id}
                  className="bg-[#0f1523] border border-slate-800/90 hover:border-slate-700 rounded-3xl p-4 sm:p-5 flex flex-col justify-between transition-all shadow-xl shadow-black/40 group relative"
                >
                  <div>
                    {/* Top Meta: Ticket Number & Status Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="font-mono text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                        {enq.enquiryNumber}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenStatusModal(enq)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${conf.color} hover:brightness-125 cursor-pointer`}
                        title="Click to update status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                        <span>{conf.label}</span>
                        <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                      {enq.productName}
                    </h3>

                    {/* Brand & Category */}
                    <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-2">
                      <span className="font-semibold text-slate-300">{enq.brandName}</span>
                      <span>•</span>
                      <span>{enq.categoryName}</span>
                      {enq.quantity > 1 && (
                        <>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">Qty: {enq.quantity}</span>
                        </>
                      )}
                    </div>

                    {/* Customer Info Box */}
                    <div className="p-3 rounded-2xl bg-[#141c2c] border border-slate-800/80 mb-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Customer:</span>
                        <span className="font-bold text-white">{enq.customerName}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Phone:</span>
                        <a
                          href={`tel:${enq.customerPhone}`}
                          className="font-mono text-blue-400 hover:underline font-semibold"
                        >
                          {enq.customerPhone}
                        </a>
                      </div>
                      {enq.targetPrice > 0 && (
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                          <span className="text-slate-400">Target / Advance:</span>
                          <span className="text-slate-200">
                            ₹{enq.targetPrice}{' '}
                            {enq.advancePaid > 0 && (
                              <span className="text-emerald-400 font-semibold">
                                (Adv: ₹{enq.advancePaid})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Customer Notes */}
                    {enq.customerNotes && (
                      <div className="text-[11px] text-slate-300 italic mb-3 bg-[#111726] p-2 rounded-xl border border-slate-800/50 line-clamp-2">
                        &ldquo;{enq.customerNotes}&rdquo;
                      </div>
                    )}

                    {/* Pipeline Mini Stepper */}
                    <div className="mb-4">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1 flex items-center justify-between">
                        <span>Fulfillment Progress</span>
                        <span>
                          {currentStepIdx >= 0 ? `${currentStepIdx + 1} of 6` : 'Cancelled'}
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        {ORDERED_STEPS.map((st, sIdx) => (
                          <div
                            key={st}
                            className={`h-full transition-all ${
                              currentStepIdx >= sIdx
                                ? sIdx === 5
                                  ? 'bg-green-500'
                                  : 'bg-amber-500'
                                : 'bg-slate-800'
                            }`}
                            title={STATUS_CONFIG[st]?.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Call & WhatsApp Quick Buttons */}
                    <div className="flex items-center gap-1.5">
                      <a
                        href={`tel:${enq.customerPhone}`}
                        className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition"
                        title="Call Customer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </a>

                      <a
                        href={getWhatsAppLink(enq)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white transition"
                        title="Send WhatsApp Update"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                      </a>
                    </div>

                    {/* View Details / History */}
                    <button
                      type="button"
                      onClick={() => setSelectedEnquiry(enq)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      History & Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* New Enquiry Modal */}
      <NewEnquiryModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onSuccess={() => {
          fetchEnquiries();
        }}
      />

      {/* Status Transition Modal */}
      {statusModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setStatusModalEnquiry(null)} />

          <div className="relative w-full max-w-md bg-[#0f1422] border border-slate-800 rounded-3xl p-6 shadow-2xl z-10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Update Enquiry Status
                </h3>
                <p className="text-xs text-slate-400">
                  {statusModalEnquiry.enquiryNumber} • {statusModalEnquiry.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalEnquiry(null)}
                className="text-slate-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select New Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(STATUS_CONFIG).map((st) => {
                  const conf = STATUS_CONFIG[st];
                  const isCur = newStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setNewStatus(st)}
                      className={`p-2 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                        isCur
                          ? `${conf.color} ring-1 ring-white/20`
                          : 'bg-[#141b2a] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
                      <span>{conf.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Progress Note (Optional)
              </label>
              <input
                type="text"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Ordered via Supreme Distributor PO#991..."
                className="w-full bg-[#141b2a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setStatusModalEnquiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updatingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition disabled:opacity-50"
              >
                {updatingId ? 'Saving...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail & History Drawer/Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="fixed inset-0" onClick={() => setSelectedEnquiry(null)} />

          <div className="relative w-full max-w-2xl bg-[#0f1422] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between bg-[#121826]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {selectedEnquiry.enquiryNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      STATUS_CONFIG[selectedEnquiry.status]?.color
                    }`}
                  >
                    {STATUS_CONFIG[selectedEnquiry.status]?.label}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedEnquiry.productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Customer Box */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#141b2a] border border-slate-800">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Customer</div>
                  <div className="font-bold text-white text-sm mt-0.5">{selectedEnquiry.customerName}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Phone</div>
                  <div className="font-mono text-blue-400 font-bold mt-0.5">{selectedEnquiry.customerPhone}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target / Adv</div>
                  <div className="text-slate-200 mt-0.5">
                    ₹{selectedEnquiry.targetPrice} (Adv: ₹{selectedEnquiry.advancePaid})
                  </div>
                </div>
              </div>

              {/* Status History Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Activity & Status History Log</span>
                </h4>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {selectedEnquiry.statusHistory && selectedEnquiry.statusHistory.length > 0 ? (
                    selectedEnquiry.statusHistory.map((hist, idx) => (
                      <div key={idx} className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-[#0f1422]" />
                        <div className="p-3 rounded-xl bg-[#131929] border border-slate-800/80">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="font-bold text-white">
                              {STATUS_CONFIG[hist.status]?.label || hist.status}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {new Date(hist.timestamp).toLocaleString('en-IN', {
                                dateStyle: 'medium',
                                timeStyle: 'short',
                              })}
                            </span>
                          </div>
                          {hist.notes && (
                            <p className="text-slate-300 text-xs mb-1">
                              {hist.notes}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400">
                            Updated by: <span className="text-slate-300 font-semibold">{hist.changedBy}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs">No status history available.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-slate-800 bg-[#121826] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const enq = selectedEnquiry;
                  setSelectedEnquiry(null);
                  handleOpenStatusModal(enq);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition"
              >
                Advance Status
              </button>

              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
