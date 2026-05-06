import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, CreditCard, Pencil, Mail, Check, X, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from '../components/MemberAvatar';
import PaymentCard from '../components/PaymentCard';
import { expensesApi, membersApi } from '../utils/api';
import { useMembers } from '../hooks/useMembers';
import { useExpenses } from '../hooks/useExpenses';

export default function MemberDetailPage() {
  const { id: memberId } = useParams();
  const navigate = useNavigate();
  const [currentMember, setCurrentMember] = useState(null);
  const [unpaidSplits, setUnpaidSplits]   = useState([]);
  const [loading, setLoading]             = useState(true);
  // Edit email state
  const [editingEmail, setEditingEmail]   = useState(false);
  const [emailInput, setEmailInput]       = useState('');
  const [emailSaving, setEmailSaving]     = useState(false);
  const [emailMsg, setEmailMsg]           = useState('');

  const { members, fetchMembers }                  = useMembers();
  const { balances, fetchBalances, markSplitPaid } = useExpenses();

  const viewedMember = members.find((m) => m.id === memberId);
  const balance      = balances.find((b) => b.memberId === memberId);

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    if (!member) { navigate('/join'); return; }
    setCurrentMember(member);
    setEmailInput(member.email || '');
    Promise.all([fetchMembers(), fetchBalances()]).then(() => {
      if (member.id === memberId) fetchUnpaidSplits();
      else setLoading(false);
    });
  }, [memberId]);

  const fetchUnpaidSplits = async () => {
    setLoading(true);
    try {
      const res = await expensesApi.list({ limit: 100 });
      const unpaid = [];
      for (const expense of res.data.expenses) {
        const expRes = await expensesApi.get(expense.id);
        const mySplit = expRes.data.splits.find(
          (s) => s.member_id === memberId && !s.paid && expense.payer_id !== memberId
        );
        if (mySplit) {
          const payer = members.find((m) => m.id === expense.payer_id) || {
            name: expense.payer_name, upi_id: expense.payer_upi_id,
            qr_code_base64: expense.payer_qr, color: expense.payer_color,
            avatar_initials: expense.payer_initials,
          };
          unpaid.push({ expense, split: mySplit, payer });
        }
      }
      setUnpaidSplits(unpaid);
    } catch (err) { console.error('Failed to fetch unpaid splits:', err); }
    finally { setLoading(false); }
  };

  const handleMarkPaid = async (splitId) => {
    await markSplitPaid(splitId);
    setUnpaidSplits((p) => p.filter((s) => s.split.id !== splitId));
    fetchBalances();
  };

  const handleSaveEmail = async () => {
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setEmailMsg('Enter a valid email address');
      return;
    }
    setEmailSaving(true);
    setEmailMsg('');
    try {
      await membersApi.update(memberId, { email: emailInput.trim().toLowerCase() });
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('roomie_member') || '{}');
      localStorage.setItem('roomie_member', JSON.stringify({ ...stored, email: emailInput.trim().toLowerCase() }));
      setEditingEmail(false);
      setEmailMsg('Email updated! You will now receive expense notifications.');
    } catch (err) {
      setEmailMsg(err.response?.data?.error || 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const isOwnProfile = currentMember?.id === memberId;

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F5' }}>
      <header className="glass border-b sticky top-0 z-40" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/members')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: '#1C1C1E' }}>
            <ArrowLeft size={20} strokeWidth={1.75} />
          </button>
          <h1 className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>
            {viewedMember?.name || 'Member'}{isOwnProfile && ' (You)'}
          </h1>
        </div>
      </header>

      <main className="max-w-[420px] mx-auto px-4 py-5 pb-10 space-y-4">

        {/* Member card */}
        {viewedMember && (
          <div className="rounded-2xl p-5"
            style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-4 mb-4">
              <MemberAvatar member={viewedMember} size="xl" />
              <div>
                <p className="font-heading font-bold text-lg" style={{ color: '#1C1C1E' }}>{viewedMember.name}</p>
                <p className="text-sm font-mono flex items-center gap-1.5 mt-0.5" style={{ color: '#6B7280' }}>
                  <CreditCard size={13} strokeWidth={1.75} />
                  {viewedMember.upi_id}
                </p>
              </div>
            </div>

            {/* Email section — only for own profile */}
            {isOwnProfile && (
              <div className="border-t pt-4" style={{ borderColor: '#F3F4F6' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: '#6B7280' }}>
                    <Mail size={12} strokeWidth={2} />
                    Notification Email
                  </p>
                  {!editingEmail && (
                    <button onClick={() => { setEditingEmail(true); setEmailMsg(''); }}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                      style={{ color: '#6366F1', background: '#EEF2FF' }}>
                      <Pencil size={11} strokeWidth={2} />
                      {viewedMember.email ? 'Edit' : 'Add Email'}
                    </button>
                  )}
                </div>

                {!editingEmail ? (
                  viewedMember.email ? (
                    <p className="text-sm font-medium" style={{ color: '#1C1C1E' }}>{viewedMember.email}</p>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl p-3"
                      style={{ background: '#FFF8E0', border: '1px solid #F7C948' }}>
                      <AlertCircle size={14} style={{ color: '#996B00' }} className="flex-shrink-0 mt-0.5" />
                      <p className="text-xs" style={{ color: '#996B00' }}>
                        No email set — you won't receive expense notifications. Tap "Add Email" to fix this.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@gmail.com"
                        autoFocus
                        className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none input-focus"
                        style={{ borderColor: '#E5E5E3' }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEmail()}
                      />
                      <button onClick={handleSaveEmail} disabled={emailSaving}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                        style={{ background: '#6366F1' }}>
                        {emailSaving
                          ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          : <><Check size={14} /> Save</>}
                      </button>
                      <button onClick={() => { setEditingEmail(false); setEmailMsg(''); setEmailInput(viewedMember.email || ''); }}
                        className="p-2 rounded-xl border transition-colors"
                        style={{ borderColor: '#E5E5E3', color: '#6B7280' }}>
                        <X size={16} strokeWidth={1.75} />
                      </button>
                    </div>
                    {emailMsg && (
                      <p className="text-xs font-medium" style={{ color: emailMsg.includes('updated') ? '#6366F1' : '#CC4A12' }}>
                        {emailMsg}
                      </p>
                    )}
                  </div>
                )}

                {emailMsg && !editingEmail && (
                  <p className="text-xs font-medium mt-2" style={{ color: '#6366F1' }}>{emailMsg}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Balance cards */}
        {balance && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: '#FFEEE6', border: '1px solid #FFCDB4' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown size={14} style={{ color: '#FF6B35' }} strokeWidth={2} />
                <span className="text-xs font-semibold" style={{ color: '#CC4A12' }}>Owes</span>
              </div>
              <p className="font-heading font-bold text-lg tabular-nums" style={{ color: '#CC4A12' }}>
                {formatRupees(balance.totalOwed)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#FF6B35' }}>to others</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={14} style={{ color: '#6366F1' }} strokeWidth={2} />
                <span className="text-xs font-semibold" style={{ color: '#4F46E5' }}>Owed</span>
              </div>
              <p className="font-heading font-bold text-lg tabular-nums" style={{ color: '#4F46E5' }}>
                {formatRupees(balance.totalOwedTo)}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#6366F1' }}>by others</p>
            </div>
          </div>
        )}

        {/* Pending payments */}
        {isOwnProfile && (
          <div>
            <h2 className="font-heading font-semibold mb-3" style={{ color: '#1C1C1E' }}>
              Pending Payments{unpaidSplits.length > 0 && ` (${unpaidSplits.length})`}
            </h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <span className="animate-spin w-6 h-6 border-2 border-t-transparent rounded-full"
                  style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
              </div>
            ) : unpaidSplits.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border"
                style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#EEF2FF' }}>
                  <TrendingUp size={22} style={{ color: '#6366F1' }} strokeWidth={1.75} />
                </div>
                <p className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>All settled up!</p>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>No pending payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidSplits.map(({ expense, split, payer }) => (
                  <PaymentCard key={split.id} expense={expense} payer={payer}
                    debtor={viewedMember} currentShare={split.share}
                    carryForward={split.carry_forward} splitId={split.id}
                    onMarkPaid={handleMarkPaid} isPaid={split.paid} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
