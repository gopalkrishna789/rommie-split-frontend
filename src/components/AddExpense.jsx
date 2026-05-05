import { useState, useRef } from 'react';
import {
  X, Plus, ChevronDown, Equal, Sliders, AlertCircle, Check,
  ShoppingCart, Zap, Droplets, Wifi, Home as HomeIcon,
  Flame, Brush, UtensilsCrossed, Car, Pill, Film, Package, HelpCircle,
  Camera, RefreshCw, Repeat,
} from 'lucide-react';
import { rupeesToPaise, formatRupees } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';

const CATEGORIES = [
  { id: 'groceries',     label: 'Groceries',    Icon: ShoppingCart,    color: '#27AE78' },
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

export default function AddExpense({ members, onAdd, onClose }) {
  const [category, setCategory]         = useState('');
  const [customPurpose, setCustomPurpose] = useState('');
  const [showCatPicker, setShowCatPicker] = useState(false);
  const [amount, setAmount]             = useState('');
  const [payerId, setPayerId]           = useState(members[0]?.id || '');
  const [date, setDate]                 = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes]               = useState('');
  const [splitMode, setSplitMode]       = useState('equal');
  const [customShares, setCustomShares] = useState(
    Object.fromEntries(members.map((m) => [m.id, '']))
  );
  const [isRecurring, setIsRecurring]   = useState(false);
  const [recurringDay, setRecurringDay] = useState(1);
  const [receiptBase64, setReceiptBase64] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const receiptRef = useRef();

  const selectedCat = CATEGORIES.find((c) => c.id === category);
  const isOther     = category === 'other';
  const purpose     = isOther ? customPurpose : (selectedCat?.label || '');
  const totalPaise  = rupeesToPaise(amount || 0);
  const perShare    = members.length > 0 ? Math.round(totalPaise / members.length) : 0;
  const customTotal = Object.values(customShares).reduce((s, v) => s + rupeesToPaise(v || 0), 0);
  const customRemaining = totalPaise - customTotal;

  const fillRemaining = (memberId) => {
    const others = members.filter((m) => m.id !== memberId);
    const othersTotal = others.reduce((s, m) => s + rupeesToPaise(customShares[m.id] || 0), 0);
    const remaining = totalPaise - othersTotal;
    if (remaining >= 0) setCustomShares((p) => ({ ...p, [memberId]: (remaining / 100).toFixed(2) }));
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('Receipt image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setReceiptBase64(ev.target.result); setReceiptPreview(ev.target.result); setError(''); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (!category) return setError('Please select a category');
    if (isOther && !customPurpose.trim()) return setError('Please describe the expense');
    if (!amount || parseFloat(amount) <= 0) return setError('Enter a valid amount');
    if (!payerId) return setError('Select who paid');
    if (splitMode === 'custom' && Math.abs(customRemaining) > 1)
      return setError(`Shares must add up to ${formatRupees(totalPaise)}. Remaining: ${formatRupees(customRemaining)}`);

    setLoading(true);
    try {
      await onAdd({
        payerId, purpose: purpose.trim(), category,
        notes: notes.trim() || undefined,
        totalAmount: totalPaise, date, splitMode,
        customShares: splitMode === 'custom'
          ? Object.fromEntries(members.map((m) => [m.id, rupeesToPaise(customShares[m.id] || 0)]))
          : undefined,
        isRecurring,
        recurringDay: isRecurring ? recurringDay : undefined,
        receiptBase64: receiptBase64 || undefined,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog" aria-modal="true">
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[95vh] flex flex-col"
        style={{ background: '#FFFFFF' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b flex-shrink-0"
          style={{ borderColor: '#F3F4F6' }}>
          <div>
            <h2 className="font-heading font-semibold text-lg" style={{ color: '#1C1C1E' }}>Add Expense</h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Split with your roommates</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-gray-100"
            style={{ color: '#6B7280' }} aria-label="Close">
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="p-5 space-y-5">

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Category <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <button type="button" onClick={() => setShowCatPicker((v) => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left"
                style={{
                  borderColor: selectedCat ? '#27AE78' : '#E5E5E3',
                  background: selectedCat ? '#D4F5E7' : '#FFFFFF',
                }}>
                {selectedCat ? (
                  <>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${selectedCat.color}20` }}>
                      <selectedCat.Icon size={18} style={{ color: selectedCat.color }} strokeWidth={1.75} />
                    </div>
                    <span className="flex-1 font-semibold text-sm" style={{ color: '#1C1C1E' }}>{selectedCat.label}</span>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: '#F7F7F5' }}>
                      <Package size={18} style={{ color: '#9CA3AF' }} strokeWidth={1.75} />
                    </div>
                    <span className="flex-1 text-sm" style={{ color: '#9CA3AF' }}>Select a category…</span>
                  </>
                )}
                <ChevronDown size={16} style={{ color: '#9CA3AF' }}
                  className={`flex-shrink-0 transition-transform ${showCatPicker ? 'rotate-180' : ''}`} />
              </button>

              {showCatPicker && (
                <div className="mt-2 grid grid-cols-3 gap-2 p-3 rounded-2xl border animate-fade-in"
                  style={{ background: '#F7F7F5', borderColor: '#E5E5E3' }}>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.id} type="button"
                      onClick={() => { setCategory(cat.id); setShowCatPicker(false); if (cat.id !== 'other') setCustomPurpose(''); }}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: category === cat.id ? '#27AE78' : 'transparent',
                        background: category === cat.id ? '#FFFFFF' : 'transparent',
                      }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: `${cat.color}18` }}>
                        <cat.Icon size={17} style={{ color: cat.color }} strokeWidth={1.75} />
                      </div>
                      <span className="text-[10px] font-semibold text-center leading-tight" style={{ color: '#6B7280' }}>
                        {cat.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {isOther && (
                <input type="text" value={customPurpose} onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Describe the expense…" maxLength={200} autoFocus
                  className="mt-2 w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none input-focus"
                  style={{ borderColor: '#27AE78', background: '#F7FFF9' }} />
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Total Amount <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-bold text-xl" style={{ color: '#6B7280' }}>₹</span>
                <input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0" min="1" step="0.01"
                  className="w-full border-2 rounded-2xl pl-9 pr-4 py-3.5 text-2xl font-heading font-bold focus:outline-none input-focus tabular-nums"
                  style={{ borderColor: '#E5E5E3' }} />
              </div>
              {totalPaise > 0 && members.length > 0 && splitMode === 'equal' && (
                <p className="text-xs mt-1.5 font-semibold" style={{ color: '#27AE78' }}>
                  ÷ {members.length} = {formatRupees(perShare)} each
                </p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none input-focus"
                style={{ borderColor: '#E5E5E3' }} />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Notes <span className="font-normal normal-case" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Big Bazaar receipt, includes snacks…" maxLength={500} rows={2}
                className="w-full border-2 rounded-xl px-4 py-2.5 text-sm focus:outline-none input-focus resize-none"
                style={{ borderColor: '#E5E5E3' }} />
            </div>

            {/* Receipt photo */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Receipt Photo <span className="font-normal normal-case" style={{ color: '#9CA3AF' }}>(optional)</span>
              </label>
              {receiptPreview ? (
                <div className="relative rounded-2xl overflow-hidden border-2" style={{ borderColor: '#27AE78' }}>
                  <img src={receiptPreview} alt="Receipt" className="w-full max-h-40 object-cover" />
                  <button type="button" onClick={() => { setReceiptBase64(null); setReceiptPreview(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold"
                    style={{ background: 'rgba(39,174,120,0.9)', color: '#fff' }}>
                    <Check size={11} /> Receipt attached
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => receiptRef.current?.click()}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed transition-all"
                  style={{ borderColor: '#E5E5E3', background: '#F7F7F5' }}>
                  <Camera size={18} style={{ color: '#9CA3AF' }} />
                  <span className="text-sm" style={{ color: '#9CA3AF' }}>Tap to attach bill photo</span>
                </button>
              )}
              <input ref={receiptRef} type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" aria-hidden="true" />
            </div>

            {/* Recurring toggle */}
            <div className="rounded-2xl border-2 p-4 transition-all"
              style={{ borderColor: isRecurring ? '#27AE78' : '#E5E5E3', background: isRecurring ? '#F7FFF9' : '#FFFFFF' }}>
              <button type="button" onClick={() => setIsRecurring((v) => !v)}
                className="w-full flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isRecurring ? '#D4F5E7' : '#F7F7F5' }}>
                  <Repeat size={17} style={{ color: isRecurring ? '#27AE78' : '#9CA3AF' }} strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>Recurring monthly</p>
                  <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Auto-creates this expense every month</p>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${isRecurring ? '' : ''}`}
                  style={{ background: isRecurring ? '#27AE78' : '#D1D5DB' }}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isRecurring ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>
              {isRecurring && (
                <div className="mt-3 flex items-center gap-3 animate-fade-in">
                  <label className="text-xs font-semibold" style={{ color: '#6B7280' }}>Day of month:</label>
                  <input type="number" value={recurringDay} min={1} max={28}
                    onChange={(e) => setRecurringDay(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-16 border-2 rounded-xl px-3 py-1.5 text-sm text-center font-semibold focus:outline-none input-focus"
                    style={{ borderColor: '#27AE78' }} />
                  <span className="text-xs" style={{ color: '#6B7280' }}>of each month</span>
                </div>
              )}
            </div>

            {/* Who paid */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>
                Who paid? <span style={{ color: '#FF6B35' }}>*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {members.map((member) => (
                  <button key={member.id} type="button" onClick={() => setPayerId(member.id)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left"
                    style={{
                      borderColor: payerId === member.id ? '#27AE78' : '#E5E5E3',
                      background: payerId === member.id ? '#D4F5E7' : '#FFFFFF',
                    }}
                    aria-pressed={payerId === member.id}>
                    <MemberAvatar member={member} size="sm" />
                    <span className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{member.name}</span>
                    {payerId === member.id && <Check size={14} className="ml-auto flex-shrink-0" style={{ color: '#27AE78' }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Split mode */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>How to split?</label>
              <div className="flex gap-2 mb-3">
                {[
                  { id: 'equal', Icon: Equal, label: 'Equal' },
                  { id: 'custom', Icon: Sliders, label: 'Custom' },
                ].map(({ id, Icon, label }) => (
                  <button key={id} type="button" onClick={() => setSplitMode(id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all"
                    style={{
                      borderColor: splitMode === id ? '#27AE78' : '#E5E5E3',
                      background: splitMode === id ? '#D4F5E7' : '#FFFFFF',
                      color: splitMode === id ? '#1A6B4A' : '#6B7280',
                    }}>
                    <Icon size={15} strokeWidth={1.75} />
                    {label}
                  </button>
                ))}
              </div>

              {splitMode === 'custom' && (
                <div className="space-y-2 rounded-2xl p-3 border" style={{ background: '#F7F7F5', borderColor: '#E5E5E3' }}>
                  <div className="flex justify-between text-xs px-1 mb-1" style={{ color: '#6B7280' }}>
                    <span>Member</span>
                    <span>
                      Remaining:{' '}
                      <span className="font-bold" style={{
                        color: customRemaining < 0 ? '#FF6B35' : customRemaining === 0 ? '#27AE78' : '#F7C948'
                      }}>
                        {formatRupees(Math.abs(customRemaining))}
                        {customRemaining < 0 ? ' over' : customRemaining > 0 ? ' left' : ' ✓'}
                      </span>
                    </span>
                  </div>
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center gap-3 rounded-xl px-3 py-2 border"
                      style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
                      <MemberAvatar member={member} size="sm" />
                      <span className="text-sm font-medium flex-1 truncate" style={{ color: '#1C1C1E' }}>{member.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm" style={{ color: '#6B7280' }}>₹</span>
                        <input type="number" value={customShares[member.id]}
                          onChange={(e) => setCustomShares((p) => ({ ...p, [member.id]: e.target.value }))}
                          placeholder="0" min="0" step="0.01"
                          className="w-20 border rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none input-focus"
                          style={{ borderColor: '#E5E5E3' }} />
                      </div>
                      <button type="button" onClick={() => fillRemaining(member.id)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg transition-colors"
                        style={{ color: '#27AE78', background: '#D4F5E7' }}>
                        Fill
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm rounded-xl px-4 py-3"
                style={{ background: '#FFEEE6', color: '#CC4A12', border: '1px solid #FFCDB4' }}>
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="px-5 pb-6 pt-2 flex-shrink-0">
            {selectedCat && totalPaise > 0 && (
              <div className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-3"
                style={{ background: '#D4F5E7', border: '1px solid #A8E6C8' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${selectedCat.color}20` }}>
                  <selectedCat.Icon size={14} style={{ color: selectedCat.color }} strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: '#1A6B4A' }}>{purpose || selectedCat.label}</p>
                  <p className="text-xs" style={{ color: '#27AE78' }}>
                    {formatRupees(totalPaise)} · {splitMode === 'equal' ? `${formatRupees(perShare)}/person` : 'Custom split'}
                  </p>
                </div>
                <span className="text-xs font-semibold" style={{ color: '#1A6B4A' }}>{members.length} people</span>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white rounded-2xl py-4 font-heading font-semibold text-base transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ background: '#27AE78', boxShadow: '0 4px 14px rgba(39,174,120,0.30)' }}>
              {loading
                ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                : <><Plus size={20} strokeWidth={2.5} /> Add Expense</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
