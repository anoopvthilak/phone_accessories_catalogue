'use client';

export default function WarrantyClaimSlipModal({
  warranty,
  isOpen,
  onClose,
}) {
  if (!isOpen || !warranty) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-auto flex flex-col print:m-0 print:p-0 print:w-full print:max-w-none print:shadow-none">
        {/* Actions (Hidden on Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Customer Warranty Intake Slip
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-sm p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div className="space-y-4">
          {/* Slip Header */}
          <div className="text-center pb-3 border-b border-dashed border-slate-300">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Phone Accessories Store
            </h2>
            <p className="text-xs text-slate-500">
              Warranty Service & RMA Intake Token
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-200">
              <span className="text-xs text-slate-500 mr-1.5">TOKEN ID:</span>
              <span className="text-base font-black text-indigo-700 font-mono tracking-wider">
                {warranty.ticketNumber}
              </span>
            </div>
          </div>

          {/* Customer & Product Details */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Intake Date:</span>
              <span className="font-semibold text-slate-800">
                {warranty.createdAt
                  ? new Date(warranty.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Today'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Customer Name:</span>
              <span className="font-bold text-slate-900">{warranty.customerName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-mono font-semibold text-slate-800">{warranty.customerPhone}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Accessory / Item:</span>
              <span className="font-bold text-slate-900 text-right max-w-[240px]">
                {warranty.productName} ({warranty.brandName})
              </span>
            </div>

            {warranty.serialNumber && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Serial No / IMEI:</span>
                <span className="font-mono font-semibold text-slate-800">{warranty.serialNumber}</span>
              </div>
            )}

            {warranty.billNumber && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Invoice / Bill:</span>
                <span className="font-semibold text-slate-800">{warranty.billNumber}</span>
              </div>
            )}

            <div className="py-1">
              <span className="text-slate-500 block mb-1">Reported Issue / Defect:</span>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-medium">
                {warranty.issueDescription}
              </div>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Condition:</span>
              <span className="text-slate-700">{warranty.physicalCondition}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Received By:</span>
              <span className="font-semibold text-slate-800">{warranty.receivedBy || 'Staff'}</span>
            </div>
          </div>

          {/* Terms Footer */}
          <div className="pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-center leading-relaxed">
            <p>
              Please quote <strong>{warranty.ticketNumber}</strong> or your phone number (
              <strong>{warranty.customerPhone}</strong>) when calling to inquire about status.
            </p>
            <p className="mt-1">
              Warranty approval & replacement turnaround is subject to manufacturer terms.
            </p>
          </div>
        </div>

        {/* Close Button (Hidden on Print) */}
        <div className="mt-4 pt-3 border-t border-slate-200 print:hidden text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
          >
            Close Slip
          </button>
        </div>
      </div>
    </div>
  );
}
