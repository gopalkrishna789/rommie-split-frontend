import { useEffect, useState } from 'react';
import {
  Plus, Clock, ArrowRight, TrendingUp, TrendingDown,
  CheckCircle2, AlertCircle, Receipt, ChevronRight,
  ShoppingCart, Zap, Droplets, Wifi, Home as HomeIcon,
  Flame, Brush, UtensilsCrossed, Car, Pill, Film, Package, DollarSign,
} from 'lucide-react';
import { formatRupees } from '../utils/upiLink';
import { calcGroupTotal, thisMonthExpenses } from '../utils/splitCalc';
import MemberAvatar from './MemberAvatar';
import SpendingCharts from './SpendingCharts';
import { useNavigate } from 'react-router-dom';

// ── Dashboard skeleton ────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 max-w-[420px] mx-auto animate-pulse">
      {/* Hero card skeleton */}
      <div className="rounded-2xl p-5 h-40 skeleton" />
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl h-12 skeleton" />
        <div className="rounded-xl h-12 skeleton" />
      </div>
      {/* Members strip */}
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full skeleton" />
            <div className="w-10 h-3 rounded skeleton" />
          </div>
        ))}
      </div>
      {/* Expense rows */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-2xl p-4 flex items-center gap-3 skeleton h-16" />
      ))}
    </div>
  );
}

// ── Category icon map ─────────────────────────────────────────────────────
const CAT = {
  groceries:     { Icon: ShoppingCart,    color: '#6366F1' },
  electricity:   { Icon: Zap,             color: '#F7C948' },
  water:         { Icon: Droplets,        color: '#3b82f6' },
  wifi:          { Icon: Wifi,            color: '#6366f1' },
  rent:          { Icon: HomeIcon,        color: '#8b5cf6' },
  gas:           { Icon: Flame,           color: '#FF6B35' },
  cleaning:      { Icon: Brush,           color: '#06b6d4' },
  food:          { Icon: UtensilsCrossed, color: '#f97316' },
  transport:     { Icon: Car,             color: '#64748b' },
  medicine:      { Icon: Pill,            color: '#ec4899' },
  entertainment: { Icon: Film,            color: '#a855f7' },
  household:     { Icon: Package,         color: '#14b8a6' },
  other:         { Icon: DollarSign,      color: '#94a3b8' },
};

