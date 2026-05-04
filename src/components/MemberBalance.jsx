import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';

/**
 * MemberBalance — shows a member's net balance status
 */
export default function MemberBalance({ member, balance, isCurrentUser = false, onClick }) {
  const { netBalance = 0, totalOwed = 0, totalOwedTo = 0 } = balance || {};

  const isPositive = netBalance > 0;
  const isNegative = netBalance < 0;
  const isZero = netBalance === 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left hover:shadow-md active:scale-[0.98] ${
        isCurrentUser
          ? 'border-indigo-200 bg-indigo-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      aria-label={`${member.name} balance: ${formatRupees(Math.abs(netBalance))} ${isPositive ? 'owed to them' : isNegative ? 'they owe' : 'settled'}`}
    >
      <MemberAvatar member={member} size="lg" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="font-semibold text-gray-900 truncate">{member.name}</p>
          {isCurrentUser && (
            <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {member.upi_id || member.upiId}
        </p>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div
          className={`flex items-center gap-1 font-bold text-sm ${
            isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'
          }`}
        >
          {isPositive && <TrendingUp size={14} />}
          {isNegative && <TrendingDown size={14} />}
          {isZero && <Minus size={14} />}
          <span>
            {isZero
              ? 'Settled'
              : `${isPositive ? '+' : '-'}${formatRupees(Math.abs(netBalance))}`}
          </span>
        </div>
        {!isZero && (
          <p className="text-xs text-gray-400">
            {isPositive ? 'others owe' : 'owes others'}
          </p>
        )}
      </div>
    </button>
  );
}
