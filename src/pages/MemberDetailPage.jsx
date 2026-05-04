import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { formatRupees } from '../utils/upiLink';
import MemberAvatar from '../components/MemberAvatar';
import PaymentCard from '../components/PaymentCard';
import { expensesApi } from '../utils/api';
import { useMembers } from '../hooks/useMembers';
import { useExpenses } from '../hooks/useExpenses';

export default function MemberDetailPage() {
  const { id: memberId } = useParams();
  const navigate = useNavigate();
  const [currentMember, setCurrentMember] = useState(null);
  const [unpaidSplits, setUnpaidSplits] = useState([]);
  const [loading, setLoading] = useState(true);

  const { members, fetchMembers } = useMembers();
  const { balances, fetchBalances, markSplitPaid } = useExpenses();

  const viewedMember = members.find((m) => m.id === memberId);
  const balance = balances.find((b) => b.memberId === memberId);

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    if (!member) { navigate('/join'); return; }
    setCurrentMember(member);

    Promise.all([fetchMembers(), fetchBalances()]).then(() => {
      // Fetch unpaid splits for this member (if viewing own profile)
      if (member.id === memberId) {
        fetchUnpaidSplits();
      } else {
        setLoading(false);
      }
    });
  }, [memberId]);

  const fetchUnpaidSplits = async () => {
    setLoading(true);
    try {
      // Get all expenses and find unpaid splits for this member
      const res = await expensesApi.list({ limit: 100 });
      const allExpenses = res.data.expenses;

      const unpaid = [];
      for (const expense of allExpenses) {
        const expRes = await expensesApi.get(expense.id);
        const mySplit = expRes.data.splits.find(
          (s) => s.member_id === memberId && !s.paid && expense.payer_id !== memberId
        );
        if (mySplit) {
          const payer = members.find((m) => m.id === expense.payer_id) || {
            name: expense.payer_name,
            upi_id: expense.payer_upi_id,
            qr_code_base64: expense.payer_qr,
            color: expense.payer_color,
            avatar_initials: expense.payer_initials,
          };
          unpaid.push({ expense, split: mySplit, payer });
        }
      }
      setUnpaidSplits(unpaid);
    } catch (err) {
      console.error('Failed to fetch unpaid splits:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (splitId) => {
    await markSplitPaid(splitId);
    setUnpaidSplits((prev) => prev.filter((s) => s.split.id !== splitId));
    fetchBalances();
  };

  const isOwnProfile = currentMember?.id === memberId;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/members')}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-bold text-gray-900">
            {viewedMember?.name || 'Member'}
            {isOwnProfile && ' (You)'}
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-10 space-y-5">
        {/* Member card */}
        {viewedMember && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
            <MemberAvatar member={viewedMember} size="xl" />
            <div>
              <p className="font-bold text-gray-900 text-lg">{viewedMember.name}</p>
              <p className="text-sm text-gray-500 font-mono">{viewedMember.upi_id}</p>
            </div>
          </div>
        )}

        {/* Balance summary */}
        {balance && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <TrendingDown size={16} />
                <span className="text-xs font-medium">Owes</span>
              </div>
              <p className="font-bold text-red-700 text-lg">{formatRupees(balance.totalOwed)}</p>
              <p className="text-xs text-red-500 mt-0.5">to others</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <TrendingUp size={16} />
                <span className="text-xs font-medium">Owed</span>
              </div>
              <p className="font-bold text-green-700 text-lg">{formatRupees(balance.totalOwedTo)}</p>
              <p className="text-xs text-green-500 mt-0.5">by others</p>
            </div>
          </div>
        )}

        {/* Unpaid splits (only for own profile) */}
        {isOwnProfile && (
          <div>
            <h2 className="font-bold text-gray-900 mb-3">
              {unpaidSplits.length > 0 ? `Pending Payments (${unpaidSplits.length})` : 'Pending Payments'}
            </h2>

            {loading ? (
              <div className="flex justify-center py-8">
                <span className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full" />
              </div>
            ) : unpaidSplits.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">
                <p className="text-3xl mb-2">✅</p>
                <p className="font-medium">All settled up!</p>
                <p className="text-sm mt-1">No pending payments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidSplits.map(({ expense, split, payer }) => (
                  <PaymentCard
                    key={split.id}
                    expense={expense}
                    payer={payer}
                    debtor={viewedMember}
                    currentShare={split.share}
                    carryForward={split.carry_forward}
                    splitId={split.id}
                    onMarkPaid={handleMarkPaid}
                    isPaid={split.paid}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
