import { useState } from 'react';
import { ChevronDown, Receipt, Trash2 } from 'lucide-react';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';
import PaymentCard from './PaymentCard';
import { expensesApi } from '../utils/api';

// Category emoji map (mirrors Dashboard)
function getCategoryEmoji(purpose = '', category = '') {
  if (category && category !== 'other') {
    const map = {
      groceries: '🛒', electricity: '⚡', water: '💧', wifi: '📶',
      rent: '🏠', gas: '🔥', cleaning: '🧹', food: '🍕',
      transport: '🚗', medicine: '💊', entertainment: '🎬',
      household: '🧴', other: '💰',
    };
    if (map[category]) return map[category];
  }
  const p = purpose.toLowerCase();
  if (p.includes('grocer') || p.includes('food') || p.includes('vegeta')) return '🛒';
  if (p.includes('electric') || p.includes('power') || p.includes('bill')) return '⚡';
  if (p.includes('water'))   return '💧';
  if (p.includes('wifi') || p.includes('internet')) return '📶';
  if (p.includes('rent'))    return '🏠';
  if (p.includes('gas'))     return '🔥';
  if (p.includes('clean') || p.includes('maid')) return '🧹';
  if (p.includes('pizza') || p.includes('zomato') || p.includes('swiggy')) return '🍕';
  if (p.includes('petrol') || p.includes('fuel') || p.includes('cab')) return '🚗';
  if (p.includes('movie') || p.includes('netflix')) return '🎬';
  if (p.includes('medic') || p.includes('pharma')) return '💊';
  return '💰';
}

/**
 * ExpenseHistory — paginated list of all expenses with split details
 */
