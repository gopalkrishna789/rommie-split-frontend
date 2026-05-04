import { useState } from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import PaymentCard from './PaymentCard';
import { formatRupees } from '../utils/upiLink';

/**
 * PendingBillsModal — shown on login if there are unpaid bills
 *
 * Props:
 *   pendingBills  - array of { expense, split, payer }
 *   currentMember - current user
 *   onMarkPaid    - callback(splitId) => Promise
 *   onClose       - dismiss modal
 */
export default function PendingBillsModal({ pendingBills, currentMember, onMarkPaid, onClose }) {
  const [dismissed, setDismissed] = useState(new Set());
  const [paidIds, setPaidIds] = useState(new Set());

  const visible = pendingBills.filter(
    (b) => !dismissed.has(b.split.id) && !paidIds.has(b.split.id)
  );

  const totalDue = visible.reduce(
    (sum, b) => sum + b.split.share + b.split.carry_forward,
    0
  );

  const handleMarkPaid = async (splitId) => {
    await onMarkPaid(splitId);
    setPaidIds((prev) => new Set([...prev, splitId]));
  };

  const handlePayLater = (splitId) => {
    setDismissed((prev) => new Set([...prev, splitId]));
  };

  const allDone = visible.length === 0;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pending bills"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            {allDone ? (
              <CheckCircle2 size={22} className="text-green-500" />
            ) : (
              <AlertCircle size={22} className="text-orange-500" />
            )}
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                {allDone ? 'All Settled! 🎉' : `Pending Bills (${visible.length})`}
              </h2>
              {!allDone && (
                <p className="text-xs text-orange-600 font-medium">
                  Total due: {formatRupees(totalDue)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {allDone ? (
            <div className="text-center py-10">
              <p className="text-5xl mb-3">✅</p>
              <p className="font-semibold text-gray-900">You're all caught up!</p>
              <p className="text-sm text-gray-500 mt-1">No pending payments</p>
            </div>
          ) : (
            visible.map(({ expense, split, payer }) => (
              <PaymentCard
                key={split.id}
                expense={expense}
                payer={payer}
                debtor={currentMember}
                currentShare={split.share}
                carryForward={split.carry_forward}
                splitId={split.id}
                onMarkPaid={handleMarkPaid}
                onPayLater={handlePayLater}
                isPaid={false}
                compact={false}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            {allDone ? 'Close' : 'Pay Later — Go to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
