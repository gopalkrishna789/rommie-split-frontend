import { useState } from 'react';
import { ChevronDown, Receipt, Trash2, CheckCircle2, Bell, History } from 'lucide-react';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';
import PaymentCard from './PaymentCard';
import { expensesApi } from '../utils/api';
import { CategoryIcon } from './Dashboard';

export default function ExpenseHistory({
  expenses, pagination, onLoadMore, loading,
  currentMemberId, members, onMarkPaid, onDeleteExpense, filter = 'all',
}) {
  const [expandedId, setExpandedId]         = useState(null);
  const [splitsByExpense, setSplitsByExpense] = useState({});
  const [loadingSplits, setLoadingSplits]   = useState({});
  const [payLaterIds, setPayLaterIds]       = useState(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting]             = useState(false);
  const [attemptsByExpense, setAttemptsByExpense] = useState({});
  const [remindingId, setRemindingId]       = useState(null);
  const [remindMsg, setRemindMsg]           = useState({});

  const toggleExpense = async (expenseId) => {
    if (expandedId === expenseId) { setExpandedId(null); return; }
    setExpandedId(expenseId);
    if (!splitsByExpense[expenseId]) {
      setLoadingSplits((p) => ({ ...p, [expenseId]: true }));
      try {
        const res = await expensesApi.get(expenseId);
        setSplitsByExpense((p) => ({ ...p, [expenseId]: res.data.splits }));
        // Load attempt counts for each split (non-blocking)
        const splits = res.data.splits;
        for (const split of splits) {
          if (!split.paid) {
            expensesApi.getAttempts(split.id).then(r => {
              setAttemptsByExpense(prev => ({ ...prev, [split.id]: r.data.attempts || [] }));
            }).catch(() => {});
          }
        }
      } catch (err) { console.error('Failed to load splits:', err); }
      finally { setLoadingSplits((p) => ({ ...p, [expenseId]: false })); }
    }
  };

  const handleSendReminder = async (splitId, memberName) => {
    setRemindingId(splitId);
    try {
      await expensesApi.sendReminder(splitId);
      setRemindMsg(p => ({ ...p, [splitId]: `Reminder sent to ${memberName}` }));
      setTimeout(() => setRemindMsg(p => { const n = {...p}; delete n[splitId]; return n; }), 3000);
    } catch (err) {
      setRemindMsg(p => ({ ...p, [splitId]: err.response?.data?.error || 'Failed to send' }));
      setTimeout(() => setRemindMsg(p => { const n = {...p}; delete n[splitId]; return n; }), 3000);
    } finally {
      setRemindingId(null);
    }
  };

const handleMarkPaid = async (splitId, expenseId) => {
    await onMarkPaid(splitId);
    setSplitsByExpense((p) => ({
      ...p,
      [expenseId]: (p[expenseId] || []).map((s) => s.id === splitId ? { ...s, paid: true } : s),
    }));
  };

  const handlePayerConfirm = async (splitId, expenseId) => {
    try {
      await expensesApi.payerConfirm(splitId);
      setSplitsByExpense((p) => ({
        ...p,
        [expenseId]: (p[expenseId] || []).map((s) => s.id === splitId ? { ...s, paid: true } : s),
      }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to mark as paid');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    setDeleting(true);
    try {
      await expensesApi.deleteExpense(expenseId);
      setConfirmDeleteId(null);
      if (onDeleteExpense) onDeleteExpense(expenseId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete expense');
    } finally { setDeleting(false); }
  };

  const isFullySettled = (expenseId, payerId) => {
    const splits = splitsByExpense[expenseId];
    if (!splits || splits.length === 0) return false;
    const nonPayer = splits.filter((s) => s.member_id !== payerId);
    return nonPayer.length > 0 && nonPayer.every((s) => s.paid);
  };

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === 'all') return true;
    const splits = splitsByExpense[expense.id] || [];
    const mySplit = splits.find((s) => s.member_id === currentMemberId);
    if (filter === 'pending') {
      if (expense.payer_id === currentMemberId) return true;
      return mySplit && !mySplit.paid;
    }
    if (filter === 'paid') return !mySplit || mySplit.paid;
    return true;
  });

  if (!loading && expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16" style={{ color: '#9CA3AF' }}>
        <Receipt size={44} className="mb-3 opacity-40" strokeWidth={1.5} />
        <p className="font-heading font-semibold" style={{ color: '#6B7280' }}>No expenses yet</p>
        <p className="text-sm mt-1">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredExpenses.map((expense) => {
        const isExpanded        = expandedId === expense.id;
        const splits            = splitsByExpense[expense.id] || [];
        const mySplit           = splits.find((s) => s.member_id === currentMemberId);
        const payer             = members.find((m) => m.id === expense.payer_id);
        const isMyExpense       = expense.payer_id === currentMemberId;
        const iHaveUnpaid       = mySplit && !mySplit.paid && !isMyExpense;
        const fullySettled      = isFullySettled(expense.id, expense.payer_id);
        const isConfirmingDelete = confirmDeleteId === expense.id;

        return (
          <div key={expense.id} className="rounded-2xl overflow-hidden"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              border: `1px solid ${fullySettled ? '#C7D2FE' : iHaveUnpaid ? '#FFCDB4' : '#E5E5E3'}`,
            }}>

            {/* Row */}
            <button onClick={() => toggleExpense(expense.id)}
              className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50"
              aria-expanded={isExpanded}>
              <CategoryIcon category={expense.category} purpose={expense.purpose} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-sm" style={{ color: '#1C1C1E' }}>{expense.purpose}</p>
                <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                  {isMyExpense ? 'You' : expense.payer_name} ·{' '}
                  {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                {expense.notes && (
                  <p className="text-xs truncate italic mt-0.5" style={{ color: '#9CA3AF' }}>"{expense.notes}"</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="font-heading font-semibold text-sm tabular-nums" style={{ color: '#1C1C1E' }}>
                  {formatRupees(expense.total_amount)}
                </span>
                {iHaveUnpaid && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold badge-owe">
                    Owe {formatRupees(mySplit.share + mySplit.carry_forward)}
                  </span>
                )}
                {mySplit?.paid && !isMyExpense && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold badge-settled">Paid</span>
                )}
                {isMyExpense && !fullySettled && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: '#EEF2FF', color: '#4338CA' }}>You paid</span>
                )}
                {fullySettled && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold badge-settled">All settled</span>
                )}
              </div>
              <ChevronDown size={15} strokeWidth={1.75} style={{ color: '#9CA3AF', flexShrink: 0 }}
                className={`ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            {/* Settled bar */}
            {fullySettled && !isConfirmingDelete && (
              <div className="flex items-center justify-between px-4 py-2 border-t"
                style={{ background: '#F7FFF9', borderColor: '#C7D2FE' }}>
                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#4F46E5' }}>
                  <CheckCircle2 size={13} strokeWidth={2} /> Everyone has paid
                </p>
                <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(expense.id); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                  style={{ color: '#CC4A12' }}>
                  <Trash2 size={12} strokeWidth={1.75} /> Delete
                </button>
              </div>
            )}

            {/* Confirm delete */}
            {isConfirmingDelete && (
              <div className="flex items-center justify-between px-4 py-3 border-t gap-3"
                style={{ background: '#FFEEE6', borderColor: '#FFCDB4' }}>
                <p className="text-xs font-semibold flex-1" style={{ color: '#CC4A12' }}>
                  Delete "{expense.purpose}"? This can't be undone.
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{ borderColor: '#E5E5E3', color: '#6B7280', background: '#FFFFFF' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleDeleteExpense(expense.id)} disabled={deleting}
                    className="text-xs px-3 py-1.5 rounded-lg text-white font-semibold transition-colors disabled:opacity-60 flex items-center gap-1"
                    style={{ background: '#FF6B35' }}>
                    {deleting
                      ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      : <><Trash2 size={12} strokeWidth={1.75} /> Delete</>}
                  </button>
                </div>
              </div>
            )}

            {/* Splits */}
            {isExpanded && (
              <div className="border-t p-4 space-y-3" style={{ background: '#F7F7F5', borderColor: '#E5E5E3' }}>
                {loadingSplits[expense.id] ? (
                  <div className="flex justify-center py-4">
                    <span className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
                  </div>
                ) : splits.length === 0 ? (
                  <p className="text-sm text-center py-2" style={{ color: '#9CA3AF' }}>No splits data</p>
                ) : (
                  splits.map((split) => {
                    const splitMember      = members.find((m) => m.id === split.member_id);
                    const isCurrentUser    = split.member_id === currentMemberId;
                    const isPayerSplit     = split.member_id === expense.payer_id;
                    const isPayLater       = payLaterIds.has(split.id);

                    if (isPayerSplit) return null;

                    if (isCurrentUser && !split.paid && payer && !isPayLater) {
                      return (
                        <PaymentCard key={split.id} expense={expense} payer={payer}
                          debtor={splitMember} currentShare={split.share}
                          carryForward={split.carry_forward} splitId={split.id}
                          onMarkPaid={(id) => handleMarkPaid(id, expense.id)}
                          onPayLater={(id) => setPayLaterIds((p) => new Set([...p, id]))}
                          isPaid={false} />
                      );
                    }

                    if (isCurrentUser && !split.paid && isPayLater) {
                      return (
                        <div key={split.id} className="flex items-center gap-3 p-3 rounded-xl border"
                          style={{ background: '#FFFFFF', borderColor: '#FFCDB4' }}>
                          <MemberAvatar member={splitMember} size="sm" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>You (pay later)</p>
                          </div>
                          <span className="text-sm font-heading font-semibold tabular-nums" style={{ color: '#FF6B35' }}>
                            {formatRupees(split.share + split.carry_forward)}
                          </span>
                          <button onClick={() => setPayLaterIds((p) => { const n = new Set(p); n.delete(split.id); return n; })}
                            className="text-xs font-semibold" style={{ color: '#6366F1' }}>
                            Pay now
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={split.id} className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
                        <MemberAvatar member={splitMember} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>
                            {splitMember?.name || 'Unknown'}{isCurrentUser && ' (You)'}
                          </p>
                          {split.carry_forward > 0 && (
                            <p className="text-xs" style={{ color: '#FF6B35' }}>
                              +{formatRupees(split.carry_forward)} prev dues
                            </p>
                          )}
                          {/* Partial payment progress */}
                          {split.amount_paid > 0 && !split.paid && (
                            <div className="mt-1">
                              <div className="flex justify-between text-xs mb-0.5" style={{ color: '#6B7280' }}>
                                <span>Paid {formatRupees(split.amount_paid)}</span>
                                <span>{Math.round((split.amount_paid / (split.share + split.carry_forward)) * 100)}%</span>
                              </div>
                              <div className="h-1 rounded-full bg-gray-200 overflow-hidden">
                                <div className="h-full rounded-full bg-indigo-400"
                                  style={{ width: `${Math.min((split.amount_paid / (split.share + split.carry_forward)) * 100, 100)}%` }} />
                              </div>
                            </div>
                          )}
                          {/* Attempt count badge */}
                          {!split.paid && attemptsByExpense[split.id]?.length > 0 && (
                            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#6366f1' }}>
                              <History size={10} strokeWidth={2} />
                              {attemptsByExpense[split.id].length} payment attempt{attemptsByExpense[split.id].length !== 1 ? 's' : ''}
                            </p>
                          )}
                          {remindMsg[split.id] && (
                            <p className="text-xs mt-0.5 font-medium" style={{ color: remindMsg[split.id].includes('sent') ? '#6366F1' : '#CC4A12' }}>
                              {remindMsg[split.id]}
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-heading font-semibold tabular-nums" style={{ color: '#1C1C1E' }}>
                          {formatRupees(split.share)}
                        </p>
                        {!split.paid && expense.payer_id === currentMemberId && (
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={() => handlePayerConfirm(split.id, expense.id)}
                              className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                              style={{ background: '#EEF2FF', color: '#4F46E5' }}
                              title="Mark as received (cash/outside payment)">
                              ✓ Received
                            </button>
                            <button
                              onClick={() => handleSendReminder(split.id, splitMember?.name)}
                              disabled={remindingId === split.id}
                              className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                              style={{ background: '#EEF2FF', color: '#4338CA' }}
                              title="Send payment reminder email">
                              {remindingId === split.id
                                ? <span className="animate-spin w-3 h-3 border border-current border-t-transparent rounded-full" />
                                : <><Bell size={10} strokeWidth={2} /> Remind</>}
                            </button>
                          </div>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                          style={split.paid
                            ? { background: '#EEF2FF', color: '#4F46E5' }
                            : split.amount_paid > 0
                            ? { background: '#FFF8E0', color: '#996B00' }
                            : { background: '#FFF8E0', color: '#996B00' }}>
                          {split.paid ? 'Paid' : split.amount_paid > 0 ? 'Partial' : 'Pending'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

      {pagination?.hasMore && (
        <button onClick={onLoadMore} disabled={loading}
          className="w-full py-3 text-sm font-semibold rounded-2xl border transition-colors disabled:opacity-60"
          style={{ borderColor: '#C7D2FE', color: '#6366F1', background: '#FFFFFF' }}>
          {loading ? 'Loading…' : 'Load more expenses'}
        </button>
      )}
    </div>
  );
}
