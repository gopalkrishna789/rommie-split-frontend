import { useState, useRef } from 'react';
import { X, Plus, IndianRupee, ChevronDown, SplitSquareHorizontal, Equal, Sliders } from 'lucide-react';
import { rupeesToPaise, formatRupees } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';

// ── Expense categories ────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'groceries',   label: 'Groceries',       emoji: '🛒', color: '#10b981' },
  { id: 'electricity', label: 'Electricity Bill', emoji: '⚡', color: '#f59e0b' },
  { id: 'water',       label: 'Water Bill',       emoji: '💧', color: '#3b82f6' },
  { id: 'wifi',        label: 'WiFi / Internet',  emoji: '📶', color: '#6366f1' },
  { id: 'rent',        label: 'Rent',             emoji: '🏠', color: '#8b5cf6' },
  { id: 'gas',         label: 'Gas / Cooking',    emoji: '🔥', color: '#ef4444' },
  { id: 'cleaning',    label: 'Cleaning / Maid',  emoji: '🧹', color: '#06b6d4' },
  { id: 'food',        label: 'Food / Takeout',   emoji: '🍕', color: '#f97316' },
  { id: 'transport',   label: 'Transport / Fuel', emoji: '🚗', color: '#64748b' },
  { id: 'medicine',    label: 'Medicine',         emoji: '💊', color: '#ec4899' },
  { id: 'entertainment', label: 'Entertainment',  emoji: '🎬', color: '#a855f7' },
  { id: 'household',   label: 'Household Items',  emoji: '🧴', color: '#14b8a6' },
  { id: 'other',       label: 'Other',            emoji: '💰', color: '#94a3b8' },
];

