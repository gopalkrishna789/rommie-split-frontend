import { useState } from 'react';
import { X, ArrowRight, ChevronRight } from 'lucide-react';

const STEPS = [
  {
    emoji: '🏠',
    gradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
    bgPattern: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
    accentColor: '#6366F1',
    lightColor: '#EEF2FF',
    title: 'Welcome to Roomie Split!',
    subtitle: 'Your smart roommate expense tracker',
    desc: 'No more awkward money conversations. Track every shared expense, see who owes what, and settle up instantly — all in one place.',
    illustration: WelcomeIllustration,
    highlights: ['Real-time balance tracking', 'Instant UPI payments', 'Email notifications'],
  },
  {
    emoji: '➕',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    bgPattern: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
    accentColor: '#10B981',
    lightColor: '#D1FAE5',
    title: 'Add Expenses Easily',
    subtitle: 'Split bills in seconds',
    desc: 'Tap the big + button at the bottom. Enter the amount, pick a category, and choose who paid. The app splits it equally among all roommates.',
    illustration: AddExpenseIllustration,
    highlights: ['Equal or custom splits', 'Categories & notes', 'Receipt photos'],
  },
  {
    emoji: '👥',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    bgPattern: 'linear-gradient(135deg, #FFF1F2 0%, #FDF2F8 100%)',
    accentColor: '#EC4899',
    lightColor: '#FCE7F3',
    title: 'Invite Your Roommates',
    subtitle: 'Everyone stays in sync',
    desc: 'Share your room code from the header. Each roommate joins with their own account, adds their UPI ID, and everyone sees the same balances live.',
    illustration: InviteIllustration,
    highlights: ['Share room code', 'Each person has their own login', 'Live balance updates'],
  },
  {
    emoji: '💸',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    bgPattern: 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)',
    accentColor: '#3B82F6',
    lightColor: '#DBEAFE',
    title: 'Pay & Settle Up',
    subtitle: 'One tap UPI payments',
    desc: 'When you owe someone, tap "Settle up". Choose PhonePe or GPay — the amount is pre-filled. Your roommate confirms receipt and the balance clears.',
    illustration: PayIllustration,
    highlights: ['PhonePe & GPay support', 'Amount pre-filled', 'Payer confirms receipt'],
  },
];

// ── Illustrations ─────────────────────────────────────────────────────────

function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* House */}
      <rect x="80" y="80" width="120" height="80" rx="4" fill="#C7D2FE" />
      <polygon points="80,80 140,30 200,80" fill="#818CF8" />
      {/* Door */}
      <rect x="120" y="120" width="40" height="40" rx="4" fill="#6366F1" />
      <circle cx="152" cy="142" r="3" fill="#C7D2FE" />
      {/* Windows */}
      <rect x="90" y="95" width="25" height="20" rx="3" fill="#E0E7FF" />
      <rect x="165" y="95" width="25" height="20" rx="3" fill="#E0E7FF" />
      {/* People */}
      <circle cx="50" cy="130" r="14" fill="#FDE68A" />
      <rect x="38" y="144" width="24" height="28" rx="6" fill="#FCD34D" />
      <circle cx="230" cy="130" r="14" fill="#A7F3D0" />
      <rect x="218" y="144" width="24" height="28" rx="6" fill="#6EE7B7" />
      {/* Rupee coins floating */}
      <circle cx="140" cy="20" r="12" fill="#FDE68A" opacity="0.8" />
      <text x="136" y="25" fontSize="12" fill="#D97706" fontWeight="bold">₹</text>
      <circle cx="60" cy="60" r="9" fill="#FDE68A" opacity="0.6" />
      <text x="57" y="65" fontSize="9" fill="#D97706" fontWeight="bold">₹</text>
      <circle cx="220" cy="55" r="9" fill="#FDE68A" opacity="0.6" />
      <text x="217" y="60" fontSize="9" fill="#D97706" fontWeight="bold">₹</text>
      {/* Stars */}
      <text x="20" y="40" fontSize="14" opacity="0.5">✨</text>
      <text x="245" y="35" fontSize="12" opacity="0.5">⭐</text>
    </svg>
  );
}

