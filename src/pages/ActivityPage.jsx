import { useEffect, useState } from 'react';
import { ArrowLeft, Activity, Plus, CheckCircle2, Edit3, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { expensesApi } from '../utils/api';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from '../components/MemberAvatar';

const ACTION_CONFIG = {
  expense_added:   { icon: Plus,         color: '#6366F1', bg: '#EEF2FF', label: 'Added expense' },
  payment_made:    { icon: CheckCircle2, color: '#6366F1', bg: '#EEF2FF', label: 'Paid' },
  partial_payment: { icon: CreditCard,   color: '#F7C948', bg: '#FFF8E0', label: 'Partial payment' },
  expense_edited:  { icon: Edit3,        color: '#6366f1', bg: '#EEF2FF', label: 'Edited expense' },
  recurring:       { icon: RefreshCw,    color: '#06b6d4', bg: '#ECFEFF', label: 'Recurring' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ActivityPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    if (!member) { navigate('/join'); return; }
    expensesApi.activity(100).then(res => {
      setActivities(res.data.activities);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F7F7F5' }}>
      <header className="glass border-b sticky top-0 z-40" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} strokeWidth={1.75} style={{ color: '#1C1C1E' }} />
          </button>
          <h1 className="font-heading font-semibold flex-1" style={{ color: '#1C1C1E' }}>Activity</h1>
          <Activity size={18} style={{ color: '#6366F1' }} strokeWidth={1.75} />
        </div>
      </header>

      <main className="max-w-[420px] mx-auto px-4 py-5 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full"
              style={{ borderColor: '#6366F1', borderTopColor: 'transparent' }} />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border"
            style={{ background: '#FFFFFF', borderColor: '#E5E5E3' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#F7F7F5' }}>
              <Activity size={26} style={{ color: '#9CA3AF' }} strokeWidth={1.5} />
            </div>
            <p className="font-heading font-semibold" style={{ color: '#1C1C1E' }}>No activity yet</p>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>Actions will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((act, i) => {
              const cfg = ACTION_CONFIG[act.action] || ACTION_CONFIG.expense_added;
              const Icon = cfg.icon;
              const member = {
                color: act.member_color || '#6366f1',
                avatar_initials: act.member_initials || act.member_name?.slice(0, 2).toUpperCase() || '?',
                name: act.member_name,
              };
              return (
                <div key={act.id}
                  className="flex items-start gap-3 p-4 rounded-2xl animate-fade-in-up"
                  style={{ background: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', animationDelay: `${i * 0.03}s` }}>
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <MemberAvatar member={member} size="md" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
                      style={{ background: cfg.bg }}>
                      <Icon size={10} style={{ color: cfg.color }} strokeWidth={2.5} />
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#1C1C1E' }}>
                      <span style={{ color: cfg.color }}>{act.member_name}</span>
                      {' '}{cfg.label.toLowerCase()}
                    </p>
                    {act.details && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{act.details}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{timeAgo(act.created_at)}</p>
                  </div>
                  {/* Amount */}
                  {act.amount && (
                    <span className="text-sm font-heading font-semibold tabular-nums flex-shrink-0"
                      style={{ color: act.action === 'payment_made' ? '#6366F1' : '#1C1C1E' }}>
                      {act.action === 'payment_made' ? '+' : ''}{formatRupees(act.amount)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
