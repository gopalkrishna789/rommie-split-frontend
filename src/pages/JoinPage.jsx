import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogIn, Copy, Check, ArrowRight, Eye, EyeOff,
  Home, Users, Plus, Zap, Clock, Shield,
} from 'lucide-react';
import { authApi } from '../utils/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function BgBlobs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float delay-300" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-violet-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }} />
    </div>
  );
}

export default function JoinPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [mounted, setMounted] = useState(false);

  // Join state
  const [inviteCode, setInviteCode] = useState('');

  // Create state
  const [roomName, setRoomName] = useState('');
  const [rentAmount, setRentAmount] = useState('4500');
  const [createdRoom, setCreatedRoom] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Sign-in state
  const [signinEmail, setSigninEmail]       = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinCode, setSigninCode]         = useState('');
  const [showPass, setShowPass]             = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => { setMounted(true); }, []);

  const switchMode = (m) => {
    setMode(m); setError('');
    setCreatedRoom(null); setInviteCode('');
    setSigninEmail(''); setSigninPassword(''); setSigninCode('');
  };

  /* ── Create room ── */
  const handleCreateRoom = async (e) => {
    e.preventDefault(); setError('');
    if (!roomName.trim()) return setError('Room name is required');
    setLoading(true);
    try {
      const res = await authApi.createRoom({
        name: roomName.trim(),
        rentAmount: Math.round(parseFloat(rentAmount || 0) * 100),
      });
      setCreatedRoom(res.data.room);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally { setLoading(false); }
  };

  /* ── Join with invite code ── */
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
    } catch {
      setError('Invalid invite code. Check with your roommate.');
    } finally { setLoading(false); }
  };

  /* ── Sign in ── */
  const handleSignin = async (e) => {
    e.preventDefault(); setError('');
    if (!signinEmail.trim()) return setError('Enter your email');
    if (!signinPassword)     return setError('Enter your password');
    setLoading(true);
    try {
      const res = await authApi.login({
        email:      signinEmail.trim().toLowerCase(),
        password:   signinPassword,
        inviteCode: signinCode.trim().toUpperCase() || undefined,
      });
      const { token, member, room } = res.data;
      localStorage.setItem('roomie_token',  token);
      localStorage.setItem('roomie_member', JSON.stringify(member));
      localStorage.setItem('roomie_room',   JSON.stringify(room));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect email or password.');
    } finally { setLoading(false); }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(createdRoom.invite_code).catch(() => {});
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const tabs = [
    { id: 'signin', label: 'Sign In', icon: LogIn },
    { id: 'join',   label: 'Join Room', icon: Users },
    { id: 'create', label: 'Create Room', icon: Plus },
  ];

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #F0FFF8 0%, #F7F7F5 50%, #F0F4FF 100%)' }}
    >
      <BgBlobs />

      <div className={`w-full max-w-sm relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-3xl bg-indigo-400 blur-xl opacity-25 scale-110" />
            <div className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
              <Home size={36} className="text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold" style={{ color: '#1C1C1E' }}>Roomie Split</h1>
          <p className="text-sm mt-1.5 font-medium" style={{ color: '#6B7280' }}>
            Split bills. Pay instantly. No drama.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
            {[
              { icon: Zap,    label: 'UPI Pay' },
              { icon: Clock,  label: 'Real-time' },
              { icon: Shield, label: 'Secure' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold shadow-sm"
                style={{ background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE' }}>
                <Icon size={11} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-2xl shadow-indigo-100/50 overflow-hidden">

          {/* Tabs */}
          <div className="flex p-2 gap-1" style={{ background: '#F7F7F5' }}>
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchMode(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200"
                style={mode === id
                  ? { background: '#FFFFFF', color: '#4F46E5', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }
                  : { color: '#6B7280' }}
              >
                <Icon size={13} />
                {label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── SIGN IN ── */}
            {mode === 'signin' && (
              <form onSubmit={handleSignin} className="space-y-4 animate-fade-in">
                <p className="text-sm text-gray-500 text-center mb-1">
                  Already a member? Sign in with your credentials.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    autoFocus
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm input-glow transition-all bg-white/80"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={signinPassword}
                      onChange={(e) => setSigninPassword(e.target.value)}
                      placeholder="Your password"
                      className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 pr-11 text-sm input-glow transition-all bg-white/80"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                    Room Code{' '}
                    <span className="text-gray-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={signinCode}
                    onChange={(e) => setSigninCode(e.target.value.toUpperCase())}
                    placeholder="Only needed if in multiple rooms"
                    maxLength={8}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-sm font-mono input-glow transition-all bg-white/80 uppercase"
                  />
                </div>

                {error && <ErrorBox msg={error} />}

                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <Spinner /> : <><LogIn size={17} /> Sign In</>}
                </button>

                <p className="text-xs text-center text-gray-400">
                  New here?{' '}
                  <button type="button" onClick={() => switchMode('join')} className="text-indigo-600 font-semibold hover:underline">
                    Join with an invite code
                  </button>
                </p>
              </form>
            )}

            {/* ── JOIN ── */}
            {mode === 'join' && (
              <form onSubmit={handleJoin} className="space-y-4 animate-fade-in">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-sm text-indigo-800">
                  <p className="font-semibold mb-1 flex items-center gap-1.5">
                    <Users size={14} /> How joining works
                  </p>
                  <ol className="text-xs text-indigo-700 space-y-1 list-decimal pl-4">
                    <li>Get the 8-character invite code from your roommate</li>
                    <li>Enter it below and click Continue</li>
                    <li>Create your account with email and password</li>
                    <li>You're in — start splitting!</li>
                  </ol>
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
                  {loading ? <Spinner /> : <>Continue to Register <ArrowRight size={16} /></>}
                </button>

                <p className="text-xs text-center text-gray-400">
                  Already registered?{' '}
                  <button type="button" onClick={() => switchMode('signin')} className="text-indigo-600 font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              </form>
            )}

            {/* ── CREATE ── */}
            {mode === 'create' && !createdRoom && (
              <form onSubmit={handleCreateRoom} className="space-y-4 animate-fade-in">
                <p className="text-sm text-gray-500 text-center mb-1">
                  Create a room and share the invite code with your roommates.
                </p>

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
                  {loading ? <Spinner /> : <><Plus size={17} /> Create Room</>}
                </button>
              </form>
            )}

            {/* ── ROOM CREATED ── */}
            {mode === 'create' && createdRoom && (
              <div className="space-y-4 animate-scale-in">
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Check size={28} className="text-indigo-600" strokeWidth={2.5} />
                  </div>
                  <p className="font-bold text-gray-900 text-lg">Room Created!</p>
                  <p className="text-sm text-gray-500">{createdRoom.name}</p>
                </div>

                {/* Invite code card */}
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-center overflow-hidden">
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
                    {codeCopied
                      ? <><Check size={14} /> Copied!</>
                      : <><Copy size={14} /> Copy Code</>}
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-700">Share this code with your roommates:</p>
                  <p>They go to the app → "Join Room" tab → enter this code → create their own account</p>
                </div>

                <button
                  onClick={() => {
                    localStorage.setItem('pending_invite_code', createdRoom.invite_code);
                    navigate('/setup');
                  }}
                  className="btn-primary"
                >
                  Set Up My Profile <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Secure &nbsp;&bull;&nbsp; Real-time &nbsp;&bull;&nbsp; UPI Payments
        </p>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 animate-fade-in text-sm font-medium"
      style={{ background: '#FFEEE6', color: '#CC4A12', border: '1px solid #FFCDB4' }}
      role="alert">
      <Shield size={14} className="flex-shrink-0" />
      {msg}
    </div>
  );
}

function Spinner() {
  return <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />;
}
