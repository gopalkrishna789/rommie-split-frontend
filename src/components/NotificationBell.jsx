import { useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

export default function NotificationBell() {
  const { permission, subscribed, subscribe } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = async () => {
    if (permission === 'granted' && subscribed) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    if (permission === 'denied') {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }
    setLoading(true);
    await subscribe();
    setLoading(false);
  };

  const icon =
    permission === 'denied' ? (
      <BellOff size={20} className="text-gray-400" />
    ) : subscribed || permission === 'granted' ? (
      <BellRing size={20} className="text-indigo-600" />
    ) : (
      <Bell size={20} className="text-gray-500" />
    );

  const tooltip =
    permission === 'denied'
      ? 'Notifications blocked — enable in browser settings'
      : subscribed
      ? 'Notifications enabled ✓'
      : 'Enable notifications';

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={loading}
        className="p-2 rounded-xl hover:bg-gray-100 transition-colors relative"
        aria-label={tooltip}
        title={tooltip}
      >
        {loading ? (
          <span className="animate-spin inline-block w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full" />
        ) : (
          icon
        )}
        {/* Dot indicator when not subscribed */}
        {permission === 'default' && !subscribed && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full" />
        )}
      </button>

      {showTooltip && (
        <div className="absolute right-0 top-full mt-1 bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap z-50 shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  );
}
