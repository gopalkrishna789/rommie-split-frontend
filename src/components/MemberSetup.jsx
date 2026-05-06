import { useState, useRef } from 'react';
import { Upload, User, CreditCard, Palette, Camera, Mail, Check, Image } from 'lucide-react';
import MemberAvatar from './MemberAvatar';

const COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#8b5cf6', '#ef4444', '#14b8a6',
  '#f97316', '#06b6d4',
];

/**
 * MemberSetup — form to add/edit a member profile
 * Props: { onSave, onCancel, initialData, qrRequired }
 */
export default function MemberSetup({ onSave, onCancel, initialData = {}, qrRequired = false }) {
  const [name, setName] = useState(initialData.name || '');
  const [upiId, setUpiId] = useState(initialData.upi_id || initialData.upiId || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [color, setColor] = useState(initialData.color || COLORS[0]);
  const [qrPreview, setQrPreview] = useState(initialData.qr_code_base64 || null);
  const [qrBase64, setQrBase64] = useState(initialData.qr_code_base64 || null);
  const [photoPreview, setPhotoPreview] = useState(initialData.photo_base64 || null);
  const [photoBase64, setPhotoBase64] = useState(initialData.photo_base64 || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();
  const photoRef = useRef();

  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 3);
  const previewMember = { name, color, avatar_initials: initials || '?', photo_base64: photoPreview };

  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      setError('QR image must be under 800KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrPreview(ev.target.result);
      setQrBase64(ev.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { setError('Profile photo must be under 1MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPhotoPreview(ev.target.result); setPhotoBase64(ev.target.result); setError(''); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (!upiId.trim()) return setError('UPI ID is required');
    if (!upiId.includes('@')) return setError('Enter a valid UPI ID (e.g. name@okaxis)');
    if (qrRequired && !qrBase64) return setError('Please upload your UPI QR code — it is required so roommates can pay you');

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        upiId: upiId.trim().toLowerCase(),
        email: email.trim() || undefined,
        color,
        qrCodeBase64: qrBase64,
        photoBase64: photoBase64 || undefined,
      });
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Live preview */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
        <MemberAvatar member={previewMember} size="xl" />
        <div>
          <p className="font-semibold text-gray-900">{name || 'Your Name'}</p>
          <p className="text-sm text-gray-500 font-mono">{upiId || 'upi@bank'}</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="member-name">
          <User size={14} className="inline mr-1" />
          Full Name
        </label>
        <input
          id="member-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ravi Kumar"
          maxLength={100}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          autoFocus
        />
      </div>

      {/* UPI ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="upi-id">
          <CreditCard size={14} className="inline mr-1" />
          UPI ID
        </label>
        <input
          id="upi-id"
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          placeholder="yourname@okaxis"
          maxLength={100}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 font-mono"
        />
        <p className="text-xs text-gray-400 mt-1">Others will pay you at this UPI ID</p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="member-email">
          <Mail size={14} className="inline mr-1" />
          Email <span className="text-gray-400 font-normal">(for payment alerts)</span>
        </label>
        <input
          id="member-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@gmail.com"
          maxLength={200}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <Mail size={10} />
          You'll get an email with a Pay Now button when someone adds an expense
        </p>
      </div>

      {/* Profile Photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Image size={14} className="inline mr-1" />
          Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <MemberAvatar member={previewMember} size="xl" />
            <button type="button" onClick={() => photoRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
              style={{ background: '#6366f1' }} aria-label="Upload photo">
              <Camera size={13} className="text-white" />
            </button>
          </div>
          <div className="flex-1">
            {photoPreview ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-indigo-600 flex items-center gap-1"><Check size={12} /> Photo uploaded</span>
                <button type="button" onClick={() => { setPhotoPreview(null); setPhotoBase64(null); }}
                  className="text-xs text-red-500 hover:underline">Remove</button>
              </div>
            ) : (
              <button type="button" onClick={() => photoRef.current?.click()}
                className="text-sm font-medium px-3 py-2 rounded-xl border-2 border-dashed transition-colors"
                style={{ borderColor: '#E5E5E3', color: '#6B7280' }}>
                Upload photo
              </button>
            )}
            <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 1MB</p>
          </div>
        </div>
        <input ref={photoRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" aria-hidden="true" />
      </div>

      {/* Color picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Palette size={14} className="inline mr-1" />
          Avatar Color
        </label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
            />
          ))}
        </div>
      </div>

      {/* QR Code upload — required */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Camera size={14} className="inline mr-1" />
          UPI QR Code
          {qrRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          aria-label="Upload QR code image"
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors ${
            qrPreview
              ? 'border-indigo-300 bg-indigo-50'
              : qrRequired
              ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
              : 'border-gray-200 hover:border-indigo-300'
          }`}
        >
          {qrPreview ? (
            <div className="flex flex-col items-center gap-2">
              <img
                src={qrPreview}
                alt="QR preview"
                className="w-36 h-36 object-contain mx-auto rounded-xl border border-gray-200 bg-white p-1"
              />
              <p className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                <Check size={12} /> QR uploaded
              </p>
            </div>
          ) : (
            <div className="text-gray-500">
              <Upload size={28} className="mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-medium">
                {qrRequired ? 'Upload your UPI QR code (required)' : 'Upload your UPI QR code'}
              </p>
              <p className="text-xs mt-1 text-gray-400">
                Open PhonePe / GPay → Profile → Show QR → Screenshot it
              </p>
              <p className="text-xs text-gray-400">PNG, JPG up to 800KB</p>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleQrUpload}
          className="hidden"
          aria-hidden="true"
        />
        {qrPreview && (
          <button
            type="button"
            onClick={() => { setQrPreview(null); setQrBase64(null); }}
            className="text-xs text-red-500 mt-1 hover:underline"
          >
            Remove QR
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 disabled:opacity-60 text-white rounded-xl py-3 font-semibold transition-colors"
          style={{ background: '#6366F1' }}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
