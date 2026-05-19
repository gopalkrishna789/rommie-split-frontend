import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, LogOut, ChevronDown } from 'lucide-react';
import MemberAvatar from './MemberAvatar';

export default function ProfileMenu({ member, roomCode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('roomie_token');
    localStorage.removeItem('roomie_member');
    localStorage.removeItem('roomie_room');
    navigate('/join');
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    navigate(`/members/${member.id}`);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-gray-100 transition-colors"
        aria-label="Profile menu"
      >
        <MemberAvatar member={member} size="sm" />
        <ChevronDown 
          size={14} 
          style={{ color: '#9CA3AF' }}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-64 rounded-2xl shadow-xl border animate-scale-in"
          style={{ 
            background: '#FFFFFF',
            borderColor: '#E5E7EB',
            zIndex: 50,
          }}
        >
          {/* Profile Info */}
          <div className="p-4 border-b" style={{ borderColor: '#F3F4F6' }}>
            <div className="flex items-center gap-3 mb-3">
              <MemberAvatar member={member} size="lg" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: '#1C1C1E' }}>
                  {member.name}
                </div>
                <div className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                  {member.email || member.upi_id}
                </div>
              </div>
            </div>
            
            {/* Room Code */}
            <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: '#F7F7F5' }}>
              <span className="text-xs" style={{ color: '#6B7280' }}>Room Code</span>
              <span className="text-xs font-mono font-bold" style={{ color: '#6366F1' }}>
                {roomCode}
              </span>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={handleEditProfile}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-left"
            >
              <Edit size={16} style={{ color: '#6366F1' }} strokeWidth={1.75} />
              <span className="text-sm font-medium" style={{ color: '#1C1C1E' }}>
                Edit Profile
              </span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={16} style={{ color: '#EF4444' }} strokeWidth={1.75} />
              <span className="text-sm font-medium" style={{ color: '#EF4444' }}>
                Logout
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
