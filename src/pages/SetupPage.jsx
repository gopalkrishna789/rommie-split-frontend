import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import MemberSetup from '../components/MemberSetup';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SetupPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSave = async (profileData) => {
    const inviteCode = localStorage.getItem('pending_invite_code');
    if (!inviteCode) {
      navigate('/join');
      return;
    }

    // QR is mandatory — enforced in MemberSetup component
    const res = await fetch(`${API}/api/members/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ inviteCode, ...profileData }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create profile');
    }

    const { member, token, room } = await res.json();
    localStorage.setItem('roomie_token', token);
    localStorage.setItem('roomie_member', JSON.stringify(member));
    localStorage.setItem('roomie_room', JSON.stringify(room));
    localStorage.removeItem('pending_invite_code');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Home size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Set up your profile so roommates can pay you
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6">
          {/* QR mandatory notice */}
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            📸 <strong>QR code is required</strong> — your roommates will scan it to pay you directly.
          </div>
          <MemberSetup onSave={handleSave} qrRequired />
        </div>
      </div>
    </div>
  );
}
