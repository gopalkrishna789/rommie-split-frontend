import { useState, useEffect } from 'react';
import {
  X, Check, AlertCircle, History, ChevronDown,
  ShoppingCart, Zap, Droplets, Wifi, Home as HomeIcon,
  Flame, Brush, UtensilsCrossed, Car, Pill, Film, Package, HelpCircle,
} from 'lucide-react';
import { rupeesToPaise, formatRupees } from '../utils/upiLink';
import { expensesApi } from '../utils/api';

const CATEGORIES = [
  { id: 'groceries',     label: 'Groceries',    Icon: ShoppingCart,    color: '#6366F1' },
  { id: 'electricity',   label: 'Electricity',  Icon: Zap,             color: '#F7C948' },
  { id: 'water',         label: 'Water',        Icon: Droplets,        color: '#3b82f6' },
  { id: 'wifi',          label: 'WiFi',         Icon: Wifi,            color: '#6366f1' },
  { id: 'rent',          label: 'Rent',         Icon: HomeIcon,        color: '#8b5cf6' },
  { id: 'gas',           label: 'Gas',          Icon: Flame,           color: '#FF6B35' },
  { id: 'cleaning',      label: 'Cleaning',     Icon: Brush,           color: '#06b6d4' },
  { id: 'food',          label: 'Food',         Icon: UtensilsCrossed, color: '#f97316' },
  { id: 'transport',     label: 'Transport',    Icon: Car,             color: '#64748b' },
  { id: 'medicine',      label: 'Medicine',     Icon: Pill,            color: '#ec4899' },
  { id: 'entertainment', label: 'Entertainment',Icon: Film,            color: '#a855f7' },
  { id: 'household',     label: 'Household',    Icon: Package,         color: '#14b8a6' },
  { id: 'other',         label: 'Other',        Icon: HelpCircle,      color: '#94a3b8' },
];

const FIELD_LABELS = {
  purpose: 'Description',
  category: 'Category',
  notes: 'Notes',
  totalAmount: 'Amount',
  date: 'Date',
};

