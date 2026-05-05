import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Home, Mail, Lock, Eye, EyeOff, AlertCircle,
  Camera, ArrowRight, ArrowLeft, CheckCircle2,
  CreditCard, User, Shield,
} from 'lucide-react';
import MemberSetup from '../components/MemberSetup';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STEPS = [
  { id: 'credentials', label: 'Account',  icon: Shield },
  { id: 'profile',     label: 'Profile',  icon: User   },
];

export default function SetupPage() {
  const navigate = useNavigate();
  const [step, setStep]                     = useState('credentials');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]             = useState(false);
  const [error, setError]                   = useState('');

  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  const handleCredentials = (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !email.includes('@')) return setError('Enter a valid email address');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setStep('profile');
  };

  const handleSave = async (profileData) => {
    const inviteCode = localStorage.getItem('pending_invite_code');
    if (!inviteCode) { navigate('/join'); return; }

    // If email/password weren't filled (user skipped step 1), go back
    if (!email.trim() || !password) {
      setStep('credentials');
      return;
    }

    const res = await fetch(`${API}/api/members/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        inviteCode,
        email: email.trim().toLowerCase(),
        password,
        ...profileData,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create profile');
    }

    const { member, token, room } = await res.json();
    localStorage.setItem('roomie_token',  token);
    localStorage.setItem('roomie_member', JSON.stringify({ ...member, email }));
    localStorage.setItem('roomie_room',   JSON.stringify(room));
    localStorage.removeItem('pending_invite_code');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #F0FFF8 0%, #F7F7F5 40%, #F0F4FF 100%)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 max-w-lg mx-auto w-full">
        <button
          onClick={() => step === 'profile' ? setStep('credentials') : navigate('/join')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                s.id === step
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : i < currentStepIdx
                  ? 'bg-green-100 text-green-700'
                  : 'bg-white/70 text-gray-400 border border-gray-200'
              }`}>
                {i < currentStepIdx
                  ? <CheckCircle2 size={11} />
                  : <s.icon size={11} />}
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-5 h-px ${i < currentStepIdx ? 'bg-green-300' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex items-start justify-center px-4 pt-6 pb-10">
        <div className="w-full max-w-sm">

          {/* Header */}
          <div className="text-center mb-7">
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 rounded-2xl bg-indigo-400 blur-xl opacity-25 scale-110" />
              <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #1A6B4A, #27AE78)' }}>
                <Home size={30} className="text-white" strokeWidth={1.5} />
              </div>
            </div>
            <h1 className="text-2xl font-black text-gray-900">
              {step === 'credentials' ? 'Create your account' : 'Complete your profile'}
            </h1>
            <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">
              {step === 'credentials'
                ? 'Set up your login so you can sign in anytime'
                : 'Add your UPI details so roommates can pay you'}
            </p>
          </div>

          {/* ── STEP 1: Credentials ── */}
          {step === 'credentials' && (
            <div className="bg-white rounded-3xl shadow-lg shadow-indigo-100/40 border border-white/80 overflow-hidden animate-fade-in">

              {/* Coloured top strip */}
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <form onSubmit={handleCredentials} className="p-6 space-y-5">

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="setup-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="setup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      autoFocus
                      className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Mail size={10} />
                    Expense alerts will be sent to this email
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="setup-pass">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="setup-pass"
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2" htmlFor="setup-confirm">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="setup-confirm"
                      type={showPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full border-2 bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:bg-white transition-all ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-300 focus:border-red-400'
                          : confirmPassword && confirmPassword === password
                          ? 'border-green-300 focus:border-green-400'
                          : 'border-gray-100 focus:border-indigo-400'
                      }`}
                    />
                    {confirmPassword && confirmPassword === password && (
                      <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3.5 font-heading font-semibold text-sm transition-all active:scale-[0.98]"
                  style={{ background: '#27AE78', boxShadow: '0 4px 14px rgba(39,174,120,0.30)' }}
                >
                  Continue to Profile
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Profile ── */}
          {step === 'profile' && (
            <div className="bg-white rounded-3xl shadow-lg shadow-indigo-100/40 border border-white/80 overflow-hidden animate-fade-in">
              <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <div className="p-6">
                {/* QR notice */}
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                  <Camera size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">QR code required</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Your roommates will scan it to pay you via UPI. Open PhonePe or GPay → Profile → Show QR → screenshot it.
                    </p>
                  </div>
                </div>

                <MemberSetup
                  onSave={handleSave}
                  onCancel={() => setStep('credentials')}
                  qrRequired
                />
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {[
              { icon: Shield,      label: 'Secure' },
              { icon: CreditCard,  label: 'UPI Ready' },
              { icon: CheckCircle2, label: 'Instant' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400">
                <Icon size={12} className="text-indigo-400" />
                {label}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
