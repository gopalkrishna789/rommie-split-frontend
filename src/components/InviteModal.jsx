/**
 * InviteModal — share room invite via WhatsApp, email, copy link, or QR
 */
import { useState } from 'react';
import { X, Copy, Check, MessageCircle, Mail, Share2, QrCode } from 'lucide-react';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

export default function InviteModal({ room, onClose }) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const code    = room?.invite_code || room?.inviteCode || '';
  const name    = room?.name || 'our room';
  const joinUrl = `${APP_URL}/join?code=${code}`;

  const message = `Hey! Join me on Roomie Split to track our shared expenses 🏠💸\n\nRoom: ${name}\nCode: ${code}\n\nJoin here: ${joinUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(joinUrl).catch(() =>
      navigator.clipboard.writeText(message)
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(`Join ${name} on Roomie Split`);
    const body    = encodeURIComponent(message);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${name} on Roomie Split`,
        text:  message,
        url:   joinUrl,
      }).catch(() => {});
    }
  };

  // Simple QR via Google Charts API (no dependency)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(joinUrl)}`;

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Invite roommates"
    >
      <div
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: '#FFFFFF' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b" style={{ borderColor: '#F3F4F6' }}>
          <div>
            <h2 className="font-heading font-semibold text-lg" style={{ color: '#1C1C1E' }}>
              Invite Roommates
            </h2>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              Share the code or link — they join in 30 seconds
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            style={{ color: '#6B7280' }}
            aria-label="Close"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Room code hero */}
          <div
            className="relative overflow-hidden rounded-2xl p-5 text-center"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />
            <p className="text-indigo-200 text-xs font-semibold uppercase tracking-widest mb-2">
              Room Code
            </p>
            <p className="text-4xl font-black text-white tracking-[0.25em] font-mono mb-1">
              {code}
            </p>
            <p className="text-indigo-200 text-xs">{name}</p>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* WhatsApp */}
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97]"
              style={{ background: '#25D366', color: '#FFFFFF' }}
            >
              <MessageCircle size={18} strokeWidth={2} />
              WhatsApp
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97]"
              style={{ background: '#EEF2FF', color: '#4F46E5' }}
            >
              <Mail size={18} strokeWidth={1.75} />
              Email
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] border"
              style={{ background: '#FFFFFF', borderColor: '#E5E5E3', color: '#1C1C1E' }}
            >
              {copied ? <Check size={18} style={{ color: '#059669' }} /> : <Copy size={18} strokeWidth={1.75} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            {/* Native share / QR */}
            {navigator.share ? (
              <button
                onClick={handleNativeShare}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] border"
                style={{ background: '#FFFFFF', borderColor: '#E5E5E3', color: '#1C1C1E' }}
              >
                <Share2 size={18} strokeWidth={1.75} />
                Share
              </button>
            ) : (
              <button
                onClick={() => setShowQr((v) => !v)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] border"
                style={{
                  background: showQr ? '#EEF2FF' : '#FFFFFF',
                  borderColor: showQr ? '#6366F1' : '#E5E5E3',
                  color: showQr ? '#4F46E5' : '#1C1C1E',
                }}
              >
                <QrCode size={18} strokeWidth={1.75} />
                QR Code
              </button>
            )}
          </div>

          {/* QR code */}
          {showQr && (
            <div className="flex flex-col items-center gap-2 py-2 animate-fade-in">
              <img
                src={qrUrl}
                alt="QR code to join room"
                className="rounded-xl border"
                style={{ borderColor: '#E5E5E3' }}
                width={180}
                height={180}
              />
              <p className="text-xs" style={{ color: '#6B7280' }}>
                Scan to join {name}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl px-4 py-3" style={{ background: '#F7F7F5' }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#1C1C1E' }}>
              How it works
            </p>
            <ol className="text-xs space-y-1" style={{ color: '#6B7280' }}>
              <li>1. Share the code or link with your roommate</li>
              <li>2. They open the app → "Join Room" → enter the code</li>
              <li>3. They create their account in 30 seconds</li>
              <li>4. Done — start splitting!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