export default function ExpenseHistory({
  expenses,
  pagination,
  onLoadMore,
  loading,
  currentMemberId,
  members,
  onMarkPaid,
  onDeleteExpense,
  filter = 'all',
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [splitsByExpense, setSplitsByExpense] = useState({});
  const [loadingSplits, setLoadingSplits] = useState({});
  const [payLaterIds, setPayLaterIds] = useState(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggleExpense = async (expenseId) => {
    if (expandedId === expenseId) { setExpandedId(null); return; }
    setExpandedId(expenseId);
    if (!splitsByExpense[expenseId]) {
      setLoadingSplits((prev) => ({ ...prev, [expenseId]: true }));
      try {
        const res = await expensesApi.get(expenseId);
        setSplitsByExpense((prev) => ({ ...prev, [expenseId]: res.data.splits }));
      } catch (err) {
        console.error('Failed to load splits:', err);
      } finally {
        setLoadingSplits((prev) => ({ ...prev, [expenseId]: false }));
      }
    }
  };

  const handleMarkPaid = async (splitId, expenseId) => {
    await onMarkPaid(splitId);
    // Update local split state
    setSplitsByExpense((prev) => ({
      ...prev,
      [expenseId]: (prev[expenseId] || []).map((s) =>
        s.id === splitId ? { ...s, paid: true } : s
      ),
    }));
  };

  const handlePayLater = (splitId) => {
    setPayLaterIds((prev) => new Set([...prev, splitId]));
  };

  const handleDeleteExpense = async (expenseId) => {
    setDeleting(true);
    try {
      await expensesApi.deleteExpense(expenseId);
      setConfirmDeleteId(null);
      if (onDeleteExpense) onDeleteExpense(expenseId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  /**
   * An expense is fully settled when:
   * - splits have been loaded for it, AND
   * - every non-payer split is paid
   */
  const isFullySettled = (expenseId, payerId) => {
    const splits = splitsByExpense[expenseId];
    if (!splits || splits.length === 0) return false;
    const nonPayerSplits = splits.filter((s) => s.member_id !== payerId);
    if (nonPayerSplits.length === 0) return false; // solo expense, no one to settle
    return nonPayerSplits.every((s) => s.paid);
  };

  // Apply filter
  const filteredExpenses = expenses.filter((expense) => {
    if (filter === 'all') return true;
    const splits = splitsByExpense[expense.id] || [];
    const mySplit = splits.find((s) => s.member_id === currentMemberId);
    if (filter === 'pending') {
      // Show if I have an unpaid split OR if I'm the payer and someone owes me
      if (expense.payer_id === currentMemberId) return true; // I paid, show always
      return mySplit && !mySplit.paid;
    }
    if (filter === 'paid') {
      return !mySplit || mySplit.paid;
    }
    return true;
  });

  if (!loading && expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Receipt size={48} className="mb-3 opacity-40" />
        <p className="font-medium">No expenses yet</p>
        <p className="text-sm mt-1">Add your first expense to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredExpenses.map((expense) => {
        const isExpanded = expandedId === expense.id;
        const splits = splitsByExpense[expense.id] || [];
        const mySplit = splits.find((s) => s.member_id === currentMemberId);
        const payer = members.find((m) => m.id === expense.payer_id);
        const isMyExpense = expense.payer_id === currentMemberId;
        const iHaveUnpaid = mySplit && !mySplit.paid && !isMyExpense;
        const fullySettled = isFullySettled(expense.id, expense.payer_id);
        const isConfirmingDelete = confirmDeleteId === expense.id;

        return (
          <div
            key={expense.id}
            className={`rounded-2xl border overflow-hidden ${
              fullySettled
                ? 'border-green-200 bg-white'
                : iHaveUnpaid
                ? 'border-orange-200 bg-white'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Expense row */}
            <button
              onClick={() => toggleExpense(expense.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
              aria-expanded={isExpanded}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                style={{ background: `${expense.payer_color || '#6366f1'}15` }}
              >
                {getCategoryEmoji(expense.purpose, expense.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{expense.purpose}</p>
                <p className="text-xs text-gray-500">
                  {isMyExpense ? 'You' : expense.payer_name} ·{' '}
                  {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
                {expense.notes && (
                  <p className="text-xs text-gray-400 truncate italic mt-0.5">"{expense.notes}"</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className="font-bold text-gray-900 text-sm">
                  {formatRupees(expense.total_amount)}
                </span>
                {iHaveUnpaid && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
                    Owe {formatRupees(mySplit.share + mySplit.carry_forward)}
                  </span>
                )}
                {mySplit?.paid && !isMyExpense && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700">
                    ✓ Paid
                  </span>
                )}
                {isMyExpense && !fullySettled && (
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                    You paid
                  </span>
                )}
                {fullySettled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                    ✅ All settled
                  </span>
                )}
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 flex-shrink-0 transition-transform ml-1 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Delete bar — shown when all roommates have paid */}
            {fullySettled && !isConfirmingDelete && (
              <div className="flex items-center justify-between px-4 py-2 bg-green-50 border-t border-green-100">
                <p className="text-xs text-green-700 font-medium">Everyone has paid 🎉</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(expense.id); }}
                  className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  aria-label="Delete expense"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}

            {/* Confirm delete */}
            {isConfirmingDelete && (
              <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-t border-red-100 gap-3">
                <p className="text-xs text-red-700 font-medium flex-1">
                  Delete "{expense.purpose}"? This can't be undone.
                </p>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    disabled={deleting}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors disabled:opacity-60 flex items-center gap-1"
                  >
                    {deleting
                      ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      : <Trash2 size={12} />}
                    Delete
                  </button>
                </div>
              </div>
            )}

            {/* Splits detail */}
            {isExpanded && (
              <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
                {loadingSplits[expense.id] ? (
                  <div className="flex justify-center py-4">
                    <span className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
                  </div>
                ) : splits.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-2">No splits data</p>
                ) : (
                  splits.map((split) => {
                    const splitMember = members.find((m) => m.id === split.member_id);
                    const isCurrentUserSplit = split.member_id === currentMemberId;
                    const isPayerSplit = split.member_id === expense.payer_id;
                    const isPayLater = payLaterIds.has(split.id);

                    // Payer's own split — skip (auto-paid)
                    if (isPayerSplit) return null;

                    // Current user's unpaid split → show full PaymentCard
                    if (isCurrentUserSplit && !split.paid && payer && !isPayLater) {
                      return (
                        <PaymentCard
                          key={split.id}
                          expense={expense}
                          payer={payer}
                          debtor={splitMember}
                          currentShare={split.share}
                          carryForward={split.carry_forward}
                          splitId={split.id}
                          onMarkPaid={(id) => handleMarkPaid(id, expense.id)}
                          onPayLater={handlePayLater}
                          isPaid={false}
                        />
                      );
                    }

                    // Pay later dismissed — show compact row
                    if (isCurrentUserSplit && !split.paid && isPayLater) {
                      return (
                        <div key={split.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-orange-100">
                          <MemberAvatar member={splitMember} size="sm" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">You (pay later)</p>
                          </div>
                          <span className="text-sm font-semibold text-orange-600">
                            {formatRupees(split.share + split.carry_forward)}
                          </span>
                          <button
                            onClick={() => setPayLaterIds((prev) => {
                              const n = new Set(prev); n.delete(split.id); return n;
                            })}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            Pay now
                          </button>
                        </div>
                      );
                    }

                    // Other member's split — simple row
                    return (
                      <div key={split.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                        <MemberAvatar member={splitMember} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {splitMember?.name || 'Unknown'}
                            {isCurrentUserSplit && ' (You)'}
                          </p>
                          {split.carry_forward > 0 && (
                            <p className="text-xs text-orange-500">
                              +{formatRupees(split.carry_forward)} prev dues
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatRupees(split.share)}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                            split.paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {split.paid ? '✓ Paid' : 'Pending'}
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

      {/* Load more */}
      {pagination?.hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full py-3 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-2xl border border-indigo-200 transition-colors disabled:opacity-60"
        >
          {loading ? 'Loading...' : 'Load more expenses'}
        </button>
      )}
    </div>
  );
}
