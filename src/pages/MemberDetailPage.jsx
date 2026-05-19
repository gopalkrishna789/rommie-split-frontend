import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp, CreditCard, Pencil, Mail, Check, X, AlertCircle, Lock, Key } from 'lucide-react';
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
  
  // Edit password state
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving]   = useState(false);
  const [passwordMsg, setPasswordMsg]         = useState('');

  const { members, fetchMembers }                  = useMembers();
  const { balances, fetchBalances, markSplitPaid, netPairs } = useExpenses();

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

  const handleSavePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg('');
    try {
      const token = localStorage.getItem('roomie_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/members/update-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPassword || undefined, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setPasswordMsg(data.message);
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg(err.message || 'Failed to update password');
    } finally {
      setPasswordSaving(false);
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

            {/* Email + Password sections — only for own profile */}
            {isOwnProfile && (
              <>
                {/* Email section */}
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

                {/* Password section */}
                <div className="border-t pt-4" style={{ borderColor: '#F3F4F6' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                      <Lock size={12} strokeWidth={2} />
                      Password
                    </p>
                    {!editingPassword && (
                      <button
                        onClick={() => { setEditingPassword(true); setPasswordMsg(''); }}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
                        style={{ color: '#6366F1', background: '#EEF2FF' }}>
                        <Key size={11} strokeWidth={2} />
                        Set Password
                      </button>
                    )}
                  </div>

                  {!editingPassword ? (
                    <p className="text-sm" style={{ color: '#6B7280' }}>Set a password to sign in with email</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
                          Current Password (if set)
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Leave blank if no password"
                          className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none input-focus"
                          style={{ borderColor: '#E5E5E3' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
                          New Password
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none input-focus"
                          style={{ borderColor: '#E5E5E3' }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none input-focus"
                          style={{ borderColor: '#E5E5E3' }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSavePassword()}
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSavePassword}
                          disabled={passwordSaving}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                          style={{ background: '#6366F1' }}>
                          {passwordSaving ? (
                            <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <>
                              <Check size={14} /> Save Password
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPassword(false);
                            setPasswordMsg('');
                            setCurrentPassword('');
                            setNewPassword('');
                            setConfirmPassword('');
                          }}
                          className="p-2 rounded-xl border transition-colors"
                          style={{ borderColor: '#E5E5E3', color: '#6B7280' }}>
                          <X size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                      {passwordMsg && (
                        <p className="text-xs font-medium" style={{ color: passwordMsg.includes('success') ? '#10B981' : '#EF4444' }}>
                          {passwordMsg}
                        </p>
                      )}
                    </div>
                  )}

                  {passwordMsg && !editingPassword && (
                    <p className="text-xs font-medium mt-2" style={{ color: '#10B981' }}>{passwordMsg}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Balance cards */}
        {balance && (
          <div className="space-y-3">
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
            {/* Net balance summary */}
            {balance.netBalance !== 0 && (
              <div className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: balance.netBalance > 0 ? '#EEF2FF' : '#FFEEE6',
                  border: `1px solid ${balance.netBalance > 0 ? '#C7D2FE' : '#FFCDB4'}`,
                }}>
                {balance.netBalance > 0
                  ? <TrendingUp size={16} style={{ color: '#4F46E5' }} strokeWidth={2} />
                  : <TrendingDown size={16} style={{ color: '#CC4A12' }} strokeWidth={2} />}
                <div className="flex-1">
                  <p className="text-xs font-semibold"
                    style={{ color: balance.netBalance > 0 ? '#3730A3' : '#9A3412' }}>
                    Net balance (after mutual offset)
                  </p>
                  <p className="text-xs mt-0.5"
                    style={{ color: balance.netBalance > 0 ? '#4F46E5' : '#CC4A12' }}>
                    {balance.netBalance > 0
                      ? `Others owe ${isOwnProfile ? 'you' : viewedMember?.name}`
                      : `${isOwnProfile ? 'You owe' : `${viewedMember?.name} owes`} others`}{' '}
                    <span className="font-bold">{formatRupees(Math.abs(balance.netBalance))}</span> net
                  </p>
                </div>
              </div>
            )}
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
                {(() => {
                  // Build net offset map for current member vs each payer
                  const netByPayer = {};
                  if (netPairs.length > 0) {
                    netPairs
                      .filter((p) => p.fromId === memberId || p.toId === memberId)
                      .forEach((pair) => {
                        const iOwe = pair.fromId === memberId;
                        const otherId = iOwe ? pair.toId : pair.fromId;
                        netByPayer[otherId] = { netAmount: pair.amount, iOwe };
                      });
                  }

                  // Group splits by payer
                  const groups = {};
                  unpaidSplits.forEach((item) => {
                    const pid = item.payer.id;
                    if (!groups[pid]) groups[pid] = { payer: item.payer, items: [] };
                    groups[pid].items.push(item);
                  });

                  return Object.values(groups).map(({ payer, items }) => {
                    const grossOwed = items.reduce(
                      (sum, { split }) => sum + split.share + (split.carry_forward || 0), 0
                    );
                    const netInfo = netByPayer[payer.id];
                    const theyOweUs = netInfo && !netInfo.iOwe;
                    const showNetBanner = netInfo && netInfo.iOwe && netInfo.netAmount < grossOwed;

                    return (
                      <div key={payer.id} className="space-y-2">
                        {(showNetBanner || theyOweUs) && (
                          <div className="flex items-start gap-2.5 rounded-2xl p-3"
                            style={{
                              background: theyOweUs ? '#F0FDF4' : '#EEF2FF',
                              border: `1px solid ${theyOweUs ? '#BBF7D0' : '#C7D2FE'}`,
                            }}>
                            <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
                              {theyOweUs ? '✅' : 'ℹ️'}
                            </span>
                            <div className="flex-1 min-w-0">
                              {theyOweUs ? (
                                <>
                                  <p className="text-xs font-semibold" style={{ color: '#15803D' }}>
                                    Mutual offset — {payer.name} owes you more
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: '#16A34A' }}>
                                    After cancelling mutual debts, {payer.name} owes you{' '}
                                    <span className="font-bold">{formatRupees(netInfo.netAmount)} net</span>.
                                    No payment needed from you.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-xs font-semibold" style={{ color: '#3730A3' }}>
                                    Mutual offset applied
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: '#4F46E5' }}>
                                    Gross: {formatRupees(grossOwed)} — {payer.name} also owes you{' '}
                                    <span className="font-bold">{formatRupees(grossOwed - netInfo.netAmount)}</span>.
                                    Net you owe:{' '}
                                    <span className="font-bold">{formatRupees(netInfo.netAmount)}</span>
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        {!theyOweUs && items.map(({ expense, split, payer: p }) => (
                          <PaymentCard key={split.id} expense={expense} payer={p}
                            debtor={viewedMember} currentShare={split.share}
                            carryForward={split.carry_forward} splitId={split.id}
                            onMarkPaid={handleMarkPaid} isPaid={split.paid} />
                        ))}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