function AddExpenseIllustration() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Phone mockup */}
      <rect x="90" y="10" width="100" height="160" rx="16" fill="#1C1C1E" />
      <rect x="95" y="20" width="90" height="140" rx="10" fill="#F7F7F5" />
      {/* Screen content */}
      <rect x="105" y="30" width="70" height="8" rx="4" fill="#E5E7EB" />
      <rect x="105" y="44" width="50" height="6" rx="3" fill="#E5E7EB" />
      {/* Expense card */}
      <rect x="100" y="60" width="80" height="50" rx="8" fill="#FFFFFF" />
      <rect x="100" y="60" width="80" height="50" rx="8" stroke="#E5E7EB" strokeWidth="1" />
      <circle cx="115" cy="78" r="8" fill="#D1FAE5" />
      <text x="111" y="82" fontSize="9">🛒</text>
      <rect x="128" y="72" width="40" height="5" rx="2.5" fill="#374151" />
      <rect x="128" y="81" width="28" height="4" rx="2" fill="#9CA3AF" />
      <rect x="128" y="92" width="35" height="5" rx="2.5" fill="#10B981" />
      {/* Plus button */}
      <circle cx="140" cy="155" r="14" fill="url(#greenGrad)" />
      <text x="134" y="160" fontSize="16" fill="white" fontWeight="bold">+</text>
      <defs>
        <linearGradient id="greenGrad" x1="126" y1="141" x2="154" y2="169">
          <stop offset="0%" stopColor="#11998e" />
          <stop offset="100%" stopColor="#38ef7d" />
        </linearGradient>
      </defs>
      {/* Floating labels */}
      <rect x="10" y="70" width="65" height="22" rx="11" fill="#D1FAE5" />
      <text x="18" y="85" fontSize="9" fill="#065F46" fontWeight="600">Groceries 🛒</text>
      <rect x="205" y="90" width="60" height="22" rx="11" fill="#FEF3C7" />
      <text x="213" y="105" fontSize="9" fill="#92400E" fontWeight="600">₹1,200 💰</text>
    </svg>
  );
}

function InviteIllustration() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Central QR-like code card */}
      <rect x="100" y="40" width="80" height="80" rx="12" fill="#FFFFFF" />
      <rect x="100" y="40" width="80" height="80" rx="12" stroke="#F9A8D4" strokeWidth="2" />
      {/* QR pattern */}
      <rect x="112" y="52" width="20" height="20" rx="3" fill="#EC4899" />
      <rect x="148" y="52" width="20" height="20" rx="3" fill="#EC4899" />
      <rect x="112" y="88" width="20" height="20" rx="3" fill="#EC4899" />
      <rect x="136" y="76" width="8" height="8" rx="1" fill="#F9A8D4" />
      <rect x="148" y="76" width="8" height="8" rx="1" fill="#F9A8D4" />
      <rect x="148" y="88" width="8" height="8" rx="1" fill="#F9A8D4" />
      <rect x="160" y="88" width="8" height="8" rx="1" fill="#F9A8D4" />
      {/* Code text */}
      <rect x="108" y="126" width="64" height="10" rx="5" fill="#FCE7F3" />
      <text x="120" y="134" fontSize="8" fill="#EC4899" fontWeight="700" letterSpacing="2">ABCD1234</text>
      {/* People around */}
      <circle cx="40" cy="90" r="18" fill="#FDE68A" />
      <text x="30" y="96" fontSize="18">👤</text>
      <circle cx="240" cy="90" r="18" fill="#A7F3D0" />
      <text x="230" y="96" fontSize="18">👤</text>
      <circle cx="140" cy="170" r="18" fill="#BFDBFE" />
      <text x="130" y="176" fontSize="18">👤</text>
      {/* Arrows */}
      <path d="M58 90 L95 90" stroke="#F9A8D4" strokeWidth="2" strokeDasharray="4 3" markerEnd="url(#arrow)" />
      <path d="M222 90 L185 90" stroke="#F9A8D4" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M140 152 L140 125" stroke="#F9A8D4" strokeWidth="2" strokeDasharray="4 3" />
      {/* Share icon */}
      <circle cx="140" cy="20" r="14" fill="#FCE7F3" />
      <text x="133" y="26" fontSize="14">📤</text>
    </svg>
  );
}

