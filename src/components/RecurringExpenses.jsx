import { useEffect, useState } from 'react';
import { RefreshCw, Pause, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { expensesApi } from '../utils/api';
import { formatRupees } from '../utils/upiLink';
import { CategoryIcon } from './Dashboard';

/**
 * Shows all recurring expenses for the room with options to view/delete them.
 * Rendered on the History page as a collapsible section.
 */
export default function RecurringExpenses({ expenses, members, currentMemberId, onDeleteExpense }) {
  const recurring = expenses.filter((e) => e.is_recurring);
  const [expanded, setExpanded] = useState(false);

  if (recurring.length === 0) return null;

  return (
    <div className="rounded-2xl overflow-hidden mb-4"
      style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #E5E5E3' }}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#ECFEFF' }}>
          <RefreshCw size={16} style={{ color: '#06b6d4' }} strokeWidth={1.75} />
        </div>
        <div className="flex-1">
          <p className="font-heading font-semibold text-sm" style={{ color: '#1C1C1E' }}>
            Recurring Expenses
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            {recurring.length} auto-renewing expense{recurring.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ChevronRight size={15} style={{ color: '#9CA3AF' }}
          className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: '#F3F4F6', background: '#F7F7F5' }}>
          {recurring.map((expense) => {
            const payer = members.find((m) => m.id === expense.payer_id);
            const isMyExpense = expense.payer_id === currentMemberId;
            return (
              <div key={expense.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
                <CategoryIcon category={expense.category} purpose={expense.purpose} size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>{expense.purpose}</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#6B7280' }}>
                    <Calendar size={10} strokeWidth={2} />
                    Day {expense.recurring_day || 1} of each month
                    {payer && ` · paid by ${isMyExpense ? 'you' : payer.name}`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-heading font-semibold tabular-nums" style={{ color: '#1C1C1E' }}>
                    {formatRupees(expense.total_amount)}
                  </p>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: '#ECFEFF', color: '#0891b2' }}>
                    Monthly
                  </span>
                </div>
              </div>
            );
          })}
          <p className="text-xs text-center pt-1" style={{ color: '#9CA3AF' }}>
            Recurring expenses auto-create on their scheduled day each month.
            To stop one, delete it from the history list above.
          </p>
        </div>
      )}
    </div>
  );
}
