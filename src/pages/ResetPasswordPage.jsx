import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Home } from 'lucide-react';
import { authApi } from '../utils/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);
  const [mounted, setMounted]             = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(160deg, #F0FFF8 0%, #F7F7F5 50%, #F0F4FF 100%)' }}
    >
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
      </div>

      <div className={`w-full max-w-sm relative z-10 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 rounded-3xl bg-indigo-400 blur-xl opacity-25 scale-110" />
            <div
              className="relative w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}
            >
              <Home size={36} className="text-white" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-3xl font-heading font-bold" style={{ color: '#1C1C1E' }}>Roomie Split</h1>
          <p className="text-sm mt-1.5 font-medium" style={{ color: '#6B7280' }}>
            Set a new password
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl shadow-2xl shadow-indigo-100/50 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <div className="p-6">

            {/* Success state */}
            {success ? (
              <div className="text-center space-y-5 py-2">
                <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-lg">Password updated!</p>
                  <p className="text-sm text-gray-500 mt-1">You can now sign in with your new password.</p>
                </div>
                <button
                  onClick={() => navigate('/join')}
                  className="w-full flex items-center justify-center gap-2 text-white rounded-2xl py-3.5 font-semibold text-sm transition-all"
                  style={{ background: '#6366F1', boxShadow: '0 4px 14px rgba(99,102,241,0.30)' }}
                >
                  Go to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-gray-500 text-center">
                  Choose a strong password for your account.
                </p>

                {/* Invalid token error shown before form */}
                {!token && (
                  <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    Invalid reset link. Please request a new one.
                  </div>
                )}

                {token && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min. 6 characters"
                          autoFocus
                          className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
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

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className={`w-full border-2 bg-gray-50 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:bg-white transition-all ${
                            confirmPassword && confirmPassword !== password
                              ? 'border-red-300 focus:border-red-400'
                              : confirmPassword && confirmPassword === password
                              ? 'border-indigo-300 focus:border-indigo-400'
                              : 'border-gray-100 focus:border-indigo-400'
                          }`}
                        />
                        {confirmPassword && confirmPassword === password && (
                          <CheckCircle2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 text-white rounded-xl py-3.5 font-semibold text-sm transition-all active:scale-[0.98]"
                      style={{ background: '#6366F1', boxShadow: '0 4px 14px rgba(99,102,241,0.30)' }}
                    >
                      {loading
                        ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full inline-block" />
                        : <><Lock size={16} /> Set New Password</>
                      }
                    </button>
                  </>
                )}

                <p className="text-xs text-center text-gray-400">
                  <button
                    type="button"
                    onClick={() => navigate('/join')}
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    ← Back to Sign In
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Secure &nbsp;&bull;&nbsp; Roomie Split
        </p>
      </div>
    </div>
  );
}