function PayIllustration() {
  return (
    <svg viewBox="0 0 280 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Payment card */}
      <rect x="60" y="30" width="160" height="90" rx="16" fill="url(#blueGrad)" />
      <circle cx="90" cy="55" r="18" fill="rgba(255,255,255,0.2)" />
      <circle cx="105" cy="55" r="18" fill="rgba(255,255,255,0.15)" />
      <text x="68" y="80" fontSize="22" fill="white" fontWeight="800">₹ 1,200</text>
      <text x="68" y="96" fontSize="10" fill="rgba(255,255,255,0.8)">Pay to Vijay Kumar</text>
      <rect x="68" y="104" width="80" height="8" rx="4" fill="rgba(255,255,255,0.3)" />
      {/* UPI logos */}
      <rect x="68" y="140" width="60" height="28" rx="8" fill="#5f259f" />
      <text x="76" y="158" fontSize="10" fill="white" fontWeight="700">PhonePe</text>
      <rect x="152" y="140" width="60" height="28" rx="8" fill="#1a73e8" />
      <text x="162" y="158" fontSize="10" fill="white" fontWeight="700">GPay</text>
      {/* Check mark */}
      <circle cx="220" cy="45" r="20" fill="#D1FAE5" />
      <text x="210" y="52" fontSize="18">✅</text>
      {/* Rupee rain */}
      <text x="20" y="50" fontSize="16" opacity="0.4">₹</text>
      <text x="245" y="80" fontSize="14" opacity="0.4">₹</text>
      <text x="30" y="130" fontSize="12" opacity="0.3">₹</text>
      <defs>
        <linearGradient id="blueGrad" x1="60" y1="30" x2="220" y2="120">
          <stop offset="0%" stopColor="#4facfe" />
          <stop offset="100%" stopColor="#00f2fe" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0);
  const [animDir, setAnimDir] = useState('forward');
  const current = STEPS[step];
  const Illustration = current.illustration;
  const isLast = step === STEPS.length - 1;

  const goNext = () => {
    if (isLast) { onDone(); return; }
    setAnimDir('forward');
    setStep(s => s + 1);
  };

  const goPrev = () => {
    if (step === 0) return;
    setAnimDir('back');
    setStep(s => s - 1);
  };

  const goTo = (i) => {
    setAnimDir(i > step ? 'forward' : 'back');
    setStep(i);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden animate-scale-in"
        style={{ background: '#FFFFFF', maxHeight: '92vh' }}
      >
        {/* ── Coloured header with illustration ── */}
        <div
          className="relative overflow-hidden"
          style={{ background: current.bgPattern, minHeight: '220px' }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30"
            style={{ background: current.gradient }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full opacity-20"
            style={{ background: current.gradient }}
          />

          {/* Top bar */}
          <div className="relative flex items-center justify-between px-5 pt-5 pb-2">
            {/* Step dots */}
            <div className="flex gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? '24px' : '8px',
                    height: '8px',
                    background: i === step
                      ? current.accentColor
                      : i < step
                      ? current.accentColor + '60'
                      : '#D1D5DB',
                  }}
                />
              ))}
            </div>

            {/* Skip */}
            <button
              onClick={onDone}
              className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{ color: '#6B7280', background: 'rgba(0,0,0,0.06)' }}
            >
              Skip <X size={12} />
            </button>
          </div>

          {/* Illustration */}
          <div className="relative px-8 pt-2 pb-4" style={{ height: '160px' }}>
            <Illustration />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="px-6 pt-5 pb-6">
          {/* Step badge */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: current.lightColor, color: current.accentColor }}
            >
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-lg">{current.emoji}</span>
          </div>

          {/* Title */}
          <h2 className="font-heading font-black text-2xl leading-tight mb-1" style={{ color: '#111827' }}>
            {current.title}
          </h2>
          <p className="text-xs font-semibold mb-3" style={{ color: current.accentColor }}>
            {current.subtitle}
          </p>

          {/* Description */}
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
            {current.desc}
          </p>

          {/* Highlights */}
          <div className="space-y-2 mb-6">
            {current.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: current.lightColor }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: current.accentColor }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#374151' }}>{h}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={goPrev}
                className="px-5 py-3.5 rounded-2xl text-sm font-semibold border-2 transition-all active:scale-95"
                style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              >
                Back
              </button>
            )}
            <button
              onClick={goNext}
              className="flex-1 flex items-center justify-center gap-2 text-white rounded-2xl py-3.5 text-sm font-heading font-bold transition-all active:scale-95"
              style={{
                background: current.gradient,
                boxShadow: `0 6px 20px ${current.accentColor}40`,
              }}
            >
              {isLast ? (
                <>🚀 Let's Get Started!</>
              ) : (
                <>Next <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
