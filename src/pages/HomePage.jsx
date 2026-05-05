import { useEffect, useState, useCallback } from 'react';
import { Home, Users, History, Plus, LogOut, Share2, Check, Bell, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { DashboardSkeleton } from '../components/Dashboard';
import AddExpense from '../components/AddExpense';
import NotificationBell from '../components/NotificationBell';
import PendingBillsModal from '../components/PendingBillsModal';
import ThemeToggle from '../components/ThemeToggle';
import OnboardingTour from '../components/OnboardingTour';
import { useExpenses } from '../hooks/useExpenses';
import { useMembers } from '../hooks/useMembers';
import { useSocket } from '../hooks/useSocket';
import { authApi, expensesApi } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPending, setShowPending]       = useState(false);
  const [pendingBills, setPendingBills]     = useState([]);
  const [currentMember, setCurrentMember]  = useState(null);
  const [currentRoom, setCurrentRoom]      = useState(null);
  const [copied, setCopied]                = useState(false);
  const [mounted, setMounted]              = useState(false);
  const [showTour, setShowTour]            = useState(false);

  const { expenses, balances, fetchExpenses, fetchBalances, addExpense, markSplitPaid, removeExpense, onExpenseAdded, onExpenseUpdated, onSplitPaid, onBalanceUpdated } = useExpenses();
  const { members, fetchMembers } = useMembers();

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    const room   = JSON.parse(localStorage.getItem('roomie_room')   || 'null');
    if (!member || !room) { navigate('/join'); return; }
    setCurrentMember(member);
    setCurrentRoom(room);
    setMounted(true);
    Promise.all([fetchMembers(), fetchExpenses(), fetchBalances()]).then(loadPendingBills);
    // Show onboarding tour on first visit
    if (!localStorage.getItem('roomie_tour_done')) {
      setTimeout(() => setShowTour(true), 800);
    }
    // Listen for service worker messages (notification click → open pending)
    const handleSwMessage = (event) => {
      if (event.data?.type === 'OPEN_PENDING') {
        loadPendingBills().then(() => setShowPending(true));
      }
    };
    navigator.serviceWorker?.addEventListener('message', handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', handleSwMessage);
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

  const { emit, connected } = useSocket(currentRoom?.id, {
    onExpenseAdded:   (data) => { onExpenseAdded(data); fetchBalances(); loadPendingBills(); },
    onExpenseUpdated: (data) => { onExpenseUpdated(data); },
    onSplitPaid:      (data) => { onSplitPaid(data); fetchBalances(); },
    onBalanceUpdated,
    onExpenseDeleted: (data) => { removeExpense(data.expenseId); fetchBalances(); },
  });

  const handleAddExpense = async (data) => { await addExpense(data); fetchBalances(); loadPendingBills(); };
  const handleMarkPaid   = async (splitId) => {
    await markSplitPaid(splitId);
    fetchBalances();
    setPendingBills((prev) => prev.filter((b) => b.split.id !== splitId));
  };
  const handleLogout = async () => {
    await authApi.logout().catch(() => {});
    localStorage.clear();
    navigate('/join');
  };
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
    <div className={`min-h-screen ${mounted ? 'page-enter' : 'opacity-0'}`} style={{ background: '#F7F7F5' }}>

      {/* ── Reconnecting banner ── */}
      {mounted && !connected && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-semibold"
          style={{ background: '#F7C948', color: '#996B00' }}>
          <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
          Reconnecting…
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Room info */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #1A6B4A, #27AE78)' }}>
              <Home size={18} className="text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading font-semibold text-sm leading-tight truncate" style={{ color: '#1C1C1E' }}>
                {currentRoom?.name || 'Roomie Split'}
              </h1>
              <button onClick={handleShareCode}
                className="flex items-center gap-1 text-xs transition-colors mt-0.5"
                style={{ color: '#27AE78' }}>
                {copied
                  ? <><Check size={10} /> Copied!</>
                  : <><Share2 size={10} /> Code: {code}</>}
              </button>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {pendingCount > 0 && (
              <button
                onClick={() => setShowPending(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-heading font-semibold transition-all animate-fade-in"
                style={{ background: '#FFEEE6', color: '#CC4A12', border: '1px solid #FFCDB4' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: '#FF6B35' }} />
                {pendingCount} due
              </button>
            )}
            <ThemeToggle />
            <NotificationBell />
            <button onClick={handleLogout}
              className="p-2 rounded-xl transition-colors"
              style={{ color: '#6B7280' }}
              aria-label="Logout">
              <LogOut size={17} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-[420px] mx-auto px-4 py-5 pb-28">
        {!mounted ? (
          <DashboardSkeleton />
        ) : (
          <Dashboard
            balances={balances} expenses={expenses}
            currentMemberId={currentMember.id} members={members}
            onAddExpense={() => setShowAddExpense(true)}
            pendingCount={pendingCount} onShowPending={() => setShowPending(true)}
          />
        )}
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
      {showTour && (
        <OnboardingTour onDone={() => {
          setShowTour(false);
          localStorage.setItem('roomie_tour_done', '1');
        }} />
      )}
    </div>
  );
}

function BottomNav({ onAddExpense }) {
  const navigate  = useNavigate();
  const location  = useLocation();

  const tabs = [
    { path: '/',          Icon: Home,     label: 'Home' },
    { path: '/members',   Icon: Users,    label: 'Members' },
    { action: onAddExpense, primary: true },
    { path: '/activity',  Icon: Activity, label: 'Activity' },
    { path: '/history',   Icon: History,  label: 'History' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-area-pb" aria-label="Main navigation">
      <div className="glass border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto flex items-center justify-around px-4 py-2">
          {tabs.map((tab, i) => {
            if (tab.primary) {
              return (
                <button
                  key={i}
                  onClick={tab.action}
                  className="relative -mt-7 w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #1A6B4A, #27AE78)',
                    boxShadow: '0 6px 20px rgba(39,174,120,0.40)',
                  }}
                  aria-label="Add expense"
                >
                  <Plus size={26} className="text-white" strokeWidth={2.5} />
                </button>
              );
            }

            const isActive = tab.path && location.pathname === tab.path;
            const { Icon } = tab;

            return (
              <button
                key={i}
                onClick={() => navigate(tab.path)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all active:scale-95"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.75}
                  style={{ color: isActive ? '#27AE78' : '#9CA3AF' }}
                />
                <span className="text-xs font-semibold transition-colors"
                  style={{ color: isActive ? '#27AE78' : '#9CA3AF' }}>
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
