/**
 * SpendingCharts — pure SVG/CSS charts, zero dependencies
 * Features:
 *  - Donut chart: category breakdown for current month
 *  - Bar chart: last 6 months spending trend
 *  - Per-member spending bar
 */
import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, BarChart2, PieChart, Users2,
  ShoppingCart, Zap, Droplets, Wifi, Home as HomeIcon,
  Flame, Brush, UtensilsCrossed, Car, Pill, Film, Package, DollarSign,
} from 'lucide-react';
import { formatRupees } from '../utils/upiLink';

const CAT_META = {
  groceries:     { label: 'Groceries',     Icon: ShoppingCart,    color: '#6366F1' },
  electricity:   { label: 'Electricity',   Icon: Zap,             color: '#F7C948' },
  water:         { label: 'Water',         Icon: Droplets,        color: '#3b82f6' },
  wifi:          { label: 'WiFi',          Icon: Wifi,            color: '#818cf8' },
  rent:          { label: 'Rent',          Icon: HomeIcon,        color: '#8b5cf6' },
  gas:           { label: 'Gas',           Icon: Flame,           color: '#FF6B35' },
  cleaning:      { label: 'Cleaning',      Icon: Brush,           color: '#06b6d4' },
  food:          { label: 'Food',          Icon: UtensilsCrossed, color: '#f97316' },
  transport:     { label: 'Transport',     Icon: Car,             color: '#64748b' },
  medicine:      { label: 'Medicine',      Icon: Pill,            color: '#ec4899' },
  entertainment: { label: 'Entertainment', Icon: Film,            color: '#a855f7' },
  household:     { label: 'Household',     Icon: Package,         color: '#14b8a6' },
  other:         { label: 'Other',         Icon: DollarSign,      color: '#94a3b8' },
};

// ── Donut chart (SVG) ─────────────────────────────────────────────────────
function DonutChart({ segments, size = 140, strokeWidth = 22 }) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const dash = (seg.pct / 100) * circumference;
    const gap  = circumference - dash;
    const arc  = { ...seg, dash, gap, offset };
    offset += dash;
    return arc;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
      {arcs.map((arc, i) => (
        <circle
          key={i}
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      ))}
    </svg>
  );
}