export default function EditExpense({ expense, onClose, onSaved }) {
  const [purpose, setPurpose]     = useState(expense.purpose || '');
  const [category, setCategory]   = useState(expense.category || 'other');
  const [notes, setNotes]         = useState(expense.notes || '');
  const [amount, setAmount]       = useState(((expense.total_amount || 0) / 100).toFixed(2));
  const [date, setDate]           = useState(expense.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [edits, setEdits]         = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const selectedCat = CATEGORIES.find((c) => c.id === category);
  const totalPaise  = rupeesToPaise(amount || 0);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await expensesApi.getExpenseEdits(expense.id);
      setEdits(res.data.edits || []);
    } catch {
      setEdits([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleToggleHistory = () => {
    setShowHistory((v) => !v);
    if (!showHistory && edits.length === 0) loadHistory();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!purpose.trim()) return setError('Description is required');
    if (!amount || parseFloat(amount) <= 0) return setError('Enter a valid amount');

    setLoading(true);
    try {
      const res = await expensesApi.edit(expense.id, {
        purpose: purpose.trim(),
        category,
        notes: notes.trim() || undefined,
        totalAmount: totalPaise,
        date,
      });
      onSaved?.(res.data.expense);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const formatFieldValue = (field, value) => {
    if (field === 'totalAmount') return formatRupees(parseInt(value, 10));
    if (field === 'category') {
      const cat = CATEGORIES.find((c) => c.id === value);
      return cat?.label || value;
    }
    return value || '—';
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog" aria-modal="true" aria-label="Edit expense">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[95vh] flex flex-col"
        style={{ background: '#FFFFFF' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: '#F3F4F6' }}>
          <div>
            <h2 className="font-heading font-semibold text-lg" style={{ color: '#1C1C1E' }}>Edit Expense</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Changes are logged for transparency</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-gray-100"
            style={{ color: '#6B7280' }} aria-label="Close">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-4">

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Description <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What was this expense for?"
                maxLength={200}
                className="w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none input-focus"
                style={{ borderColor: '#E5E5E3' }}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Category
              </label>
              <button type="button" onClick={() => setShowCatPicker((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: selectedCat ? '#6366F1' : '#E5E5E3',
                  background: selectedCat ? '#EEF2FF' : '#FFFFFF',
                }}>
                {selectedCat && (
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${selectedCat.color}20` }}>
                    <selectedCat.Icon size={16} style={{ color: selectedCat.color }} strokeWidth={1.75} />
                  </div>
                )}
                <span className="flex-1 text-sm font-semibold" style={{ color: '#1C1C1E' }}>
                  {selectedCat?.label || 'Select category'}
                </span>
                <ChevronDown size={15} style={{ color: '#9CA3AF' }}
                  className={`transition-transform ${showCatPicker ? 'rotate-180' : ''}`} />
              </button>

              {showCatPicker && (
                <div className="mt-2 grid grid-cols-3 gap-2 p-3 rounded-2xl border animate-fade-in"
                  style={{ background: '#F7F7F5', borderColor: '#E5E5E3' }}>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} type="button"
                      onClick={() => { setCategory(cat.id); setShowCatPicker(false); }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: category === cat.id ? '#6366F1' : 'transparent',
                        background: category === cat.id ? '#FFFFFF' : 'transparent',
                      }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: `${cat.color}18` }}>
                        <cat.Icon size={15} style={{ color: cat.color }} strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: '#6B7280' }}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Total Amount <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-bold text-xl" style={{ color: '#6B7280' }}>₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  step="0.01"
                  className="w-full border-2 rounded-2xl pl-9 pr-4 py-3 text-xl font-heading font-bold focus:outline-none input-focus tabular-nums"
                  style={{ borderColor: '#E5E5E3' }}
                />
              </div>
              {expense.total_amount !== totalPaise && totalPaise > 0 && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#F59E0B' }}>
                  ⚠ Changing amount will recalculate unpaid splits
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none input-focus"
                style={{ borderColor: '#E5E5E3' }}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Notes <span className="font-normal normal-case" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context for your roommates…"
                maxLength={500}
                rows={2}
                className="w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none input-focus resize-none"
                style={{ borderColor: '#E5E5E3' }}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                style={{ background: '#FFEEE6', color: '#CC4A12', border: '1px solid #FFCDB4' }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Edit history */}
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E5E3' }}>
              <button
                type="button"
                onClick={handleToggleHistory}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-gray-50"
              >
                <History size={15} style={{ color: '#6B7280' }} strokeWidth={1.75} />
                <span className="text-sm font-semibold flex-1" style={{ color: '#6B7280' }}>Edit History</span>
                <ChevronDown size={14} style={{ color: '#9CA3AF' }}
                  className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              </button>

              {showHistory && (
                <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: '#F3F4F6', background: '#F9FAFB' }}>
                  {historyLoading ? (
                    <div className="flex justify-center py-3">
                      <span className="animate-spin w-4 h-4 border-2 border-t-transparent rounded-full"
                        style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
                    </div>
                  ) : edits.length === 0 ? (
                    <p className="text-xs text-center py-2" style={{ color: '#9CA3AF' }}>
                      No edits yet — this is the original version
                    </p>
                  ) : (
                    edits.map((edit) => (
                      <div key={edit.id} className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold" style={{ color: '#1C1C1E' }}>{edit.edited_by_name}</span>
                          <span style={{ color: '#9CA3AF' }}>changed</span>
                          <span className="font-semibold" style={{ color: '#6366F1' }}>
                            {FIELD_LABELS[edit.field_changed] || edit.field_changed}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 pl-1">
                          <span className="line-through" style={{ color: '#9CA3AF' }}>
                            {formatFieldValue(edit.field_changed, edit.old_value)}
                          </span>
                          <span style={{ color: '#9CA3AF' }}>→</span>
                          <span className="font-medium" style={{ color: '#059669' }}>
                            {formatFieldValue(edit.field_changed, edit.new_value)}
                          </span>
                        </div>
                        <p style={{ color: '#9CA3AF' }}>
                          {new Date(edit.edited_at).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 pb-6 pt-2 flex-shrink-0 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-xl py-3 font-semibold text-sm transition-colors"
              style={{ borderColor: '#E5E5E3', color: '#6B7280' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 text-white rounded-xl py-3 font-semibold text-sm transition-all disabled:opacity-60"
              style={{ background: '#6366F1' }}
            >
              {loading
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <><Check size={15} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
