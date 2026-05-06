import { useState } from 'react';
import { AlertCircle, Check, X, Clock } from 'lucide-react';
import MemberAvatar from './MemberAvatar';
import { formatRupees } from '../utils/upiLink';
import { expensesApi } from '../utils/api';

/**
 * Shows pending payment confirmations for the payer
 * Payer can approve or reject claimed payments
 */
export default function PendingConfirmations({ pendingConfirmations, onConfirm, onReject, onClose }) {
  const [processing, setProcessing] = useState(null);

  const handleConfirm = async (splitId) => {
    setProcessing(splitId);
    try {
      await expensesApi.payerVerify(splitId, true);
      onConfirm && onConfirm(splitId);
    } catch (err) {
      console.error('Failed to confirm payment:', err);
      alert(err.response?.data?.error || 'Failed to confirm payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (splitId) => {
    setProcessing(splitId);
    try {
      await expensesApi.payerVerify(splitId, false);
      onReject && onReject(splitId);
    } catch (err) {
      console.error('Failed to reject payment:', err);
      alert(err.response?.data?.error || 'Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  if (!pendingConfirmations || pendingConfirmations.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div 
        className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl animate-slide-up flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-white" size={22} />
            <h2 className="text-white font-bold text-lg">Payment Confirmations</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 space-y-3">
            <p className="text-sm text-gray-600 text-center mb-4">
              {pendingConfirmations.length} payment{pendingConfirmations.length > 1 ? 's' : ''} waiting for your confirmation
            </p>

            {pendingConfirmations.map((item) => (
              <div
                key={item.split.id}
                className="rounded-2xl border-2 border-orange-200 bg-orange-50 overflow-hidden"
              >
                {/* Member info */}
                <div className="flex items-center gap-3 p-4 bg-white border-b border-orange-100">
                  <MemberAvatar member={item.debtor} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{item.debtor.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.expense.purpose}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-orange-600 text-lg leading-tight">
                      {formatRupees(item.split.share + (item.split.carry_forward || 0))}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>
                      {new Date(item.expense.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-orange-800 bg-orange-100 rounded-lg p-3 text-center">
                    💸 {item.debtor.name} claims they paid you
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(item.split.id)}
                      disabled={processing === item.split.id}
                      className="flex-1 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {processing === item.split.id ? (
                        <span className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                      ) : (
                        <><X size={16} /> No, I didn't receive it</>
                      )}
                    </button>
                    <button
                      onClick={() => handleConfirm(item.split.id)}
                      disabled={processing === item.split.id}
                      className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {processing === item.split.id ? (
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <><Check size={16} /> Yes, I received it</>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 text-center">
                    Only confirm if you actually received the money
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
