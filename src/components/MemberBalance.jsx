import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';

export default function MemberBalance({ member, balance, isCurrentUser = false, onClick }) {
  const { netBalance = 0 } = balance || {};
  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const isZero     = netBalance === 0;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left card-hover"
      style={{
        background: isCurrentUser ? '#F7FFF9' : '#FFFFFF',
        borderColor: isCurrentUser ? '#A8E6C8' : '#E5E5E3',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      }}
      aria-label={`${member.name} balance`}
    >
      <MemberAvatar member={member} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-heading font-semibold truncate" style={{ color: '#1C1C1E' }}>{member.name}</p>
          {isCurrentUser && (
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: '#D4F5E7', color: '#1A6B4A' }}>
              You
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 font-mono truncate" style={{ color: '#6B7280' }}>
          {member.upi_id || member.upiId}
        </p>
      </div>

      <div className="flex flex-col items-end gap-0.5 mr-1">
        <div className="flex items-center gap-1 font-heading font-semibold text-sm tabular-nums"
          style={{
            color: isPositive ? '#1A6B4A' : isNegative ? '#CC4A12' : '#9CA3AF',
          }}>
          {isPositive && <TrendingUp size={13} strokeWidth={2} />}
          {isNegative && <TrendingDown size={13} strokeWidth={2} />}
          {isZero     && <Minus size={13} strokeWidth={2} />}
          <span>
            {isZero
              ? 'Settled'
              : `${isPositive ? '+' : '-'}${formatRupees(Math.abs(netBalance))}`}
          </span>
        </div>
        {!isZero && (
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={
              isPositive
                ? { background: '#D4F5E7', color: '#1A6B4A' }
                : { background: '#FFEEE6', color: '#CC4A12' }
            }>
            {isPositive ? 'owed to you' : 'you owe'}
          </span>
        )}
      </div>

      <ChevronRight size={16} strokeWidth={1.75} style={{ color: '#D1D5DB', flexShrink: 0 }} />
    </button>
  );
}