export function CategoryIcon({ category = 'other', purpose = '', size = 18 }) {
  let key = category;
  if (!key || key === 'other') {
    const p = purpose.toLowerCase();
    if (p.includes('grocer') || p.includes('vegeta')) key = 'groceries';
    else if (p.includes('electric') || p.includes('bill')) key = 'electricity';
    else if (p.includes('water'))   key = 'water';
    else if (p.includes('wifi') || p.includes('internet')) key = 'wifi';
    else if (p.includes('rent'))    key = 'rent';
    else if (p.includes('gas'))     key = 'gas';
    else if (p.includes('clean') || p.includes('maid')) key = 'cleaning';
    else if (p.includes('food') || p.includes('pizza') || p.includes('zomato')) key = 'food';
    else if (p.includes('petrol') || p.includes('cab') || p.includes('uber')) key = 'transport';
    else if (p.includes('medic') || p.includes('pharma')) key = 'medicine';
    else if (p.includes('movie') || p.includes('netflix')) key = 'entertainment';
  }
  const { Icon, color } = CAT[key] || CAT.other;
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18` }}
    >
      <Icon size={size} style={{ color }} strokeWidth={1.75} />
    </div>
  );
}

export default function Dashboard({
  balances, expenses, currentMemberId, members,
  onAddExpense, pendingCount = 0, onShowPending, netPairs = [],
  onInvite,
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [search, setSearch]   = useState('');
  const [showSearch, setShowSearch] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  const myBalance    = balances.find((b) => b.memberId === currentMemberId);
  const monthlyTotal = calcGroupTotal(thisMonthExpenses(expenses));
  const youOwe       = myBalance?.totalOwed   || 0;
  const youreOwed    = myBalance?.totalOwedTo || 0;
  const netBalance   = youreOwed - youOwe;

  return (
    <div className="space-y-5 max-w-[420px] mx-auto">

      {/* ── Pending banner ── */}      {pendingCount > 0 && (
        <button
          onClick={onShowPending}
          className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98] animate-fade-in-down"
          style={{ background: '#FFEEE6', border: '1px solid #FFCDB4' }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FF6B3520' }}>
            <AlertCircle size={18} style={{ color: '#FF6B35' }} strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm" style={{ color: '#CC4A12' }}>
              {pendingCount} pending payment{pendingCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#FF6B35' }}>Tap to settle up now</p>
          </div>
          <ChevronRight size={16} style={{ color: '#FF6B35' }} />
        </button>
      )}

      {/* ── Hero balance card ── */}
      <div
        className={`relative overflow-hidden rounded-2xl p-5 text-white ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}
        style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', boxShadow: '0 8px 32px rgba(99,102,241,0.28)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full" />

        <div className="relative">
          <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">
            Your Balance
          </p>
          <p className="text-4xl font-heading font-bold mb-1 tabular-nums animate-count-up">
            {netBalance >= 0 ? '+' : ''}{formatRupees(Math.abs(netBalance))}
          </p>
          <div className="flex items-center gap-1.5 text-indigo-100 text-sm mb-5">
            {netBalance > 0
              ? <><TrendingUp size={14} strokeWidth={2} /> Others owe you</>
              : netBalance < 0
              ? <><TrendingDown size={14} strokeWidth={2} /> You owe others</>
              : <><CheckCircle2 size={14} strokeWidth={2} /> All settled up!</>}
          </div>

          {/* Stats row */}
          <div className="flex gap-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-indigo-200 text-xs">You owe</p>
              <p className="text-white font-heading font-semibold text-sm tabular-nums">{formatRupees(youOwe)}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-indigo-200 text-xs">Owed to you</p>
              <p className="text-white font-heading font-semibold text-sm tabular-nums">{formatRupees(youreOwed)}</p>
            </div>
            <div className="w-px bg-white/20" />
            <div>
              <p className="text-indigo-200 text-xs">This month</p>
              <p className="text-white font-heading font-semibold text-sm tabular-nums">{formatRupees(monthlyTotal)}</p>
            </div>
          </div>
        </div>

        {/* Settle up CTA */}
        {(youOwe > 0 || pendingCount > 0) && (
          <button
            onClick={onShowPending}
            className="mt-4 flex items-center gap-2 bg-white rounded-full px-5 py-2 text-sm font-heading font-semibold transition-all active:scale-95 hover:bg-indigo-50"
            style={{ color: '#4F46E5' }}
          >
            <CheckCircle2 size={15} strokeWidth={2} />
            Settle up
          </button>
        )}
      </div>

      {/* ── Net pair breakdown ── */}
      {netPairs.length > 0 && (() => {
        const myPairs = netPairs.filter(p => p.fromId === currentMemberId || p.toId === currentMemberId);
        if (!myPairs.length) return null;
        return (
          <div className={`rounded-2xl overflow-hidden ${visible ? 'animate-fade-in-up delay-50' : 'opacity-0'}`}
            style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                Net Balances
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#EEF2FF', color: '#6366F1' }}>
                After mutual offset
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
              {myPairs.map((pair, i) => {
                const iOwe = pair.fromId === currentMemberId;
                const otherName = iOwe ? pair.toName : pair.fromName;
                const otherColor = iOwe ? pair.toColor : pair.fromColor;
                const otherInitials = iOwe ? pair.toInitials : pair.fromInitials;
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: otherColor || '#6366F1' }}>
                      {otherInitials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>{otherName}</p>
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>
                        {iOwe ? 'You owe (net)' : 'Owes you (net)'}
                      </p>
                    </div>
                    <span className="font-heading font-bold text-sm tabular-nums"
                      style={{ color: iOwe ? '#CC4A12' : '#059669' }}>
                      {iOwe ? '-' : '+'}{formatRupees(pair.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── Quick actions ── */}
      <div className={`grid grid-cols-2 gap-3 ${visible ? 'animate-fade-in-up delay-100' : 'opacity-0'}`}>
        <button
          onClick={onAddExpense}
          className="flex items-center justify-center gap-2 text-white rounded-xl py-3.5 font-heading font-semibold text-sm transition-all active:scale-[0.97]"
          style={{ background: '#6366F1', boxShadow: '0 4px 14px rgba(99,102,241,0.30)' }}
        >
          <Plus size={17} strokeWidth={2.5} />
          Add Expense
        </button>
        <button
          onClick={() => navigate('/history')}
          className="flex items-center justify-center gap-2 rounded-xl py-3.5 font-heading font-semibold text-sm transition-all active:scale-[0.97] border"
          style={{ background: '#FFFFFF', borderColor: '#E5E5E3', color: '#1C1C1E', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
        >
          <Clock size={17} strokeWidth={1.75} />
          History
        </button>
      </div>

      {/* ── Roommates strip ── */}
      {members.length > 0 && (
        <div className={`${visible ? 'animate-fade-in-up delay-200' : 'opacity-0'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-heading font-semibold text-sm" style={{ color: '#1C1C1E' }}>Roommates</p>
            <button
              onClick={() => navigate('/members')}
              className="flex items-center gap-1 text-xs font-semibold transition-colors"
              style={{ color: '#6366F1' }}
            >
              See all <ChevronRight size={13} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
            {members.slice(0, 6).map((member, i) => {
              const bal = balances.find((b) => b.memberId === member.id);
              const net = bal?.netBalance || 0;
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
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                        style={{ background: '#6366F1' }}>
                        <CheckCircle2 size={8} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-semibold max-w-[52px] truncate" style={{ color: '#1C1C1E' }}>
                    {isMe ? 'You' : member.name.split(' ')[0]}
                  </p>
                  {bal && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums"
                      style={
                        net > 0
                          ? { background: '#EEF2FF', color: '#4F46E5' }
                          : net < 0
                          ? { background: '#FFEEE6', color: '#CC4A12' }
                          : { background: '#F3F4F6', color: '#6B7280' }
                      }
                    >
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
          <p className="font-heading font-semibold text-sm" style={{ color: '#1C1C1E' }}>Recent Expenses</p>
          <div className="flex items-center gap-2">
            {showSearch ? (
              <div className="flex items-center gap-1">
                <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="border rounded-xl px-2.5 py-1 text-xs focus:outline-none input-focus w-28"
                  style={{ borderColor: '#E5E5E3' }}
                  onBlur={() => { if (!search) setShowSearch(false); }} />
                {search && (
                  <button onClick={() => { setSearch(''); setShowSearch(false); }}
                    className="text-xs" style={{ color: '#9CA3AF' }}>✕</button>
                )}
              </div>
            ) : (
              <button onClick={() => setShowSearch(true)}
                className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                🔍
              </button>
            )}
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: '#6366F1' }}
            >
              See all <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {(() => {
          const filtered = search.trim()
            ? expenses.filter(e =>
                e.purpose?.toLowerCase().includes(search.toLowerCase()) ||
                e.payer_name?.toLowerCase().includes(search.toLowerCase()) ||
                e.category?.toLowerCase().includes(search.toLowerCase())
              )
            : expenses.slice(0, 5);

          if (expenses.length === 0) return (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed"
            style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#F7F7F5' }}>
              <Receipt size={26} style={{ color: '#6B7280' }} strokeWidth={1.5} />
            </div>
            <p className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>No expenses yet</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Add your first expense to get started</p>
            <button
              onClick={onAddExpense}
              className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors"
              style={{ background: '#EEF2FF', color: '#4F46E5' }}
            >
              <Plus size={15} /> Add first expense
            </button>
          </div>
        ) ; (
          <div className="space-y-2">
            {expenses.slice(0, 5).map((expense, i) => {
              const isMyExpense = expense.payer_id === currentMemberId;
              return (
                <button
                  key={expense.id}
                  onClick={() => navigate('/history')}
                  className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left card-hover animate-fade-in-up"
                  style={{
                    background: '#FFFFFF',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                    animationDelay: `${0.3 + i * 0.07}s`,
                  }}
                >
                  <CategoryIcon category={expense.category} purpose={expense.purpose} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate text-sm" style={{ color: '#1C1C1E' }}>
                      {expense.purpose}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                      {isMyExpense ? 'You paid' : expense.payer_name} ·{' '}
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                    {expense.notes && (
                      <p className="text-xs truncate mt-0.5 italic" style={{ color: '#9CA3AF' }}>
                        "{expense.notes}"
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading font-semibold text-sm tabular-nums" style={{ color: '#1C1C1E' }}>
                      {formatRupees(expense.total_amount)}
                    </p>
                    {isMyExpense ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                        You paid
                      </span>
                    ) : (
                      <p className="text-xs tabular-nums" style={{ color: '#6B7280' }}>
                        Share: {formatRupees(Math.round(expense.total_amount / Math.max(members.length, 1)))}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        );
        })()}
      </div>

      {/* ── Spending insights (charts) ── */}
      {expenses.length > 0 && (
        <div className={`${visible ? 'animate-fade-in-up delay-400' : 'opacity-0'}`}>
          <SpendingCharts
            expenses={expenses}
            members={members}
            currentMemberId={currentMemberId}
          />
        </div>
      )}

      {/* ── Invite banner (shown when room has < 4 members) ── */}
      {members.length < 4 && onInvite && (
        <div className={`${visible ? 'animate-fade-in-up delay-500' : 'opacity-0'}`}>
          <button
            onClick={onInvite}
            className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #EEF2FF, #F5F3FF)', border: '1px solid #C7D2FE' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#6366F120' }}>
              <ArrowRight size={18} style={{ color: '#6366F1' }} strokeWidth={2} />
            </div>
            <div className="flex-1">
              <p className="font-heading font-semibold text-sm" style={{ color: '#4F46E5' }}>
                Invite roommates
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6366F1' }}>
                Share via WhatsApp, email or copy the code
              </p>
            </div>
            <ChevronRight size={16} style={{ color: '#6366F1' }} />
          </button>
        </div>
      )}
    </div>
  );
}