// ── Bar chart (SVG) ───────────────────────────────────────────────────────
function BarChart({ months }) {
  const max = Math.max(...months.map((m) => m.total), 1);
  const barW = 28;
  const gap  = 12;
  const chartH = 80;
  const totalW = months.length * (barW + gap) - gap;

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${chartH + 28}`} preserveAspectRatio="xMidYMid meet">
      {months.map((m, i) => {
        const barH = Math.max((m.total / max) * chartH, 4);
        const x    = i * (barW + gap);
        const y    = chartH - barH;
        const isCurrentMonth = i === months.length - 1;
        return (
          <g key={i}>
            {/* Bar */}
            <rect
              x={x} y={y} width={barW} height={barH}
              rx={6}
              fill={isCurrentMonth ? '#6366F1' : '#E0E7FF'}
              style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
            />
            {/* Amount label on top */}
            {m.total > 0 && (
              <text
                x={x + barW / 2} y={y - 4}
                textAnchor="middle"
                fontSize="7"
                fill={isCurrentMonth ? '#4F46E5' : '#9CA3AF'}
                fontWeight="600"
              >
                {m.total >= 100000 ? `${(m.total / 100000).toFixed(1)}L` : `${Math.round(m.total / 100)}k`}
              </text>
            )}
            {/* Month label */}
            <text
              x={x + barW / 2} y={chartH + 16}
              textAnchor="middle"
              fontSize="8"
              fill={isCurrentMonth ? '#4F46E5' : '#9CA3AF'}
              fontWeight={isCurrentMonth ? '700' : '500'}
            >
              {m.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function SpendingCharts({ expenses, members, currentMemberId }) {
  const [tab, setTab] = useState('category'); // 'category' | 'trend' | 'members'

  // ── Category breakdown (this month) ──────────────────────────────────
  const categoryData = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totals = {};
    for (const e of thisMonth) {
      const cat = e.category || 'other';
      totals[cat] = (totals[cat] || 0) + e.total_amount;
    }
    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => ({
        cat,
        val,
        pct: total > 0 ? (val / total) * 100 : 0,
        color: CAT_META[cat]?.color || '#94a3b8',
        label: CAT_META[cat]?.label || cat,
        Icon: CAT_META[cat]?.Icon || DollarSign,
      }));
  }, [expenses]);

  const categoryTotal = categoryData.reduce((s, d) => s + d.val, 0);

  // ── 6-month trend ─────────────────────────────────────────────────────
  const trendData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('en-IN', { month: 'short' });
      const total = expenses
        .filter((e) => {
          const ed = new Date(e.date);
          return ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear();
        })
        .reduce((s, e) => s + e.total_amount, 0);
      months.push({ label, total, month: d.getMonth(), year: d.getFullYear() });
    }
    return months;
  }, [expenses]);

  const prevMonthTotal = trendData[trendData.length - 2]?.total || 0;
  const currMonthTotal = trendData[trendData.length - 1]?.total || 0;
  const trendPct = prevMonthTotal > 0
    ? Math.round(((currMonthTotal - prevMonthTotal) / prevMonthTotal) * 100)
    : 0;

  // ── Per-member spending ───────────────────────────────────────────────
  const memberData = useMemo(() => {
    const now = new Date();
    const thisMonth = expenses.filter((e) => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const totals = {};
    for (const e of thisMonth) {
      totals[e.payer_id] = (totals[e.payer_id] || 0) + e.total_amount;
    }
    const max = Math.max(...Object.values(totals), 1);
    return members
      .map((m) => ({
        ...m,
        paid: totals[m.id] || 0,
        pct: ((totals[m.id] || 0) / max) * 100,
        isMe: m.id === currentMemberId,
      }))
      .sort((a, b) => b.paid - a.paid);
  }, [expenses, members, currentMemberId]);

  const TABS = [
    { id: 'category', label: 'Categories', Icon: PieChart },
    { id: 'trend',    label: 'Trend',      Icon: BarChart2 },
    { id: 'members',  label: 'Members',    Icon: Users2 },
  ];

  if (expenses.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <p className="font-heading font-semibold text-sm flex items-center gap-1.5" style={{ color: '#1C1C1E' }}>
          <TrendingUp size={14} style={{ color: '#6366F1' }} />
          Spending Insights
        </p>
        {tab === 'trend' && trendPct !== 0 && (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
            style={trendPct > 0
              ? { background: '#FFEEE6', color: '#CC4A12' }
              : { background: '#F0FDF4', color: '#15803D' }}
          >
            {trendPct > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trendPct)}% vs last month
          </span>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 pb-3">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={tab === id
              ? { background: '#6366F1', color: '#FFFFFF' }
              : { background: '#F3F4F6', color: '#6B7280' }}
          >
            <Icon size={11} strokeWidth={2} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Category tab ── */}
      {tab === 'category' && (
        <div className="px-4 pb-4">
          {categoryData.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>No expenses this month</p>
          ) : (
            <div className="flex gap-4 items-center">
              {/* Donut */}
              <div className="relative flex-shrink-0">
                <DonutChart segments={categoryData} size={120} strokeWidth={20} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-xs font-semibold" style={{ color: '#6B7280' }}>Total</p>
                  <p className="text-sm font-heading font-bold tabular-nums" style={{ color: '#1C1C1E' }}>
                    {formatRupees(categoryTotal)}
                  </p>
                </div>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2 min-w-0">
                {categoryData.slice(0, 5).map(({ cat, val, pct, color, label, Icon }) => (
                  <div key={cat} className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}20` }}>
                      <Icon size={11} style={{ color }} strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs truncate" style={{ color: '#6B7280' }}>{label}</span>
                        <span className="text-xs font-semibold tabular-nums ml-1 flex-shrink-0" style={{ color: '#1C1C1E' }}>
                          {formatRupees(val)}
                        </span>
                      </div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] w-7 text-right flex-shrink-0" style={{ color: '#9CA3AF' }}>
                      {Math.round(pct)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Trend tab ── */}
      {tab === 'trend' && (
        <div className="px-4 pb-4">
          <div className="flex justify-between text-xs mb-3">
            <span style={{ color: '#6B7280' }}>Last 6 months</span>
            <span className="font-semibold tabular-nums" style={{ color: '#1C1C1E' }}>
              {formatRupees(currMonthTotal)} this month
            </span>
          </div>
          <BarChart months={trendData} />
        </div>
      )}

      {/* ── Members tab ── */}
      {tab === 'members' && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs" style={{ color: '#6B7280' }}>Who paid the most this month</p>
          {memberData.filter((m) => m.paid > 0).length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: '#9CA3AF' }}>No expenses this month</p>
          ) : (
            memberData.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: m.color || '#6366F1' }}
                >
                  {m.avatar_initials || m.name?.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold truncate" style={{ color: '#1C1C1E' }}>
                      {m.isMe ? 'You' : m.name}
                    </span>
                    <span className="text-xs font-semibold tabular-nums ml-1 flex-shrink-0" style={{ color: '#1C1C1E' }}>
                      {formatRupees(m.paid)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.pct}%`,
                        background: m.isMe ? '#6366F1' : (m.color || '#94a3b8'),
                        transition: 'width 0.6s ease',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
