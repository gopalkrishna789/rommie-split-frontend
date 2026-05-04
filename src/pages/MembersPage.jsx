import { useEffect, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MemberBalance from '../components/MemberBalance';
import MemberSetup from '../components/MemberSetup';
import { useMembers } from '../hooks/useMembers';
import { useExpenses } from '../hooks/useExpenses';

export default function MembersPage() {
  const navigate = useNavigate();
  const [currentMember, setCurrentMember] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);

  const { members, loading, fetchMembers, addMember } = useMembers();
  const { balances, fetchBalances } = useExpenses();

  useEffect(() => {
    const member = JSON.parse(localStorage.getItem('roomie_member') || 'null');
    if (!member) { navigate('/join'); return; }
    setCurrentMember(member);
    fetchMembers();
    fetchBalances();
  }, []);

  const handleAddMember = async (data) => {
    await addMember(data);
    setShowAddMember(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-gray-900">Members</h1>
          </div>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          >
            <UserPlus size={16} />
            Add
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5 pb-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="animate-spin w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const balance = balances.find((b) => b.memberId === member.id);
              return (
                <MemberBalance
                  key={member.id}
                  member={member}
                  balance={balance}
                  isCurrentUser={member.id === currentMember?.id}
                  onClick={() => navigate(`/member/${member.id}`)}
                />
              );
            })}

            {members.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-2">👥</p>
                <p className="font-medium">No members yet</p>
                <p className="text-sm mt-1">Add your roommates to get started</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add member modal */}
      {showAddMember && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Add Member</h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              <MemberSetup onSave={handleAddMember} onCancel={() => setShowAddMember(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
