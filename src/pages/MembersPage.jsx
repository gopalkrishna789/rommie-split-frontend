import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Check, Users, Share2, Lock, Unlock, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MemberBalance from '../components/MemberBalance';
import { useMembers } from '../hooks/useMembers';
import { useExpenses } from '../hooks/useExpenses';
import { expensesApi, membersApi } from '../utils/api';

export default function MembersPage() {
  const navigate = useNavigate();
  const [currentMember, setCurrentMember] = useState(null);
  const [currentRoom, setCurrentRoom]     = useState(null);
  const [codeCopied, setCodeCopied]       = useState(false);
  const [isLocked, setIsLocked]           = useState(false);
  const [lockLoading, setLockLoading]     = useState(false);
  const [removingId, setRemovingId]       = useState(null);

  const { members, loading, fetchMembers } = useMembers();
  const { balances, fetchBalances }        = useExpenses();

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    const room   = JSON.parse(localStorage.getItem('roomie_room')   || 'null');
    if (!member) { navigate('/join'); return; }
    setCurrentMember(member);
    setCurrentRoom(room);
    fetchMembers();
    fetchBalances();
    setIsLocked(!!(room?.is_locked));
  }, []);

  const inviteCode = currentRoom?.invite_code || currentRoom?.inviteCode || '';

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(inviteCode).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleToggleLock = async () => {
    setLockLoading(true);
    try {
      await expensesApi.lockRoom(!isLocked);
      setIsLocked(v => !v);
      // Update localStorage room
      const room = JSON.parse(localStorage.getItem('roomie_room') || '{}');
      localStorage.setItem('roomie_room', JSON.stringify({ ...room, is_locked: !isLocked }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update room lock');
    } finally { setLockLoading(false); }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the room? They must have no unpaid splits.`)) return;
    setRemovingId(memberId);
    try {
      await membersApi.remove(memberId);
      fetchMembers();
      fetchBalances();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove member');
    } finally { setRemovingId(null); }
  };

  const handleShare = async () => {
    const text = `Join my room on Roomie Split!\n\n1. Open the app\n2. Go to "Join Room"\n3. Enter code: ${inviteCode}`;
    if (navigator.share) {
      await navigator.share({ title: 'Roomie Split Invite', text }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(text).catch(() => {});
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F5' }}>
      <header className="glass border-b sticky top-0 z-40" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            style={{ color: '#1C1C1E' }} aria-label="Go back">
            <ArrowLeft size={20} strokeWidth={1.75} />
          </button>
          <h1 className="font-heading font-semibold flex-1" style={{ color: '#1C1C1E' }}>Members</h1>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: '#D4F5E7', color: '#1A6B4A' }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </header>

      <main className="max-w-[420px] mx-auto px-4 py-5 pb-10 space-y-4">

        {/* Invite card */}
        {inviteCode && (
          <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#D4F5E7' }}>
                <Users size={14} style={{ color: '#27AE78' }} strokeWidth={1.75} />
              </div>
              <p className="font-heading font-semibold text-sm" style={{ color: '#1C1C1E' }}>Invite Roommates</p>
            </div>
            <p className="text-xs mb-3" style={{ color: '#6B7280' }}>
              Share this code — roommates go to "Join Room", enter the code, and create their own account.
            </p>
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: '#F7FFF9', border: '1px solid #A8E6C8' }}>
              <div className="flex-1">
                <p className="text-xs mb-0.5" style={{ color: '#6B7280' }}>Room Code</p>
                <p className="text-xl font-heading font-bold font-mono tracking-[0.2em]" style={{ color: '#1A6B4A' }}>
                  {inviteCode}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleCopyCode}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors border"
                  style={{ background: '#FFFFFF', borderColor: '#A8E6C8', color: '#27AE78' }}>
                  {codeCopied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors"
                  style={{ background: '#27AE78' }}>
                  <Share2 size={13} /> Share
                </button>
              </div>
            </div>

            {/* Room lock toggle */}
            <div className="mt-3 flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: isLocked ? '#FFEEE6' : '#F7F7F5', border: `1px solid ${isLocked ? '#FFCDB4' : '#E5E5E3'}` }}>
              <div className="flex items-center gap-2">
                {isLocked
                  ? <Lock size={14} style={{ color: '#CC4A12' }} strokeWidth={2} />
                  : <Unlock size={14} style={{ color: '#6B7280' }} strokeWidth={2} />}
                <div>
                  <p className="text-xs font-semibold" style={{ color: isLocked ? '#CC4A12' : '#1C1C1E' }}>
                    {isLocked ? 'Room is locked' : 'Room is open'}
                  </p>
                  <p className="text-xs" style={{ color: '#9CA3AF' }}>
                    {isLocked ? 'No new members can join' : 'Anyone with the code can join'}
                  </p>
                </div>
              </div>
              <button onClick={handleToggleLock} disabled={lockLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                style={isLocked
                  ? { background: '#D4F5E7', color: '#1A6B4A' }
                  : { background: '#FFEEE6', color: '#CC4A12' }}>
                {lockLoading ? '…' : isLocked ? 'Unlock' : 'Lock'}
              </button>
            </div>
          </div>
        )}

        {/* Members list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
              style={{ borderColor: '#27AE78', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const balance = balances.find((b) => b.memberId === member.id);
              const isMe = member.id === currentMember?.id;
              return (
                <div key={member.id} className="relative">
                  <MemberBalance
                    member={member}
                    balance={balance}
                    isCurrentUser={isMe}
                    onClick={() => navigate(`/member/${member.id}`)}
                  />
                  {!isMe && (
                    <button
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      disabled={removingId === member.id}
                      className="absolute top-3 right-10 p-1.5 rounded-lg transition-colors disabled:opacity-40"
                      style={{ color: '#9CA3AF' }}
                      title={`Remove ${member.name}`}
                      aria-label={`Remove ${member.name}`}>
                      {removingId === member.id
                        ? <span className="animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full inline-block" />
                        : <UserMinus size={13} strokeWidth={1.75} />}
                    </button>
                  )}
                </div>
              );
            })}

            {members.length === 0 && (
              <div className="text-center py-16 rounded-2xl border"
                style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#F7F7F5' }}>
                  <Users size={28} style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
                </div>
                <p className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>No members yet</p>
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Share the invite code above to get started</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
