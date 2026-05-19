import { useEffect, useState, useCallback } from 'react';
import { Home, Users, History, Plus, LogOut, Share2, Check, Bell, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Dashboard from '../components/Dashboard';
import { DashboardSkeleton } from '../components/Dashboard';
import AddExpense from '../components/AddExpense';
import NotificationBell from '../components/NotificationBell';
import PendingBillsModal from '../components/PendingBillsModal';
import PendingConfirmations from '../components/PendingConfirmations';
import ThemeToggle from '../components/ThemeToggle';
import OnboardingTour from '../components/OnboardingTour';
import ProfileMenu from '../components/ProfileMenu';
import RoomSwitcher from '../components/RoomSwitcher';
import InviteModal from '../components/InviteModal';
import { useExpenses } from '../hooks/useExpenses';
import { useMembers } from '../hooks/useMembers';
import { useSocket } from '../hooks/useSocket';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import { authApi, expensesApi, membersApi } from '../utils/api';

export default function HomePage() {
  const navigate = useNavigate();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showPending, setShowPending]       = useState(false);
  const [pendingBills, setPendingBills]     = useState([]);
  const [pendingConfirmations, setPendingConfirmations] = useState([]);
  const [showConfirmations, setShowConfirmations] = useState(false);
  const [currentMember, setCurrentMember]  = useState(null);
  const [currentRoom, setCurrentRoom]      = useState(null);
  const [copied, setCopied]                = useState(false);
  const [mounted, setMounted]              = useState(false);
  const [showTour, setShowTour]            = useState(false);
  const [showInvite, setShowInvite]        = useState(false);
  const [offlineToast, setOfflineToast]    = useState(false);

  const { expenses, balances, netPairs, fetchExpenses, fetchBalances, addExpense, markSplitPaid, removeExpense, onExpenseAdded, onExpenseUpdated, onSplitPaid, onBalanceUpdated } = useExpenses();
  const { members, fetchMembers } = useMembers();

  const { isOnline, queueCount, syncing, addExpenseWithFallback } = useOfflineQueue({
    onSynced: ({ succeeded }) => {
      // Refresh data after syncing queued expenses
      fetchExpenses();
      fetchBalances();
    },
  });

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    const room   = JSON.parse(localStorage.getItem('roomie_room')   || 'null');
    if (!member || !room) { navigate('/join'); return; }
    setCurrentMember(member);
    setCurrentRoom(room);
    setMounted(true);
    Promise.all([fetchMembers(), fetchExpenses(), fetchBalances()]).then(() => {
      loadPendingBills();
      loadPendingConfirmations();
    });
    
    // Show onboarding tour only if not completed in database
    // tour_completed can be 0/1 (SQLite) or true/false (MongoDB) — coerce to boolean
    const tourDone = member.tour_completed === true || member.tour_completed === 1 || localStorage.getItem('roomie_tour_done') === '1';
    if (!tourDone) {
      setTimeout(() => setShowTour(true), 800);
    }
    
    // Listen for service worker messages (notification click → open pending)
    const handleSwMessage = (event) => {
      if (event.data?.type === 'OPEN_PENDING') {
        loadPendingBills().then(() => setShowPending(true));
      }
      // SW tells us to replay the offline queue
      if (event.data?.type === 'SYNC_QUEUE') {
        fetchExpenses();
        fetchBalances();
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
        split:   { id: s.id, share: s.share, carry_forward: s.carry_forward, paid: s.paid, member_id: s.member_id, expense_id: s.expense_id, payment_status: s.payment_status },
        payer:   { id: s.payer_id, name: s.payer_name, upi_id: s.payer_upi_id, qr_code_base64: s.payer_qr, color: s.payer_color, avatar_initials: s.payer_initials },
      }));
      setPendingBills(bills);
      if (bills.length > 0) setShowPending(true);
    } catch (err) { console.error('Failed to load pending bills:', err); }
  }, []);

  const loadPendingConfirmations = useCallback(async () => {
    try {
      const res = await expensesApi.myPending();
      const rawSplits = res.data.splits;
      if (!rawSplits?.length) return;
      
      // Filter splits where current user is the payer and payment_status is 'pending_verification'
      const confirmations = rawSplits
        .filter((s) => s.payer_id === currentMember?.id && s.payment_status === 'pending_verification')
        .map((s) => ({
          expense: { id: s.expense_id, purpose: s.purpose, date: s.date, total_amount: s.total_amount },
          split:   { id: s.id, share: s.share, carry_forward: s.carry_forward, payment_status: s.payment_status, member_id: s.member_id },
          debtor:  { id: s.member_id, name: s.member_name, color: s.member_color, avatar_initials: s.member_initials },
        }));
      
      setPendingConfirmations(confirmations);
    } catch (err) { console.error('Failed to load pending confirmations:', err); }
  }, [currentMember]);

  const { emit, connected } = useSocket(currentRoom?.id, {
    onExpenseAdded:   (data) => { onExpenseAdded(data); fetchBalances(); loadPendingBills(); loadPendingConfirmations(); },
    onExpenseUpdated: (data) => { onExpenseUpdated(data); },
    onSplitPaid:      (data) => { onSplitPaid(data); fetchBalances(); loadPendingBills(); loadPendingConfirmations(); },
    onBalanceUpdated,
    onExpenseDeleted: (data) => { removeExpense(data.expenseId); fetchBalances(); },
    onPaymentPendingVerification: (data) => { 
      loadPendingBills(); 
      loadPendingConfirmations();
      // Show notification badge for payer
      if (data.payerId === currentMember?.id) {
        setShowConfirmations(true);
      }
    },
    onPaymentRejected: (data) => {
      loadPendingBills();
      loadPendingConfirmations();
    },
  });

  const handleAddExpense = async (data) => {
    const result = await addExpenseWithFallback(data);
    if (result?.queued) {
      // Expense queued offline — show a toast-like feedback
      setOfflineToast(true);
      setTimeout(() => setOfflineToast(false), 3500);
      return;
    }
    // Online path — use the normal addExpense to update local state
    await addExpense(data);
    fetchBalances();
    loadPendingBills();
    loadPendingConfirmations();
  };
  const handleMarkPaid   = async (splitId) => {
    const response = await markSplitPaid(splitId);
    
    // If payment is pending verification, don't remove from pending bills yet
    if (response?.data?.status !== 'pending_verification') {
      fetchBalances();
      setPendingBills((prev) => prev.filter((b) => b.split.id !== splitId));
    } else {
      // Reload to show updated status
      loadPendingBills();
      loadPendingConfirmations();
    }
    
    return response;
  };

  const handleConfirmPayment = async (splitId, approve) => {
    try {
      await expensesApi.payerVerify(splitId, approve);
      loadPendingBills();
      loadPendingConfirmations();
      fetchBalances();
      
      // Remove from confirmations list
      setPendingConfirmations((prev) => prev.filter((c) => c.split.id !== splitId));
    } catch (err) {
      console.error('Failed to confirm/reject payment:', err);
      alert(err.response?.data?.error || 'Failed to process confirmation');
    }
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
  const confirmationsCount = pendingConfirmations.length;
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

      {/* ── Offline banner ── */}
      {mounted && !isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-semibold"
          style={{ background: '#1C1C1E', color: '#FFFFFF' }}>
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          You're offline — expenses will sync when you reconnect
          {queueCount > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: '#FF6B35' }}>{queueCount} queued</span>}
        </div>
      )}

      {/* ── Syncing banner ── */}
      {mounted && isOnline && syncing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-2 text-xs font-semibold"
          style={{ background: '#6366F1', color: '#FFFFFF' }}>
          <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          Syncing {queueCount} offline expense{queueCount !== 1 ? 's' : ''}…
        </div>
      )}

      {/* ── Offline toast ── */}
      {offlineToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold animate-fade-in-up"
          style={{ background: '#1C1C1E', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          Saved offline — will sync when connected
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Room info — now a room switcher */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <RoomSwitcher
              currentRoom={currentRoom}
              currentMember={currentMember}
              onRoomSwitch={() => {
                // State will be reset by full page reload in RoomSwitcher
              }}
            />
            <div className="min-w-0 hidden sm:block">
              <button onClick={handleShareCode}
                className="flex items-center gap-1 text-xs transition-colors mt-0.5"
                style={{ color: '#6366F1' }}>
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
            {confirmationsCount > 0 && (
              <button
                onClick={() => setShowConfirmations(true)}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-heading font-semibold transition-all animate-fade-in"
                style={{ background: '#FFF4E6', color: '#D97706', border: '1px solid #FCD34D' }}
              >
                <Bell size={12} strokeWidth={2.5} />
                {confirmationsCount}
              </button>
            )}
            <ThemeToggle />
            <NotificationBell />
            <ProfileMenu member={currentMember} roomCode={code} />
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
            netPairs={netPairs}
            onInvite={() => setShowInvite(true)}
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
        <PendingBillsModal 
          pendingBills={pendingBills} 
          currentMember={currentMember} 
          onMarkPaid={handleMarkPaid} 
          onConfirmPayment={handleConfirmPayment}
          onClose={() => setShowPending(false)}
          netPairs={netPairs}
        />
      )}
      {showConfirmations && (
        <PendingConfirmations
          pendingConfirmations={pendingConfirmations}
          onConfirm={(splitId) => handleConfirmPayment(splitId, true)}
          onReject={(splitId) => handleConfirmPayment(splitId, false)}
          onClose={() => setShowConfirmations(false)}
        />
      )}
      {showTour && (
        <OnboardingTour onDone={async () => {
          setShowTour(false);
          localStorage.setItem('roomie_tour_done', '1');
          // Mark tour as completed in database
          try {
            await membersApi.tourComplete();
            // Update local member data
            const member = JSON.parse(localStorage.getItem('roomie_member') || '{}');
            member.tour_completed = true;
            localStorage.setItem('roomie_member', JSON.stringify(member));
          } catch (err) {
            console.error('Failed to mark tour complete:', err);
          }
        }} />
      )}
      {showInvite && (
        <InviteModal room={currentRoom} onClose={() => setShowInvite(false)} />
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
                    background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                    boxShadow: '0 6px 20px rgba(99,102,241,0.40)',
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
                  style={{ color: isActive ? '#6366F1' : '#9CA3AF' }}
                />
                <span className="text-xs font-semibold transition-colors"
                  style={{ color: isActive ? '#6366F1' : '#9CA3AF' }}>
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
