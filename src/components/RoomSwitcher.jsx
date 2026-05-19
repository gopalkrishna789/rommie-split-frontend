import { useState, useEffect, useRef } from 'react';
import { Home, Plus, ChevronDown, Check, LogIn, X, ArrowRight, Users } from 'lucide-react';
import { authApi } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import MemberAvatar from './MemberAvatar';

/**
 * RoomSwitcher — lets a user switch between rooms they belong to,
 * or join/create a new room without logging out.
 */
export default function RoomSwitcher({ currentRoom, currentMember, onRoomSwitch }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState(currentMember?.name || '');
  const [joinUpi, setJoinUpi] = useState(currentMember?.upiId || '');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const loadRooms = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await authApi.myRooms();
      setRooms(res.data.rooms || []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) loadRooms();
  };

  const handleSwitch = async (room) => {
    if (room.id === currentRoom?.id) { setOpen(false); return; }
    try {
      const res = await authApi.switchRoom(room.id);
      const { token, member, room: newRoom } = res.data;
      localStorage.setItem('roomie_token', token);
      localStorage.setItem('roomie_member', JSON.stringify(member));
      localStorage.setItem('roomie_room', JSON.stringify(newRoom));
      setOpen(false);
      onRoomSwitch?.();
      // Full reload to reset all state
      window.location.href = '/';
    } catch (err) {
      console.error('Failed to switch room:', err);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!joinCode.trim() || joinCode.trim().length !== 8) {
      return setJoinError('Enter a valid 8-character invite code');
    }
    if (!joinName.trim()) return setJoinError('Enter your name for this room');
    if (!joinUpi.trim()) return setJoinError('Enter your UPI ID for this room');

    setJoinLoading(true);
    try {
      const res = await authApi.joinRoom({
        inviteCode: joinCode.trim().toUpperCase(),
        name: joinName.trim(),
        upiId: joinUpi.trim(),
      });
      const { token, member, room } = res.data;
      localStorage.setItem('roomie_token', token);
      localStorage.setItem('roomie_member', JSON.stringify(member));
      localStorage.setItem('roomie_room', JSON.stringify(room));
      setOpen(false);
      setShowJoin(false);
      onRoomSwitch?.();
      window.location.href = '/';
    } catch (err) {
      setJoinError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setJoinLoading(false);
    }
  };

  const roomCode = currentRoom?.invite_code || currentRoom?.inviteCode;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-gray-100 active:scale-95"
        aria-label="Switch room"
        aria-expanded={open}
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
          <Home size={14} className="text-white" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 text-left hidden sm:block">
          <p className="text-xs font-semibold leading-tight truncate max-w-[100px]" style={{ color: '#1C1C1E' }}>
            {currentRoom?.name || 'Room'}
          </p>
          <p className="text-[10px]" style={{ color: '#9CA3AF' }}>{roomCode}</p>
        </div>
        <ChevronDown size={13} style={{ color: '#9CA3AF' }}
          className={`flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-72 rounded-2xl shadow-xl border overflow-hidden z-50 animate-fade-in"
          style={{ background: '#FFFFFF', borderColor: '#E5E5E3', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        >
          {!showJoin ? (
            <>
              {/* Header */}
              <div className="px-4 pt-3.5 pb-2 border-b" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Your Rooms
                </p>
              </div>

              {/* Room list */}
              <div className="max-h-56 overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-6">
                    <span className="animate-spin w-5 h-5 border-2 border-t-transparent rounded-full"
                      style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
                  </div>
                ) : rooms.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: '#9CA3AF' }}>No rooms found</p>
                ) : (
                  rooms.map((room) => {
                    const isActive = room.id === currentRoom?.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() => handleSwitch(room)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background: isActive
                              ? 'linear-gradient(135deg, #667EEA, #764BA2)'
                              : '#F3F4F6',
                          }}>
                          <Home size={14}
                            className={isActive ? 'text-white' : ''}
                            style={{ color: isActive ? undefined : '#9CA3AF' }}
                            strokeWidth={1.75} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: '#1C1C1E' }}>
                            {room.name}
                          </p>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>
                            {room.inviteCode} · {room.memberName}
                          </p>
                        </div>
                        {isActive && <Check size={14} style={{ color: '#6366F1' }} strokeWidth={2.5} />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Actions */}
              <div className="border-t p-2 space-y-1" style={{ borderColor: '#F3F4F6' }}>
                <button
                  onClick={() => setShowJoin(true)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-indigo-50"
                  style={{ color: '#4F46E5' }}
                >
                  <LogIn size={15} strokeWidth={2} />
                  Join another room
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    // Navigate to join page in create mode
                    navigate('/join?tab=create');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-green-50"
                  style={{ color: '#059669' }}
                >
                  <Plus size={15} strokeWidth={2} />
                  Create new room
                </button>
              </div>
            </>
          ) : (
            /* Join room form */
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>Join Another Room</p>
                <button onClick={() => { setShowJoin(false); setJoinError(''); }}
                  className="p-1 rounded-lg hover:bg-gray-100">
                  <X size={16} style={{ color: '#6B7280' }} />
                </button>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="8-character code"
                    maxLength={8}
                    className="w-full border-2 rounded-xl px-3 py-2 text-sm font-mono uppercase focus:outline-none"
                    style={{ borderColor: '#E5E5E3' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
                    Your name in this room
                  </label>
                  <input
                    type="text"
                    value={joinName}
                    onChange={(e) => setJoinName(e.target.value)}
                    placeholder="Display name"
                    className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: '#E5E5E3' }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#6B7280' }}>
                    UPI ID for this room
                  </label>
                  <input
                    type="text"
                    value={joinUpi}
                    onChange={(e) => setJoinUpi(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full border-2 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                    style={{ borderColor: '#E5E5E3' }}
                  />
                </div>

                {joinError && (
                  <p className="text-xs font-medium" style={{ color: '#CC4A12' }}>{joinError}</p>
                )}

                <button
                  type="submit"
                  disabled={joinLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all"
                  style={{ background: '#6366F1' }}
                >
                  {joinLoading
                    ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    : <><ArrowRight size={15} /> Join Room</>}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
