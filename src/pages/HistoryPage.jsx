import { useEffect, useState } from 'react';
import { ArrowLeft, Search, Download, FileText, X, Clock, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExpenseHistory from '../components/ExpenseHistory';
import RecurringExpenses from '../components/RecurringExpenses';
import { useExpenses } from '../hooks/useExpenses';
import { useMembers } from '../hooks/useMembers';
import { formatRupees } from '../utils/upiLink';
import ThemeToggle from '../components/ThemeToggle';

function exportToCSV(expenses, members) {
  const header = ['Date', 'Purpose', 'Category', 'Total (₹)', 'Paid By', 'Per Share (₹)', 'Notes'];
  const rows = expenses.map((e) => {
    const payer = members.find((m) => m.id === e.payer_id);
    const perShare = (e.total_amount / 100 / Math.max(members.length, 1)).toFixed(2);
    return [e.date, `"${e.purpose}"`, e.category || 'other', (e.total_amount / 100).toFixed(2),
      payer?.name || e.payer_name || '', perShare, `"${e.notes || ''}"`].join(',');
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

async function exportToPDF(expenses, members) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const room = JSON.parse(localStorage.getItem('roomie_room') || '{}');
  const roomName = room?.name || 'Roomie Split';
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Header
  doc.setFillColor(27, 107, 74);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(roomName, 14, 12);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Expense Statement', 14, 19);
  doc.text(`Generated: ${today}`, 196, 19, { align: 'right' });

  // Summary
  const total = expenses.reduce((s, e) => s + e.total_amount, 0);
  doc.setTextColor(28, 28, 30);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Expenses: ${(total / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}`, 14, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${expenses.length} transaction${expenses.length !== 1 ? 's' : ''}  ·  ${members.length} member${members.length !== 1 ? 's' : ''}`, 14, 42);

  // Table header
  let y = 50;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(107, 114, 128);
  doc.text('Date', 16, y);
  doc.text('Purpose', 38, y);
  doc.text('Category', 100, y);
  doc.text('Paid By', 130, y);
  doc.text('Amount', 182, y, { align: 'right' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(28, 28, 30);

  for (const e of expenses) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    const payer = members.find((m) => m.id === e.payer_id);
    const payerName = payer?.name || e.payer_name || '—';
    const amount = `₹${(e.total_amount / 100).toLocaleString('en-IN')}`;

    // Alternating row
    if (expenses.indexOf(e) % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(14, y - 4, 182, 7, 'F');
    }

    doc.setFontSize(8);
    doc.text(e.date || '', 16, y);
    doc.text(doc.splitTextToSize(e.purpose || '', 58)[0], 38, y);
    doc.text(e.category || 'other', 100, y);
    doc.text(payerName.slice(0, 16), 130, y);
    doc.setFont('helvetica', 'bold');
    doc.text(amount, 196, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    if (e.notes) {
      y += 5;
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text(`  Note: ${e.notes.slice(0, 80)}`, 38, y);
      doc.setTextColor(28, 28, 30);
      doc.setFontSize(8);
    }
    y += 7;
  }

  // Receipt images appendix
  const withReceipts = expenses.filter(e => e.receipt_base64);
  if (withReceipts.length > 0) {
    doc.addPage();
    let ry = 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(28, 28, 30);
    doc.text('Receipt Photos', 14, ry);
    ry += 10;
    for (const e of withReceipts) {
      if (ry > 240) { doc.addPage(); ry = 20; }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(28, 28, 30);
      doc.text(`${e.purpose} — ${e.date}`, 14, ry);
      ry += 4;
      try {
        // Determine image format from data URL
        const fmt = e.receipt_base64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(e.receipt_base64, fmt, 14, ry, 80, 60);
        ry += 66;
      } catch { ry += 4; }
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.text(`Roomie Split · Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  doc.save(`roomie-split-${new Date().toISOString().split('T')[0]}.pdf`);
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [currentMember, setCurrentMember] = useState(null);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
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

  const handleLoadMore = () => { const n = page + 1; setPage(n); fetchExpenses(n); };

  const filteredExpenses = expenses.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.purpose?.toLowerCase().includes(q) || e.payer_name?.toLowerCase().includes(q)
      || e.category?.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q);
  });

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.total_amount, 0);

  const FILTERS = [
    { id: 'all',     label: 'All',     Icon: null },
    { id: 'pending', label: 'Pending', Icon: Clock },
    { id: 'paid',    label: 'Paid',    Icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F5' }}>
      <header className="glass border-b sticky top-0 z-40" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
            style={{ color: '#1C1C1E' }} aria-label="Go back">
            <ArrowLeft size={20} strokeWidth={1.75} />
          </button>

          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses…"
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none input-focus"
                style={{ borderColor: '#E5E5E3' }} />
              <button onClick={() => { setShowSearch(false); setSearch(''); }}
                className="p-2 rounded-xl hover:bg-gray-100" style={{ color: '#6B7280' }}>
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-heading font-semibold flex-1" style={{ color: '#1C1C1E' }}>History</h1>
              <button onClick={() => setShowSearch(true)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}>
                <Search size={18} strokeWidth={1.75} />
              </button>
              <ThemeToggle />
              <button onClick={() => exportToCSV(expenses, members)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}
                title="Export CSV">
                <Download size={18} strokeWidth={1.75} />
              </button>
              <button onClick={() => exportToPDF(expenses, members)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#6B7280' }}
                title="Export PDF">
                <FileText size={18} strokeWidth={1.75} />
              </button>
            </>
          )}
        </div>

        {!showSearch && (
          <div className="max-w-[420px] mx-auto px-4 pb-3 flex gap-2">
            {FILTERS.map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setFilter(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
                style={filter === id
                  ? { background: '#27AE78', color: '#FFFFFF' }
                  : { background: '#EFEFED', color: '#6B7280' }}>
                {Icon && <Icon size={11} strokeWidth={2} />}
                {label}
              </button>
            ))}
            {expenses.length > 0 && (
              <span className="ml-auto text-xs self-center font-semibold tabular-nums" style={{ color: '#6B7280' }}>
                {formatRupees(filteredTotal)}
              </span>
            )}
          </div>
        )}
      </header>

      <main className="max-w-[420px] mx-auto px-4 py-5 pb-10">
        {search && (
          <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
            {filteredExpenses.length} result{filteredExpenses.length !== 1 ? 's' : ''} for "{search}"
          </p>
        )}

        {!search && <RecurringExpenses expenses={expenses} members={members} currentMemberId={currentMember?.id} />}

        {loading && expenses.length === 0 ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
              style={{ borderColor: '#27AE78', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <ExpenseHistory
            expenses={search ? filteredExpenses : expenses}
            pagination={search ? null : pagination}
            onLoadMore={handleLoadMore} loading={loading}
            currentMemberId={currentMember?.id} members={members}
            onMarkPaid={markSplitPaid}
            onDeleteExpense={removeExpense}
            filter={filter}
          />
        )}
      </main>
    </div>
  );
}
