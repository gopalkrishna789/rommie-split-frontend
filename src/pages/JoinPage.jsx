import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, KeyRound, Plus, Copy, Check, ArrowRight, Users, Sparkles } from 'lucide-react';
import { authApi } from '../utils/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/* ── Floating emoji illustration ── */
function FloatingEmoji({ emoji, className }) {
  return (
    <span
      className={`absolute text-2xl select-none pointer-events-none animate-float ${className}`}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}

/* ── Animated background blobs ── */
function BgBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float" />
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-float delay-300" style={{animationDelay:'1s'}} />
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{animationDelay:'2s'}} />
    </div>
  );
}

export default function JoinPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('join');
  const [mounted, setMounted] = useState(false);

  // Join state
  const [inviteCode, setInviteCode] = useState('');
  // Create state
  const [roomName, setRoomName] = useState('');
  const [rentAmount, setRentAmount] = useState('4500');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  // Sign-in state
  const [signinCode, setSigninCode] = useState('');
  const [signinMembers, setSigninMembers] = useState([]);
  const [signinRoom, setSigninRoom] = useState(null);
  const [signinStep, setSigninStep] = useState('code');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  const switchMode = (m) => {
    setMode(m); setError(''); setSigninStep('code');
    setCreatedRoom(null); setInviteCode(''); setSigninCode('');
  };

  /* ── Create room ── */
  const handleCreateRoom = async (e) => {
    e.preventDefault(); setError('');
    if (!roomName.trim()) return setError('Room name is required');
    setLoading(true);
    try {
      const res = await authApi.createRoom({ name: roomName.trim(), rentAmount: Math.round(parseFloat(rentAmount || 0) * 100) });
      setCreatedRoom(res.data.room);
    } catch (err) { setError(err.response?.data?.error || 'Failed to create room'); }
    finally { setLoading(false); }
  };

  /* ── Join ── */
  const handleJoin = async (e) => {
    e.preventDefault(); setError('');
    const code = inviteCode.trim().toUpperCase();
    if (code.length !== 8) return setError('Enter a valid 8-character invite code');
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/rooms/by-code/${code}`);
      if (!r.ok) throw new Error();
      localStorage.setItem('pending_invite_code', code);
      navigate('/setup');
    } catch { setError('Invalid invite code. Check with your roommate.'); }
    finally { setLoading(false); }
  };

  /* ── Sign-in lookup ── */
  const handleSigninLookup = async (e) => {
    e.preventDefault(); setError('');
    const code = signinCode.trim().toUpperCase();
    if (code.length !== 8) return setError('Enter a valid 8-character invite code');
    setLoading(true);
    try {
      const r1 = await fetch(`${API}/api/rooms/by-code/${code}`);
      if (!r1.ok) throw new Error();
      const { room } = await r1.json();
      const r2 = await fetch(`${API}/api/rooms/${room.id}`);
      const { members } = await r2.json();
      if (!members?.length) return setError('No members in this room. Join as new member.');
      setSigninRoom(room); setSigninMembers(members); setSigninStep('pick');
    } catch { setError('Invalid invite code or room not found.'); }
    finally { setLoading(false); }
  };

  /* ── Sign-in pick ── */
  const handleSigninPick = async (member) => {
    setLoading(true); setError('');
    try {
      const res = await authApi.join({ inviteCode: signinCode.trim().toUpperCase(), memberId: member.id });
      const { token, member: m, room } = res.data;
      localStorage.setItem('roomie_token', token);
      localStorage.setItem('roomie_member', JSON.stringify(m));
      localStorage.setItem('roomie_room', JSON.stringify(room));
      navigate('/');
    } catch (err) { setError(err.response?.data?.error || 'Sign-in failed'); }
    finally { setLoading(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdRoom.invite_code).catch(() => {});
    setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000);
  };

  const tabs = [
    { id: 'join',   label: 'Join',   icon: '🚪' },
    { id: 'signin', label: 'Sign In', icon: '👤' },
    { id: 'create', label: 'Create',  icon: '✨' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f0f0ff 0%, #faf5ff 50%, #fff0f9 100%)' }}>
      <BgBlobs />

      {/* Floating decorative emojis */}
      <FloatingEmoji emoji="🏠" className="top-16 left-8 opacity-60" />
      <FloatingEmoji emoji="💸" className="top-24 right-10 opacity-50" style={{animationDelay:'0.8s'}} />
      <FloatingEmoji emoji="🤝" className="bottom-32 left-6 opacity-50" style={{animationDelay:'1.5s'}} />
      <FloatingEmoji emoji="✨" className="bottom-48 right-8 opacity-40" style={{animationDelay:'0.4s'}} />

      <div className={`w-full max-w-sm relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>

        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-3xl bg-indigo-400 blur-xl opacity-40 scale-110" />
            <div className="relative w-20 h-20 gradient-bg rounded-3xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl animate-float">🏠</span>
            </div>
          </div>
          <h1 className="text-3xl font-black gradient-text">Roomie Split</h1>
          <p className="text-gray-500 text-sm mt-1.5 font-medium">
            Split bills. Pay instantly. No drama. 🎉
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {['UPI Pay', 'Real-time', 'Smart Split'].map((f) => (
              <span key={f} className="text-xs bg-white/80 border border-indigo-100 text-indigo-600 px-2.5 py-1 rounded-full font-medium shadow-sm">
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* ── Card ── */}
        <div className="glass rounded-3xl shadow-2xl shadow-indigo-100/50 overflow-hidden">

          {/* Tab switcher */}
          <div className="flex p-2 gap-1 bg-gray-50/80">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchMode(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                  mode === tab.id
                    ? 'bg-white shadow-md text-indigo-700 scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── JOIN ── */}
            {mode === 'join' && (
              <form onSubmit={handleJoin} className="space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">Got an invite code from your roommate?</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    maxLength={8}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl font-mono font-black tracking-[0.3em] input-glow transition-all bg-white/80 uppercase"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    8-character code from your roommate
                  </p>
                </div>
                {error && <ErrorBox msg={error} />}
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <Spinner /> : <><LogIn size={18} /> Continue to Setup <ArrowRight size={16} /></>}
                </button>
              </form>
            )}

            {/* ── SIGN IN ── */}
            {mode === 'signin' && signinStep === 'code' && (
              <form onSubmit={handleSigninLookup} className="space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">Already a member? Sign back in.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={signinCode}
                    onChange={(e) => setSigninCode(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    maxLength={8}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl font-mono font-black tracking-[0.3em] input-glow transition-all bg-white/80 uppercase"
                    autoFocus
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <Spinner /> : <><KeyRound size={18} /> Find My Room</>}
                </button>
              </form>
            )}

            {mode === 'signin' && signinStep === 'pick' && (
              <div className="space-y-3 animate-scale-in">
                <div className="text-center mb-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Users size={20} className="text-indigo-600" />
                  </div>
                  <p className="font-bold text-gray-900">{signinRoom?.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Who are you?</p>
                </div>
                {error && <ErrorBox msg={error} />}
                <div className="space-y-2">
                  {signinMembers.map((member, i) => (
                    <button
                      key={member.id}
                      onClick={() => handleSigninPick(member)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3.5 bg-white border-2 border-gray-100 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-2xl transition-all text-left disabled:opacity-60 card-hover animate-fade-in-up"
                      style={{ animationDelay: `${i * 0.08}s` }}
                    >
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md"
                        style={{ background: `linear-gradient(135deg, ${member.color || '#6366f1'}, ${member.color || '#6366f1'}cc)` }}
                      >
                        {member.avatar_initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{member.name}</p>
                        <p className="text-xs text-gray-400 font-mono truncate">{member.upi_id}</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-300 flex-shrink-0" />
                    </button>
                  ))}
                </div>
                <button onClick={() => setSigninStep('code')} className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  ← Back
                </button>
              </div>
            )}

            {/* ── CREATE ── */}
            {mode === 'create' && !createdRoom && (
              <form onSubmit={handleCreateRoom} className="space-y-4 animate-fade-in">
                <div className="text-center mb-2">
                  <p className="text-sm text-gray-600">Create a room and invite your roommates.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Flat 4B, Koramangala"
                    maxLength={100}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm input-glow transition-all bg-white/80"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                    Monthly Rent (₹)
                  </label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    placeholder="4500"
                    min="0"
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-sm input-glow transition-all bg-white/80"
                  />
                </div>
                {error && <ErrorBox msg={error} />}
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <Spinner /> : <><Sparkles size={18} /> Create Room</>}
                </button>
              </form>
            )}

            {/* ── ROOM CREATED ── */}
            {mode === 'create' && createdRoom && (
              <div className="space-y-4 animate-bounce-in">
                {/* Success illustration */}
                <div className="text-center py-2">
                  <div className="text-5xl mb-2 animate-bounce-in">🎉</div>
                  <p className="font-bold text-gray-900 text-lg">Room Created!</p>
                  <p className="text-sm text-gray-500">{createdRoom.name}</p>
                </div>

                {/* Invite code card */}
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-center overflow-hidden">
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full" />
                  <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">
                    Invite Code
                  </p>
                  <p className="text-4xl font-black text-white tracking-[0.25em] font-mono mb-3">
                    {createdRoom.invite_code}
                  </p>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-2 mx-auto bg-white/20 hover:bg-white/30 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-all"
                  >
                    {codeCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Share this code with your roommates so they can join
                </p>

                <button
                  onClick={() => { localStorage.setItem('pending_invite_code', createdRoom.invite_code); navigate('/setup'); }}
                  className="btn-primary"
                >
                  Set Up My Profile <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Secure · Real-time · UPI Payments
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 animate-fade-in" role="alert">
      <span className="text-red-500 text-sm">⚠️</span>
      <p className="text-sm text-red-600 font-medium">{msg}</p>
    </div>
  );
}

function Spinner() {
  return <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />;
}
