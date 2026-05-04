import { useEffect, useState } from 'react';
import { Plus, History, ArrowRight, TrendingUp } from 'lucide-react';
import { formatRupees } from '../utils/upiLink';
import { calcGroupTotal, thisMonthExpenses } from '../utils/splitCalc';
import MemberAvatar from './MemberAvatar';
import { useNavigate } from 'react-router-dom';

export default function Dashboard({ balances, expenses, currentMemberId, members, onAddExpense, pendingCount = 0, onShowPending }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  const myBalance     = balances.find((b) => b.memberId === currentMemberId);
  const monthlyTotal  = calcGroupTotal(thisMonthExpenses(expenses));
  const youOwe        = myBalance?.totalOwed   || 0;
  const youreOwed     = myBalance?.totalOwedTo || 0;
  const netBalance    = youreOwed - youOwe;

  return (
    <div className="space-y-5">

      {/* ── Pending bills banner ── */}
      {pendingCount > 0 && (
        <button
          onClick={onShowPending}
          className="w-full flex items-center gap-3 bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-4 text-left shadow-lg shadow-orange-200/50 transition-all active:scale-[0.98] animate-fade-in-down"
        >
          <span className="text-3xl animate-wiggle">💸</span>
          <div className="flex-1">
            <p className="font-bold text-white text-sm">
              {pendingCount} pending payment{pendingCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-orange-100 mt-0.5">Tap to pay your roommates now</p>
          </div>
          <div className="bg-white/20 rounded-xl p-1.5">
            <ArrowRight size={16} className="text-white" />
          </div>
        </button>
      )}

      {/* ── Hero balance card ── */}
      <div className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-xl shadow-indigo-200/50 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a855f7 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full" />
        <div className="absolute top-4 right-16 w-8 h-8 bg-white/10 rounded-full" />

        <div className="relative">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-1">
            Your Balance
          </p>
          <p className={`text-4xl font-black mb-1 animate-count-up ${netBalance >= 0 ? 'text-white' : 'text-red-200'}`}>
            {netBalance >= 0 ? '+' : ''}{formatRupees(Math.abs(netBalance))}
          </p>
          <p className="text-indigo-200 text-sm">
            {netBalance > 0 ? '🎉 Others owe you' : netBalance < 0 ? '⚠️ You owe others' : '✅ All settled up!'}
          </p>

          {/* Mini stats row */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-indigo-200 text-xs">You owe</p>
              <p className="text-white font-bold text-sm">{formatRupees(youOwe)}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-indigo-200 text-xs">Owed to you</p>
              <p className="text-white font-bold text-sm">{formatRupees(youreOwed)}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-indigo-200 text-xs">This month</p>
              <p className="text-white font-bold text-sm">{formatRupees(monthlyTotal)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions ── */}
      <div className={`grid grid-cols-2 gap-3 ${visible ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
        <button
          onClick={onAddExpense}
          className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white rounded-2xl py-3.5 font-bold text-sm transition-all shadow-lg shadow-indigo-200/60"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Expense
        </button>
        <button
          onClick={() => navigate('/history')}
          className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 active:scale-[0.97] border-2 border-gray-100 text-gray-700 rounded-2xl py-3.5 font-bold text-sm transition-all shadow-sm"
        >
          <History size={18} />
          History
        </button>
      </div>

      {/* ── Members strip ── */}
      {members.length > 0 && (
        <div className={`${visible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-gray-900 text-sm">Roommates</p>
            <button onClick={() => navigate('/members')} className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">
              See all →
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {members.slice(0, 6).map((member, i) => {
              const bal = balances.find((b) => b.memberId === member.id);
              const net = (bal?.netBalance || 0);
              const isMe = member.id === currentMemberId;
              return (
                <button
                  key={member.id}
                  onClick={() => navigate(`/member/${member.id}`)}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 animate-fade-in-up"
                  style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                >
                  <div className="relative">
                    <MemberAvatar member={member} size="lg" />
                    {isMe && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 max-w-[52px] truncate">
                    {isMe ? 'You' : member.name.split(' ')[0]}
                  </p>
                  {bal && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      net > 0 ? 'bg-green-100 text-green-700' :
                      net < 0 ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {net === 0 ? '✓' : net > 0 ? `+${formatRupees(net)}` : formatRupees(net)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent expenses ── */}
      <div className={`${visible ? 'animate-fade-in-up delay-300' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-gray-900 text-sm">Recent Expenses</p>
          <button onClick={() => navigate('/history')} className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">
            See all →
          </button>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <div className="text-5xl mb-3 animate-float">🧾</div>
            <p className="font-bold text-gray-700">No expenses yet</p>
            <p className="text-sm text-gray-400 mt-1">Tap "Add Expense" to get started</p>
            <button
              onClick={onAddExpense}
              className="mt-4 inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <Plus size={16} /> Add first expense
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense, i) => {
              const isMyExpense = expense.payer_id === currentMemberId;
              return (
                <button
                  key={expense.id}
                  onClick={() => navigate('/history')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 active:scale-[0.98] transition-all text-left shadow-sm card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.3 + i * 0.07}s` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                    style={{ background: `${expense.payer_color || '#6366f1'}18` }}>
                    {getCategoryEmoji(expense.purpose, expense.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">{expense.purpose}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {isMyExpense ? '👤 You paid' : `${expense.payer_name}`} ·{' '}
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    {expense.notes && (
                      <p className="text-xs text-gray-400 truncate mt-0.5 italic">"{expense.notes}"</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-900 text-sm">{formatRupees(expense.total_amount)}</p>
                    {isMyExpense ? (
                      <p className="text-xs text-indigo-500 font-medium">You paid</p>
                    ) : (
                      <p className="text-xs text-gray-400">
                        Your share: {formatRupees(Math.round(expense.total_amount / Math.max(members.length, 1)))}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── This month's category breakdown ── */}
      {expenses.length > 0 && (
        <SpendingBreakdown expenses={thisMonthExpenses(expenses)} visible={visible} />
      )}
    </div>
  );
}

// ── Spending breakdown by category ────────────────────────────────────────
function SpendingBreakdown({ expenses, visible }) {
  const navigate = useNavigate();

  const categoryTotals = expenses.reduce((acc, e) => {
    const cat = e.category || 'other';
    acc[cat] = (acc[cat] || 0) + e.total_amount;
    return acc;
  }, {});

  const sorted = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const total = sorted.reduce((s, [, v]) => s + v, 0);

  if (sorted.length === 0) return null;

  const CAT_COLORS = {
    groceries: '#10b981', electricity: '#f59e0b', water: '#3b82f6',
    wifi: '#6366f1', rent: '#8b5cf6', gas: '#ef4444', cleaning: '#06b6d4',
    food: '#f97316', transport: '#64748b', medicine: '#ec4899',
    entertainment: '#a855f7', household: '#14b8a6', other: '#94a3b8',
  };

  return (
    <div className={`${visible ? 'animate-fade-in-up delay-400' : 'opacity-0'}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
          <TrendingUp size={15} className="text-indigo-500" />
          This Month's Spending
        </p>
        <button onClick={() => navigate('/history')} className="text-xs text-indigo-500 font-semibold hover:text-indigo-700">
          Details →
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm space-y-3">
        {/* Stacked bar */}
        <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
          {sorted.map(([cat, val]) => (
            <div
              key={cat}
              className="h-full rounded-full transition-all"
              style={{
                width: `${(val / total) * 100}%`,
                background: CAT_COLORS[cat] || '#94a3b8',
              }}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {sorted.map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: CAT_COLORS[cat] || '#94a3b8' }}
              />
              <span className="text-xs text-gray-600 flex-1 capitalize">{cat}</span>
              <span className="text-xs font-semibold text-gray-900">{formatRupees(val)}</span>
              <span className="text-xs text-gray-400 w-8 text-right">
                {Math.round((val / total) * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Map expense purpose/category to an emoji */
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
  if (p.includes('wifi') || p.includes('internet') || p.includes('broad')) return '📶';
  if (p.includes('rent'))    return '🏠';
  if (p.includes('gas'))     return '🔥';
  if (p.includes('clean') || p.includes('maid')) return '🧹';
  if (p.includes('pizza') || p.includes('zomato') || p.includes('swiggy')) return '🍕';
  if (p.includes('petrol') || p.includes('fuel') || p.includes('cab') || p.includes('uber')) return '🚗';
  if (p.includes('movie') || p.includes('netflix') || p.includes('prime')) return '🎬';
  if (p.includes('medic') || p.includes('pharma')) return '💊';
  return '💰';
}
