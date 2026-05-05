import { useState } from 'react';
import { X, ArrowRight, Home, Plus, Users, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    icon: Home,
    color: '#27AE78',
    bg: '#D4F5E7',
    title: 'Welcome to Roomie Split',
    desc: 'Track shared expenses with your roommates and settle up instantly via UPI.',
    tip: 'Your balance is always visible on the home screen.',
  },
  {
    icon: Plus,
    color: '#6366f1',
    bg: '#EEF2FF',
    title: 'Add an Expense',
    desc: 'Tap the green + button to add any shared expense. Choose a category, enter the amount, and select who paid.',
    tip: 'You can split equally or set custom amounts per person.',
  },
  {
    icon: Users,
    color: '#FF6B35',
    bg: '#FFEEE6',
    title: 'Invite Roommates',
    desc: 'Go to Members → share the room code. Each roommate creates their own account with email and UPI ID.',
    tip: 'Everyone gets email alerts when a new expense is added.',
  },
  {
    icon: CheckCircle2,
    color: '#27AE78',
    bg: '#D4F5E7',
    title: 'Pay & Settle Up',
    desc: 'Tap "Settle up" to see the minimum payments needed. Pay directly via PhonePe or GPay — amount is pre-filled.',
    tip: 'Once everyone pays, the expense can be deleted.',
  },
];

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl overflow-hidden animate-scale-in"
        style={{ background: '#FFFFFF' }}>

        {/* Progress dots */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? '20px' : '6px',
                  background: i <= step ? '#27AE78' : '#E5E5E3',
                }} />
            ))}
          </div>
          <button onClick={onDone} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} strokeWidth={1.75} style={{ color: '#9CA3AF' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4 text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
            style={{ background: current.bg }}>
            <Icon size={36} style={{ color: current.color }} strokeWidth={1.5} />
          </div>

          <h2 className="font-heading font-bold text-xl mb-2" style={{ color: '#1C1C1E' }}>
            {current.title}
          </h2>
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
            {current.desc}
          </p>

          {/* Tip */}
          <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-6 text-left"
            style={{ background: '#F7FFF9', border: '1px solid #A8E6C8' }}>
            <span className="text-base flex-shrink-0">💡</span>
            <p className="text-xs" style={{ color: '#1A6B4A' }}>{current.tip}</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="flex-1 border rounded-xl py-3 text-sm font-semibold transition-colors"
                style={{ borderColor: '#E5E5E3', color: '#6B7280' }}>
                Back
              </button>
            )}
            <button
              onClick={() => isLast ? onDone() : setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-2 text-white rounded-xl py-3 text-sm font-heading font-semibold transition-all"
              style={{ background: '#27AE78', boxShadow: '0 4px 14px rgba(39,174,120,0.30)' }}>
              {isLast ? <><CheckCircle2 size={16} /> Get Started</> : <>Next <ArrowRight size={16} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