export default function AddExpense({ members, onAdd, onClose }) {
  const [category, setCategory]       = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [amount, setAmount]           = useState('');
  const [payerId, setPayerId]         = useState(members[0]?.id || '');
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]             = useState('');
  const [splitMode, setSplitMode]     = useState('equal'); // 'equal' | 'custom'
  const [customShares, setCustomShares] = useState(
    Object.fromEntries(members.map((m) => [m.id, '']))
  );
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const selectedCat = CATEGORIES.find((c) => c.id === category);
  const isOther     = category === 'other';
  const purpose     = isOther ? customPurpose : (selectedCat?.label || '');

  const totalPaise  = rupeesToPaise(amount || 0);
  const perShare    = members.length > 0 ? Math.round(totalPaise / members.length) : 0;

  // Custom split total
  const customTotal = Object.values(customShares).reduce(
    (s, v) => s + rupeesToPaise(v || 0), 0
  );
  const customRemaining = totalPaise - customTotal;

  const handleCustomShare = (memberId, val) => {
    setCustomShares((prev) => ({ ...prev, [memberId]: val }));
  };

  // Auto-fill remaining for last member in custom mode
  const fillRemaining = (memberId) => {
    const others = members.filter((m) => m.id !== memberId);
    const othersTotal = others.reduce((s, m) => s + rupeesToPaise(customShares[m.id] || 0), 0);
    const remaining = totalPaise - othersTotal;
    if (remaining >= 0) {
      setCustomShares((prev) => ({
        ...prev,
        [memberId]: (remaining / 100).toFixed(2),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category) return setError('Please select a category');
    if (isOther && !customPurpose.trim()) return setError('Please describe the expense');
    if (!amount || parseFloat(amount) <= 0) return setError('Enter a valid amount');
    if (!payerId) return setError('Select who paid');

    if (splitMode === 'custom') {
      if (Math.abs(customRemaining) > 1) {
        return setError(`Custom shares must add up to ${formatRupees(totalPaise)}. Remaining: ${formatRupees(customRemaining)}`);
      }
    }

    setLoading(true);
    try {
      await onAdd({
        payerId,
        purpose: purpose.trim(),
        category: category,
        notes: notes.trim() || undefined,
        totalAmount: totalPaise,
        date,
        splitMode,
        customShares: splitMode === 'custom'
          ? Object.fromEntries(
              members.map((m) => [m.id, rupeesToPaise(customShares[m.id] || 0)])
            )
          : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Add expense"
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Add Expense</h2>
            <p className="text-xs text-gray-400 mt-0.5">Split with your roommates</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* ── Category picker ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category <span className="text-red-400">*</span>
              </label>

              {/* Selected category display / trigger */}
              <button
                type="button"
                onClick={() => setShowCatPicker((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left ${
                  selectedCat
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                {selectedCat ? (
                  <>
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: `${selectedCat.color}20` }}
                    >
                      {selectedCat.emoji}
                    </span>
                    <span className="flex-1 font-semibold text-gray-900 text-sm">
                      {selectedCat.label}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      📂
                    </span>
                    <span className="flex-1 text-gray-400 text-sm">Select a category…</span>
                  </>
                )}
                <ChevronDown
                  size={16}
                  className={`text-gray-400 transition-transform flex-shrink-0 ${showCatPicker ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Category grid */}
              {showCatPicker && (
                <div className="mt-2 grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 animate-fade-in">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setCategory(cat.id);
                        setShowCatPicker(false);
                        if (cat.id !== 'other') setCustomPurpose('');
                      }}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                        category === cat.id
                          ? 'border-indigo-400 bg-white shadow-sm'
                          : 'border-transparent hover:border-gray-200 hover:bg-white'
                      }`}
                    >
                      <span
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                        style={{ background: `${cat.color}20` }}
                      >
                        {cat.emoji}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* "Other" custom text input */}
              {isOther && (
                <div className="mt-2">
                  <input
                    type="text"
                    value={customPurpose}
                    onChange={(e) => setCustomPurpose(e.target.value)}
                    placeholder="Describe the expense…"
                    maxLength={200}
                    autoFocus
                    className="w-full border-2 border-indigo-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* ── Amount ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="amount">
                Total Amount <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₹</span>
                <input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                  step="0.01"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-9 pr-4 py-3.5 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
              </div>
              {totalPaise > 0 && members.length > 0 && splitMode === 'equal' && (
                <p className="text-xs text-indigo-600 mt-1.5 font-medium">
                  ÷ {members.length} members = {formatRupees(perShare)} each
                </p>
              )}
            </div>

            {/* ── Date ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="date">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            {/* ── Notes ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="notes">
                Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Big Bazaar receipt, includes snacks…"
                maxLength={500}
                rows={2}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
              />
            </div>

            {/* ── Who paid ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Who paid? <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setPayerId(member.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                      payerId === member.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    aria-pressed={payerId === member.id}
                  >
                    <MemberAvatar member={member} size="sm" />
                    <span className="text-sm font-semibold text-gray-800 truncate">{member.name}</span>
                    {payerId === member.id && (
                      <span className="ml-auto text-indigo-500 text-xs">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Split mode ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                How to split?
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSplitMode('equal')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    splitMode === 'equal'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Equal size={15} />
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMode('custom')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    splitMode === 'custom'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Sliders size={15} />
                  Custom
                </button>
              </div>

              {/* Custom split inputs */}
              {splitMode === 'custom' && (
                <div className="space-y-2 bg-gray-50 rounded-2xl p-3 border border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500 px-1 mb-1">
                    <span>Member</span>
                    <span>
                      Remaining:{' '}
                      <span className={`font-bold ${customRemaining < 0 ? 'text-red-500' : customRemaining === 0 ? 'text-green-600' : 'text-orange-500'}`}>
                        {formatRupees(Math.abs(customRemaining))}
                        {customRemaining < 0 ? ' over' : customRemaining > 0 ? ' left' : ' ✓'}
                      </span>
                    </span>
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <MemberAvatar member={member} size="sm" />
                      <span className="text-sm font-medium text-gray-700 flex-1 truncate">{member.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-sm">₹</span>
                        <input
                          type="number"
                          value={customShares[member.id]}
                          onChange={(e) => handleCustomShare(member.id, e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => fillRemaining(member.id)}
                        className="text-xs text-indigo-500 hover:text-indigo-700 font-medium px-1.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                        title="Fill remaining amount"
                      >
                        Fill
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Error ── */}
            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* ── Submit ── */}
          <div className="px-5 pb-6 pt-2 flex-shrink-0">
            {/* Preview pill */}
            {selectedCat && totalPaise > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 mb-3">
                <span className="text-lg">{selectedCat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-800 truncate">{purpose || selectedCat.label}</p>
                  <p className="text-xs text-indigo-500">
                    {formatRupees(totalPaise)} ·{' '}
                    {splitMode === 'equal'
                      ? `${formatRupees(perShare)}/person`
                      : 'Custom split'}
                  </p>
                </div>
                <span className="text-indigo-400 text-xs font-medium">{members.length} people</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white rounded-2xl py-4 font-bold text-base transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
            >
              {loading ? (
                <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Plus size={20} strokeWidth={2.5} />
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
