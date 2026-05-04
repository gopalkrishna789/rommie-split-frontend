import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Search, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpenseHistory from '../components/ExpenseHistory';
import { useExpenses } from '../hooks/useExpenses';
import { useMembers } from '../hooks/useMembers';
import { formatRupees } from '../utils/upiLink';

// ── CSV export ────────────────────────────────────────────────────────────
function exportToCSV(expenses, members) {
  const header = ['Date', 'Purpose', 'Category', 'Total (₹)', 'Paid By', 'Per Share (₹)', 'Notes'];
  const rows = expenses.map((e) => {
    const payer = members.find((m) => m.id === e.payer_id);
    const perShare = (e.total_amount / 100 / Math.max(members.length, 1)).toFixed(2);
    return [
      e.date,
      `"${e.purpose}"`,
      e.category || 'other',
      (e.total_amount / 100).toFixed(2),
      payer?.name || e.payer_name || '',
      perShare,
      `"${e.notes || ''}"`,
    ].join(',');
  });

  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `roomie-split-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [currentMember, setCurrentMember] = useState(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const { expenses, pagination, loading, fetchExpenses, markSplitPaid, removeExpense } = useExpenses();
  const { members, fetchMembers } = useMembers();

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    if (!member) { navigate('/join'); return; }
    setCurrentMember(member);
    fetchMembers();
    fetchExpenses(1);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchExpenses(nextPage);
  };

  const handleMarkPaid = async (splitId) => {
    await markSplitPaid(splitId);
  };

  const handleDeleteExpense = (expenseId) => {
    removeExpense(expenseId);
  };

  // Search filter
  const filteredExpenses = expenses.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.purpose?.toLowerCase().includes(q) ||
      e.payer_name?.toLowerCase().includes(q) ||
      e.category?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q)
    );
  });

  // Total of filtered expenses
  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.total_amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses…"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                onClick={() => { setShowSearch(false); setSearch(''); }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-bold text-gray-900 flex-1">Expense History</h1>
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
              <button
                onClick={() => exportToCSV(expenses, members)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Export CSV"
                title="Export to CSV"
              >
                <Download size={18} />
              </button>
            </>
          )}
        </div>

        {/* Filter tabs */}
        {!showSearch && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2">
            {[
              { id: 'all',     label: 'All' },
              { id: 'pending', label: '⏳ Pending' },
              { id: 'paid',    label: '✅ Paid' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  filter === f.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            {expenses.length > 0 && (
              <span className="ml-auto text-xs text-gray-400 self-center">
                {formatRupees(filteredTotal)} total
              </span>
            )}
          </div>
        )}
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-10">
        {/* Search results summary */}
        {search && (
          <p className="text-xs text-gray-500 mb-3">
            {filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''} for "{search}"
          </p>
        )}

        {loading && expenses.length === 0 ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <ExpenseHistory
            expenses={search ? filteredExpenses : expenses}
            pagination={search ? null : pagination}
            onLoadMore={handleLoadMore}
            loading={loading}
            currentMemberId={currentMember?.id}
            members={members}
            onMarkPaid={handleMarkPaid}
            onDeleteExpense={handleDeleteExpense}
            filter={filter}
          />
        )}
      </main>
    </div>
  );
}
