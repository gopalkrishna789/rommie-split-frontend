import { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, Zap, Copy, Check } from 'lucide-react';
import { expensesApi } from '../utils/api';
import { formatRupees, launchUpiPayment, isMobile } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';

export default function SettlementModal({ onClose, currentMemberId }) {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedUpi, setCopiedUpi] = useState(null);

  useEffect(() => {
    expensesApi.settlementPlan()
      .then(res => {
        // Normalize flat backend shape → nested { from, to } objects the UI expects
        const normalized = (res.data.transactions || []).map(t => ({
          from: {
            id:       t.from,
            name:     t.fromName,
            color:    t.fromColor,
            initials: t.fromInitials,
          },
          to: {
            id:      t.to,
            name:    t.toName,
            color:   t.toColor,
            initials: t.toInitials,
            upiId:   t.toUpiId,
            qrCode:  t.toQrCode,
          },
          amount: t.amount,
        }));
        setPlan(normalized);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myTransactions = plan.filter(t => t.from.id === currentMemberId);
  const otherTransactions = plan.filter(t => t.from.id !== currentMemberId);
  const mobile = isMobile();

  const handlePay = (txn) => {
    launchUpiPayment('upi', { upi_id: txn.to.upiId, name: txn.to.name }, txn.amount, 'Settlement');
  };

  const handleCopyUpi = async (upiId, key) => {
    try { await navigator.clipboard.writeText(upiId); } catch {}
    setCopiedUpi(key);
    setTimeout(() => setCopiedUpi(null), 2000);
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
        style={{ background: '#FFFFFF' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor: '#F3F4F6' }}>
          <div>
            <h2 className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>Settle Up</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              Minimum transactions to clear all debts
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} strokeWidth={1.75} style={{ color: '#6B7280' }} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
                style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
            </div>
          ) : plan.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: '#EEF2FF' }}>
                <CheckCircle2 size={32} style={{ color: '#6366F1' }} strokeWidth={1.75} />
              </div>
              <p className="font-heading font-semibold text-lg" style={{ color: '#1C1C1E' }}>All settled up!</p>
              <p className="text-sm mt-1" style={{ color: '#6B7280' }}>No pending payments in the group</p>
            </div>
          ) : (
            <>
              {/* My payments */}
              {myTransactions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                    You need to pay
                  </p>
                  <div className="space-y-2">
                    {myTransactions.map((txn, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border"
                        style={{ background: '#FFEEE6', borderColor: '#FFCDB4' }}>
                        <MemberAvatar member={{ color: txn.from.color, avatar_initials: txn.from.name.slice(0,2).toUpperCase(), name: txn.from.name }} size="md" />
                        <ArrowRight size={16} style={{ color: '#FF6B35' }} strokeWidth={2} />
                        <MemberAvatar member={{ color: txn.to.color, avatar_initials: txn.to.name.slice(0,2).toUpperCase(), name: txn.to.name }} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>
                            Pay {txn.to.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-xs font-mono truncate" style={{ color: '#6B7280' }}>{txn.to.upiId}</p>
                            {txn.to.upiId && (
                              <button onClick={() => handleCopyUpi(txn.to.upiId, `my-${i}`)}
                                className="flex-shrink-0 flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md transition-colors"
                                style={{ background: '#FFFFFF', color: copiedUpi === `my-${i}` ? '#6366F1' : '#6B7280', border: '1px solid #E5E5E3' }}
                                title="Copy UPI ID">
                                {copiedUpi === `my-${i}` ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="font-heading font-bold tabular-nums" style={{ color: '#CC4A12' }}>
                            {formatRupees(txn.amount)}
                          </span>
                          {mobile && txn.to.upiId && (
                            <button onClick={() => handlePay(txn)}
                              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-white"
                              style={{ background: '#6366F1' }}>
                              <Zap size={11} strokeWidth={2.5} /> Pay Now
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Others' payments */}
              {otherTransactions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                    Other transactions
                  </p>
                  <div className="space-y-2">
                    {otherTransactions.map((txn, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ background: '#F7F7F5', borderColor: '#E5E5E3' }}>
                        <MemberAvatar member={{ color: txn.from.color, avatar_initials: txn.from.name.slice(0,2).toUpperCase(), name: txn.from.name }} size="sm" />
                        <ArrowRight size={13} style={{ color: '#9CA3AF' }} />
                        <MemberAvatar member={{ color: txn.to.color, avatar_initials: txn.to.name.slice(0,2).toUpperCase(), name: txn.to.name }} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: '#1C1C1E' }}>
                            {txn.from.name} → {txn.to.name}
                          </p>
                          {txn.to.upiId && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <p className="text-xs font-mono truncate" style={{ color: '#9CA3AF' }}>{txn.to.upiId}</p>
                              <button onClick={() => handleCopyUpi(txn.to.upiId, `other-${i}`)}
                                className="flex-shrink-0 flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-md transition-colors"
                                style={{ background: '#FFFFFF', color: copiedUpi === `other-${i}` ? '#6366F1' : '#9CA3AF', border: '1px solid #E5E5E3' }}
                                title="Copy UPI ID">
                                {copiedUpi === `other-${i}` ? <Check size={10} /> : <Copy size={10} />}
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-heading font-semibold tabular-nums" style={{ color: '#1C1C1E' }}>
                          {formatRupees(txn.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: '#F3F4F6' }}>
          <button onClick={onClose}
            className="w-full border rounded-xl py-3 font-semibold text-sm transition-colors"
            style={{ borderColor: '#E5E5E3', color: '#6B7280' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
