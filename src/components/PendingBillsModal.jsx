import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import PaymentCard from './PaymentCard';
import { formatRupees } from '../utils/upiLink';

const STORAGE_KEY = 'roomie_dismissed_splits';

function loadDismissed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    // Each entry has { id, dismissedAt } — expire after 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const valid = parsed.filter((e) => e.dismissedAt > cutoff);
    return new Set(valid.map((e) => e.id));
  } catch {
    return new Set();
  }
}

function saveDismissed(set) {
  try {
    const now = Date.now();
    const arr = [...set].map((id) => ({ id, dismissedAt: now }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

export default function PendingBillsModal({ pendingBills, currentMember, onMarkPaid, onConfirmPayment, onClose, netPairs = [] }) {
  const [dismissed, setDismissed] = useState(() => loadDismissed());
  const [paidIds, setPaidIds]     = useState(new Set());

  // Sync dismissed to localStorage whenever it changes
  useEffect(() => {
    saveDismissed(dismissed);
  }, [dismissed]);

  const handleDismiss = (splitId) => {
    setDismissed((prev) => {
      const next = new Set([...prev, splitId]);
      saveDismissed(next);
      return next;
    });
  };

  const visible  = pendingBills.filter((b) => !dismissed.has(b.split.id) && !paidIds.has(b.split.id));
  const totalDue = visible.reduce((sum, b) => sum + b.split.share + (b.split.carry_forward || 0), 0);
  const allDone  = visible.length === 0;

  // Build net offset info per payer from netPairs
  // netPairs: [{ fromId, toId, amount, fromName, toName, ... }]
  // Group pending bills by payer and compute net amount after mutual offset
  const netByPayer = {};
  if (currentMember && netPairs.length > 0) {
    // Find all pairs involving current member
    const myPairs = netPairs.filter(
      (p) => p.fromId === currentMember.id || p.toId === currentMember.id
    );
    myPairs.forEach((pair) => {
      const iOwe = pair.fromId === currentMember.id;
      const otherId = iOwe ? pair.toId : pair.fromId;
      netByPayer[otherId] = {
        netAmount: pair.amount,
        iOwe,
        otherName: iOwe ? pair.toName : pair.fromName,
      };
    });
  }

  const handleMarkPaid = async (splitId) => {
    await onMarkPaid(splitId);
    setPaidIds((p) => new Set([...p, splitId]));
    // Remove from dismissed if it was there
    setDismissed((p) => { const n = new Set(p); n.delete(splitId); return n; });
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog" aria-modal="true" aria-label="Pending bills">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ background: '#FFFFFF' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: allDone ? '#EEF2FF' : '#FFEEE6' }}>
              {allDone
                ? <CheckCircle2 size={18} style={{ color: '#6366F1' }} strokeWidth={2} />
                : <AlertCircle size={18} style={{ color: '#FF6B35' }} strokeWidth={2} />}
            </div>
            <div>
              <h2 className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>
                {allDone ? 'All Settled!' : `Pending Bills (${visible.length})`}
              </h2>
              {!allDone && (
                <p className="text-xs font-semibold" style={{ color: '#FF6B35' }}>
                  Total due: {formatRupees(totalDue)}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {allDone ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#EEF2FF' }}>
                <CheckCircle2 size={32} style={{ color: '#6366F1' }} strokeWidth={1.75} />
              </div>
              <p className="font-heading font-semibold text-lg" style={{ color: '#1C1C1E' }}>You're all caught up!</p>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>No pending payments</p>
            </div>
          ) : (() => {
            // Group visible bills by payer id
            const groups = {};
            visible.forEach((bill) => {
              const payerId = bill.payer.id;
              if (!groups[payerId]) groups[payerId] = { payer: bill.payer, bills: [] };
              groups[payerId].bills.push(bill);
            });

            return Object.values(groups).map(({ payer, bills }) => {
              const grossOwed = bills.reduce(
                (sum, b) => sum + b.split.share + (b.split.carry_forward || 0), 0
              );
              const netInfo = netByPayer[payer.id];
              // iOwe=true → we owe them net; iOwe=false → they owe us net (mutual offset flips direction)
              const theyOweUs = netInfo && !netInfo.iOwe;
              const showNetBanner = netInfo && netInfo.iOwe && netInfo.netAmount < grossOwed;

              return (
                <div key={payer.id} className="space-y-2">
                  {/* Net offset banner */}
                  {(showNetBanner || theyOweUs) && (
                    <div className="flex items-start gap-2.5 rounded-2xl p-3"
                      style={{
                        background: theyOweUs ? '#F0FDF4' : '#EEF2FF',
                        border: `1px solid ${theyOweUs ? '#BBF7D0' : '#C7D2FE'}`,
                      }}>
                      <Info size={14} strokeWidth={2}
                        style={{ color: theyOweUs ? '#16A34A' : '#4F46E5', flexShrink: 0, marginTop: 1 }} />
                      <div className="flex-1 min-w-0">
                        {theyOweUs ? (
                          <>
                            <p className="text-xs font-semibold" style={{ color: '#15803D' }}>
                              Mutual offset — {payer.name} owes you more
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#16A34A' }}>
                              {payer.name} owes you{' '}
                              <span className="font-bold">{formatRupees(netInfo.netAmount)} net</span>
                              {' '}after cancelling mutual debts. No payment needed from you.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold" style={{ color: '#3730A3' }}>
                              Mutual offset applied
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#4F46E5' }}>
                              Gross: {formatRupees(grossOwed)} — {payer.name} also owes you{' '}
                              <span className="font-bold">{formatRupees(grossOwed - netInfo.netAmount)}</span>.
                              {' '}Net you owe:{' '}
                              <span className="font-bold">{formatRupees(netInfo.netAmount)}</span>
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Individual split cards — hide if they owe us net (no payment needed from us) */}
                  {!theyOweUs && bills.map(({ expense, split }) => (
                    <PaymentCard
                      key={split.id}
                      expense={expense}
                      payer={payer}
                      debtor={currentMember}
                      currentShare={split.share}
                      carryForward={split.carry_forward}
                      splitId={split.id}
                      amountPaid={split.amount_paid || 0}
                      paymentStatus={split.payment_status || 'unpaid'}
                      isPayerView={currentMember?.id === payer.id}
                      onMarkPaid={handleMarkPaid}
                      onPayLater={(id) => handleDismiss(id)}
                      onConfirmPayment={onConfirmPayment}
                      isPaid={false}
                      compact={false}
                    />
                  ))}
                </div>
              );
            });
          })()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: '#F3F4F6' }}>
          <button onClick={onClose}
            className="w-full border rounded-xl py-3 font-semibold transition-colors text-sm"
            style={{ borderColor: '#E5E5E3', color: '#6B7280', background: '#FFFFFF' }}>
            {allDone ? 'Close' : 'Pay Later — Go to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
