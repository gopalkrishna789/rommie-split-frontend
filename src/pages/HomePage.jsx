import { useEffect, useState, useCallback } from 'react';
import { Home, Users, History, Plus, LogOut, Share2, Check } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import AddExpense from '../components/AddExpense';
import NotificationBell from '../components/NotificationBell';
import PendingBillsModal from '../components/PendingBillsModal';
import { useExpenses } from '../hooks/useExpenses';
import { useMembers } from '../hooks/useMembers';
import { useSocket } from '../hooks/useSocket';
import { authApi, expensesApi } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingBills, setPendingBills] = useState([]);
  const [currentMember, setCurrentMember] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { expenses, balances, fetchExpenses, fetchBalances, addExpense, markSplitPaid, removeExpense, onExpenseAdded, onSplitPaid, onBalanceUpdated } = useExpenses();
  const { members, fetchMembers } = useMembers();

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    const room   = JSON.parse(localStorage.getItem('roomie_room')   || 'null');
    if (!member || !room) { navigate('/join'); return; }
    setCurrentMember(member);
    setCurrentRoom(room);
    setMounted(true);
    Promise.all([fetchMembers(), fetchExpenses(), fetchBalances()]).then(loadPendingBills);
  }, []);

  const loadPendingBills = useCallback(async () => {
    try {
      const res = await expensesApi.myPending();
      const rawSplits = res.data.splits;
      if (!rawSplits?.length) return;
      const bills = rawSplits.map((s) => ({
        expense: { id: s.expense_id, purpose: s.purpose, date: s.date, total_amount: s.total_amount, payer_id: s.payer_id, payer_name: s.payer_name, payer_color: s.payer_color, payer_initials: s.payer_initials },
        split:   { id: s.id, share: s.share, carry_forward: s.carry_forward, paid: s.paid, member_id: s.member_id, expense_id: s.expense_id },
        payer:   { id: s.payer_id, name: s.payer_name, upi_id: s.payer_upi_id, qr_code_base64: s.payer_qr, color: s.payer_color, avatar_initials: s.payer_initials },
      }));
      setPendingBills(bills);
      if (bills.length > 0) setShowPending(true);
    } catch (err) { console.error('Failed to load pending bills:', err); }
  }, []);

  useSocket(currentRoom?.id, {
    onExpenseAdded: (data) => { onExpenseAdded(data); fetchBalances(); loadPendingBills(); },
    onSplitPaid:    (data) => { onSplitPaid(data); fetchBalances(); },
    onBalanceUpdated,
    onExpenseDeleted: (data) => { removeExpense(data.expenseId); fetchBalances(); },
  });

  const handleAddExpense = async (data) => { await addExpense(data); fetchBalances(); loadPendingBills(); };
  const handleMarkPaid   = async (splitId) => {
    await markSplitPaid(splitId);
    fetchBalances();
    setPendingBills((prev) => prev.filter((b) => b.split.id !== splitId));
  };
  const handleLogout = async () => { await authApi.logout().catch(() => {}); localStorage.clear(); navigate('/join'); };

  const handleShareCode = async () => {
    const code = currentRoom?.invite_code || currentRoom?.inviteCode;
    if (!code) return;
    const text = `Join my room on Roomie Split! Code: ${code}`;
    if (navigator.share) { await navigator.share({ title: 'Roomie Split', text }).catch(() => {}); }
    else { await navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  if (!currentMember) return null;

  const pendingCount = pendingBills.length;
  const code = currentRoom?.invite_code || currentRoom?.inviteCode;

  return (
    <div className={`min-h-screen bg-[#f8f7ff] ${mounted ? 'page-enter' : 'opacity-0'}`}>

      {/* ── Top header ── */}
      <header className="sticky top-0 z-40 glass border-b border-white/60 shadow-sm shadow-indigo-100/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Room info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-lg">🏠</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-sm leading-tight truncate">
                {currentRoom?.name || 'Roomie Split'}
              </h1>
              <button onClick={handleShareCode} className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors mt-0.5">
                {copied ? <><Check size={10} className="text-green-500" /> Copied!</> : <><Share2 size={10} /> Code: {code}</>}
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {pendingCount > 0 && (
              <button
                onClick={() => setShowPending(true)}
                className="relative flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-md shadow-orange-200 animate-fade-in"
              >
                {/* Pulse ring */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                {pendingCount} due
              </button>
            )}
            <NotificationBell />
            <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600" aria-label="Logout">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-28">
        <Dashboard
          balances={balances} expenses={expenses}
          currentMemberId={currentMember.id} members={members}
          onAddExpense={() => setShowAddExpense(true)}
          pendingCount={pendingCount} onShowPending={() => setShowPending(true)}
        />
      </main>

      {/* ── Bottom nav ── */}
      <BottomNav onAddExpense={() => setShowAddExpense(true)} />

      {/* ── Modals ── */}
      {showAddExpense && (
        <AddExpense members={members} onAdd={handleAddExpense} onClose={() => setShowAddExpense(false)} />
      )}
      {showPending && (
        <PendingBillsModal pendingBills={pendingBills} currentMember={currentMember} onMarkPaid={handleMarkPaid} onClose={() => setShowPending(false)} />
      )}
    </div>
  );
}

function BottomNav({ onAddExpense }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const tabs = [
    { path: '/',        icon: '🏠', label: 'Home' },
    { path: '/members', icon: '👥', label: 'Members' },
    { action: onAddExpense, icon: null, label: 'Add', primary: true },
    { path: '/history', icon: '📋', label: 'History' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-pb" aria-label="Main navigation">
      {/* Frosted glass bar */}
      <div className="glass border-t border-white/60 shadow-lg shadow-indigo-100/20">
        <div className="max-w-lg mx-auto flex items-center justify-around px-4 py-2">
          {tabs.map((tab, i) => {
            const isActive = tab.path && location.pathname === tab.path;

            if (tab.primary) {
              return (
                <button
                  key={i}
                  onClick={tab.action}
                  className="relative -mt-6 w-14 h-14 gradient-bg rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-300/50 transition-all active:scale-95 hover:scale-105"
                  aria-label="Add expense"
                >
                  <Plus size={26} className="text-white" strokeWidth={2.5} />
                  {/* Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-indigo-400 blur-md opacity-40 -z-10 scale-110" />
                </button>
              );
            }

            return (
              <button
                key={i}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className={`text-xl transition-transform ${isActive ? 'scale-110' : 'scale-100 opacity-60'}`}>
                  {tab.icon}
                </span>
                <span className={`text-xs font-semibold transition-colors ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {tab.label}
                </span>
                {isActive && <div className="nav-active-dot" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
