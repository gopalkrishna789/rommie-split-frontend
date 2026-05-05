import { useState, useEffect, useRef } from 'react';
import { Copy, Check, CheckCircle2, Clock, Zap, Monitor, AlertCircle, ChevronDown, Bell } from 'lucide-react';
import {
  buildUpiLink,
  launchUpiPayment,
  formatRupees,
  isMobile,
  isAndroid,
  isIOS,
} from '../utils/upiLink';
import MemberAvatar from './MemberAvatar';
import { expensesApi } from '../utils/api';

/**
 * PaymentCard — UPI payment flow
 *
 * Flow:
 *  1. User taps a UPI app button
 *  2. We record a 'pending' attempt in DB + launch the UPI deep link
 *  3. UPI app opens with amount pre-filled
 *  4. When user switches BACK to the browser (visibilitychange / pageshow),
 *     we show a "Did you complete the payment?" confirmation dialog
 *  5a. Yes → markSplitPaid → DB updated to paid=true, attempt=success
 *  5b. No  → attempt stays 'failed', user can retry
 */
export default function PaymentCard({
  expense,
  payer,
  currentShare,
  carryForward,
  splitId,
  onMarkPaid,
  onPayLater,
  isPaid = false,
  compact = false,
  amountPaid = 0,       // already paid amount (for partial payment display)
  onPartialPay,         // optional: called with amount when partial payment submitted
  paymentStatus = 'unpaid', // NEW: 'unpaid', 'pending_verification', 'paid'
  onConfirmPayment,     // NEW: callback for payer to confirm/reject
  isPayerView = false,  // NEW: true if current user is the payer
}) {
  const [copied, setCopied]           = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);
  const [marking, setMarking]         = useState(false);
  const [paid, setPaid]               = useState(isPaid);
  const [showApps, setShowApps]       = useState(false);
  const [payState, setPayState]       = useState('idle');
  const [launchedApp, setLaunchedApp] = useState(null);
  // Partial payment
  const [showPartial, setShowPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState('');
  const [partialLoading, setPartialLoading] = useState(false);
  const [partialError, setPartialError] = useState('');

  const totalToPay  = currentShare + (carryForward || 0);
  const alreadyPaid = amountPaid || 0;
  const remaining   = totalToPay - alreadyPaid;
  const hasPartial  = alreadyPaid > 0 && alreadyPaid < totalToPay;
  const mobile      = isMobile();
  const android     = isAndroid();
  const ios         = isIOS();

  const payerUpiId  = payer.upi_id || payer.upiId || '';
  const payerQr     = payer.qr_code_base64 || payer.payer_qr || null;
  const payerObj    = { upi_id: payerUpiId, name: payer.name };

  // Track whether we launched a UPI app so we can detect the return
  const launchedRef = useRef(false);
  // Debounce: ignore visibility events that fire immediately on launch
  const launchTimeRef = useRef(null);

  // ── Detect user returning from UPI app ───────────────────────────────────
  useEffect(() => {
    if (!mobile) return;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        launchedRef.current &&
        launchTimeRef.current &&
        Date.now() - launchTimeRef.current > 1500 // ignore if < 1.5s (false trigger)
      ) {
        launchedRef.current = false;
        setPayState('confirming');
        setShowApps(false);
      }
    };

    // pageshow fires when user navigates back (iOS Safari)
    const handlePageShow = (e) => {
      if (
        e.persisted &&
        launchedRef.current &&
        launchTimeRef.current &&
        Date.now() - launchTimeRef.current > 1500
      ) {
        launchedRef.current = false;
        setPayState('confirming');
        setShowApps(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [mobile]);

  // ── Copy UPI ID ──────────────────────────────────────────────────────────
  const handleCopyUpi = async () => {
    try { await navigator.clipboard.writeText(payerUpiId); }
    catch {
      const el = document.createElement('input');
      el.value = payerUpiId;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Copy UPI link (desktop) ──────────────────────────────────────────────
  const handleCopyLink = async () => {
    const link = buildUpiLink(payerObj, totalToPay, expense.purpose);
    try { await navigator.clipboard.writeText(link); } catch { /* ignore */ }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // ── Launch UPI app ───────────────────────────────────────────────────────
  const handlePayNow = async (app) => {
    setLaunchedApp(app);
    setPayState('launched');

    // Record pending attempt in DB
    try {
      await expensesApi.recordAttempt(splitId, app, totalToPay);
    } catch (err) {
      console.warn('Could not record payment attempt:', err);
    }

    // Mark that we launched — visibilitychange handler will fire on return
    launchedRef.current = true;
    launchTimeRef.current = Date.now();

    launchUpiPayment(app, payerObj, totalToPay, expense.purpose);
  };

  // ── User confirms payment was completed ──────────────────────────────────
  const handleConfirmPaid = async () => {
    if (marking) return;
    setMarking(true);
    try {
      const response = await onMarkPaid(splitId);
      
      // Check if payment is pending verification
      if (response?.data?.status === 'pending_verification') {
        // Show pending state - don't mark as fully paid yet
        setPayState('pending_verification');
      } else {
        // Old behavior for backward compatibility
        setPaid(true);
        setPayState('idle');
      }
    } catch (err) {
      console.error('Mark paid failed:', err);
      setPayState('idle');
    } finally {
      setMarking(false);
    }
  };

  // ── User says payment was NOT completed ─────────────────────────────────
  const handleNotPaid = () => {
    setPayState('failed_confirm');
    // Reset after a moment so they can retry
    setTimeout(() => setPayState('idle'), 300);
  };

  // ── Manual "Done, I Paid" (fallback) ────────────────────────────────────
  const handleMarkPaid = async () => {
    if (paid || marking) return;
    setMarking(true);
    try {
      await onMarkPaid(splitId);
      setPaid(true);
    } catch (err) {
      console.error('Mark paid failed:', err);
    } finally {
      setMarking(false);
    }
  };

  // ── Partial payment ──────────────────────────────────────────────────────
  const handlePartialPay = async () => {
    setPartialError('');
    const paise = Math.round(parseFloat(partialAmount || 0) * 100);
    if (!paise || paise <= 0) { setPartialError('Enter a valid amount'); return; }
    if (paise > remaining) { setPartialError(`Cannot exceed remaining ₹${(remaining / 100).toFixed(2)}`); return; }
    setPartialLoading(true);
    try {
      const res = await expensesApi.partialPay(splitId, paise);
      if (res.data.fullyPaid) {
        setPaid(true);
      } else {
        onPartialPay?.(paise);
        setShowPartial(false);
        setPartialAmount('');
      }
    } catch (err) {
      setPartialError(err.response?.data?.error || 'Failed to record partial payment');
    } finally {
      setPartialLoading(false);
    }
  };

  // ── Already paid ─────────────────────────────────────────────────────────
  if (isPaid || paymentStatus === 'paid') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
        <CheckCircle2 className="text-green-500 flex-shrink-0" size={22} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-green-800 text-sm">Paid to {payer.name}</p>
          <p className="text-xs text-green-600 truncate">
            {expense.purpose} · {formatRupees(totalToPay)}
          </p>
        </div>
      </div>
    );
  }

  // ── Pending Verification (Debtor View) ──────────────────────────────────
  if (paymentStatus === 'pending_verification' && !isPayerView) {
    return (
      <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-yellow-100 border-b border-yellow-200">
          <Clock className="text-yellow-600 flex-shrink-0" size={22} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-yellow-900 text-sm">Waiting for Confirmation</p>
            <p className="text-xs text-yellow-700 truncate">
              {payer.name} needs to confirm they received your payment
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="text-lg font-bold text-yellow-700">{formatRupees(totalToPay)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">For</span>
            <span className="text-sm font-medium text-gray-900 truncate ml-2">{expense.purpose}</span>
          </div>
          <div className="rounded-xl bg-yellow-100 border border-yellow-200 p-3 text-center">
            <p className="text-xs text-yellow-800">
              ⏳ Your payment is pending verification. {payer.name} will confirm once they receive it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Pending Verification (Payer View - Needs Confirmation) ──────────────
  if (paymentStatus === 'pending_verification' && isPayerView) {
    return (
      <div className="rounded-2xl border-2 border-orange-300 bg-white overflow-hidden shadow-md">
        {/* Header */}
        <div className="bg-orange-500 px-4 py-3 flex items-center gap-2">
          <AlertCircle className="text-white flex-shrink-0" size={20} />
          <p className="text-white font-bold text-sm">Payment Confirmation Needed</p>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-center space-y-1">
            <p className="font-bold text-gray-900 text-base">
              Did you receive this payment?
            </p>
            <p className="text-sm text-gray-600">
              {expense.purpose} · {formatRupees(totalToPay)}
            </p>
          </div>

          {/* Confirmation buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => onConfirmPayment && onConfirmPayment(splitId, false)}
              className="flex-1 py-3 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 font-semibold text-sm hover:bg-red-100 active:scale-[0.98] transition-all"
            >
              ✗ No, I didn't
            </button>
            <button
              onClick={() => onConfirmPayment && onConfirmPayment(splitId, true)}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} /> Yes, Received!
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Only confirm if you actually received {formatRupees(totalToPay)} from the member
          </p>
        </div>
      </div>
    );
  }

  // ── "Did you complete the payment?" confirmation overlay ─────────────────
  if (payState === 'confirming') {
    const appLabel = {
      phonepe: 'PhonePe',
      gpay: 'Google Pay',
      paytm: 'Paytm',
      upi: 'UPI App',
    }[launchedApp] || 'UPI App';

    return (
      <div className="rounded-2xl border-2 border-indigo-300 bg-white overflow-hidden shadow-md">
        {/* Header */}
        <div className="bg-indigo-600 px-4 py-3 flex items-center gap-2">
          <span className="text-xl">💸</span>
          <p className="text-white font-bold text-sm">Payment Check</p>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-center space-y-1">
            <p className="font-bold text-gray-900 text-base">
              Did you complete the payment?
            </p>
            <p className="text-sm text-gray-500">
              You opened <strong>{appLabel}</strong> to pay{' '}
              <strong className="text-indigo-600">{formatRupees(totalToPay)}</strong> to{' '}
              <strong>{payer.name}</strong>
            </p>
          </div>

          {/* Confirmation buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleNotPaid}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              ✗ No, I didn't
            </button>
            <button
              onClick={handleConfirmPaid}
              disabled={marking}
              className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm active:scale-[0.98] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {marking
                ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                : <><Check size={16} /> Yes, Paid!</>}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center">
            Only confirm if the payment was successful in {appLabel}
          </p>
        </div>
      </div>
    );
  }

  // ── Payment marked as pending verification ──────────────────────────────
  if (payState === 'pending_verification') {
    return (
      <div className="rounded-2xl border-2 border-yellow-300 bg-yellow-50 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 p-4 bg-yellow-100 border-b border-yellow-200">
          <Clock className="text-yellow-600 flex-shrink-0" size={22} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-yellow-900 text-sm">Payment Submitted!</p>
            <p className="text-xs text-yellow-700">
              Waiting for {payer.name} to confirm
            </p>
          </div>
        </div>
        <div className="p-4">
          <p className="text-sm text-yellow-800 text-center">
            ⏳ {payer.name} will confirm once they receive your payment. You'll be notified when it's approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border border-orange-200 bg-white overflow-hidden shadow-sm"
      role="article"
      aria-label={`Pay ${payer.name} ${formatRupees(totalToPay)} for ${expense.purpose}`}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 p-4 bg-orange-50 border-b border-orange-100">
        <MemberAvatar member={payer} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">Pay {payer.name}</p>
          <p className="text-xs text-gray-500 truncate">
            {expense.purpose} ·{' '}
            {new Date(expense.date).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-orange-600 text-xl leading-tight">
            {formatRupees(totalToPay)}
          </p>
          {carryForward > 0 && (
            <p className="text-xs text-orange-400">incl. prev dues</p>
          )}
        </div>
      </div>

      {/* ── Amount breakdown ── */}
      {!compact && (
        <div className="px-4 py-3 space-y-1.5 border-b border-gray-100 bg-gray-50 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>This bill's share</span>
            <span className="font-medium">{formatRupees(currentShare)}</span>
          </div>
          {carryForward > 0 && (
            <div className="flex justify-between text-orange-600">
              <span>Previous dues</span>
              <span className="font-medium">+ {formatRupees(carryForward)}</span>
            </div>
          )}
          {hasPartial && (
            <div className="flex justify-between text-green-600">
              <span>Already paid</span>
              <span className="font-medium">− {formatRupees(alreadyPaid)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-gray-900 pt-1.5 border-t border-gray-200">
            <span>{hasPartial ? 'Remaining' : 'Total to pay'}</span>
            <span className="text-orange-600">{formatRupees(hasPartial ? remaining : totalToPay)}</span>
          </div>
          {hasPartial && (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Payment progress</span>
                <span>{Math.round((alreadyPaid / totalToPay) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min((alreadyPaid / totalToPay) * 100, 100)}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Payer's QR + UPI ID ── */}
      <div className="px-4 pt-4 pb-3 flex flex-col items-center gap-3 border-b border-gray-100">
        {payerQr ? (
          <>
            <p className="text-xs text-gray-500 font-medium self-start">
              Scan {payer.name}'s QR to pay
            </p>
            <img
              src={payerQr}
              alt={`${payer.name}'s UPI QR code`}
              className="w-52 h-52 object-contain rounded-2xl border-2 border-indigo-100 bg-white p-1.5 shadow-sm"
            />
          </>
        ) : (
          <div className="w-full rounded-xl border-2 border-dashed border-gray-200 py-5 flex flex-col items-center text-gray-400 text-xs gap-1">
            <span className="text-3xl">📱</span>
            <span>{payer.name} hasn't uploaded a QR code</span>
            <span>Use the UPI ID below</span>
          </div>
        )}

        {/* UPI ID + copy */}
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 w-full">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 leading-none mb-0.5">UPI ID</p>
            <p className="text-sm font-mono font-bold text-gray-900 truncate">{payerUpiId}</p>
          </div>
          <button
            onClick={handleCopyUpi}
            className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-100 active:scale-95 transition-all text-xs font-medium"
            aria-label="Copy UPI ID"
          >
            {copied
              ? <><Check size={13} className="text-green-500" /> Copied!</>
              : <><Copy size={13} /> Copy</>}
          </button>
        </div>
      </div>

      {/* ── PAY NOW section ── */}
      <div className="p-4 space-y-3">

        {/* ── "Waiting for you to return" state ── */}
        {payState === 'launched' && (
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-3 flex items-center gap-3">
            <span className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full flex-shrink-0" />
            <p className="text-xs text-indigo-700 font-medium">
              Waiting for you to complete payment in the app…
            </p>
          </div>
        )}

        {/* ── ANDROID + iOS: UPI app buttons ── */}
        {mobile && payState !== 'launched' && (
          <>
            {!showApps ? (
              <button
                onClick={() => setShowApps(true)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl py-4 text-base font-bold transition-all shadow-lg shadow-indigo-200"
              >
                <Zap size={20} className="fill-white" />
                Pay Now — {formatRupees(totalToPay)}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center font-medium">
                  {android
                    ? '✅ Amount pre-filled — just tap Pay in the app'
                    : 'Choose your UPI app'}
                </p>

                {/* PhonePe */}
                <button
                  onClick={() => handlePayNow('phonepe')}
                  className="w-full flex items-center gap-3 bg-[#5f259f] hover:bg-[#4e1d85] active:scale-[0.98] text-white rounded-xl px-4 py-3.5 font-semibold transition-all"
                >
                  <span className="text-2xl leading-none">💜</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">PhonePe</p>
                    <p className="text-xs opacity-75">
                      {formatRupees(totalToPay)} → {payerUpiId}
                    </p>
                  </div>
                  <span className="text-white/50 text-xl font-light">›</span>
                </button>

                {/* Google Pay */}
                <button
                  onClick={() => handlePayNow('gpay')}
                  className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 active:scale-[0.98] border-2 border-gray-200 rounded-xl px-4 py-3.5 font-semibold transition-all"
                >
                  <span className="text-2xl leading-none">🔵</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-900">Google Pay</p>
                    <p className="text-xs text-gray-500">
                      {formatRupees(totalToPay)} → {payerUpiId}
                    </p>
                  </div>
                  <span className="text-gray-300 text-xl font-light">›</span>
                </button>

                {/* Paytm */}
                <button
                  onClick={() => handlePayNow('paytm')}
                  className="w-full flex items-center gap-3 bg-[#00baf2] hover:bg-[#00a8dc] active:scale-[0.98] text-white rounded-xl px-4 py-3.5 font-semibold transition-all"
                >
                  <span className="text-2xl leading-none">🔷</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">Paytm</p>
                    <p className="text-xs opacity-75">
                      {formatRupees(totalToPay)} → {payerUpiId}
                    </p>
                  </div>
                  <span className="text-white/50 text-xl font-light">›</span>
                </button>

                {/* Generic UPI */}
                <button
                  onClick={() => handlePayNow('upi')}
                  className="w-full flex items-center gap-3 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] rounded-xl px-4 py-3.5 font-semibold transition-all"
                >
                  <span className="text-2xl leading-none">📱</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-800">Other UPI App</p>
                    <p className="text-xs text-gray-500">Opens your default UPI app</p>
                  </div>
                  <span className="text-gray-300 text-xl font-light">›</span>
                </button>

                <button
                  onClick={() => setShowApps(false)}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
                >
                  ← Back
                </button>
              </div>
            )}
          </>
        )}

        {/* ── DESKTOP: instructions + copy ── */}
        {!mobile && (
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Monitor size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">Pay from your phone</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  UPI apps only work on mobile. On your phone:
                </p>
              </div>
            </div>
            <ol className="text-xs text-blue-800 space-y-1.5 pl-5 list-decimal">
              <li>Scan the QR code above, <strong>or</strong></li>
              <li>
                Open PhonePe / GPay → Send money →{' '}
                <span className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">
                  {payerUpiId}
                </span>
              </li>
              <li>Enter amount: <strong>{formatRupees(totalToPay)}</strong></li>
            </ol>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-xl py-2 text-xs font-medium transition-colors"
            >
              {copiedLink
                ? <><Check size={13} className="text-green-500" /> Copied! Paste in your phone's browser</>
                : <><Copy size={13} /> Copy UPI payment link</>}
            </button>
          </div>
        )}

        {/* ── Done I Paid (manual fallback) + Pay Later ── */}
        {payState !== 'launched' && (
          <div className="space-y-2 pt-1">
            {/* Partial payment toggle */}
            {!showPartial ? (
              <button onClick={() => setShowPartial(true)}
                className="w-full text-xs font-semibold py-2 rounded-xl border transition-colors"
                style={{ borderColor: '#E5E5E3', color: '#6B7280', background: '#F7F7F5' }}>
                Pay partial amount
              </button>
            ) : (
              <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: '#E5E5E3', background: '#F7F7F5' }}>
                <p className="text-xs font-semibold" style={{ color: '#1C1C1E' }}>
                  Partial payment (remaining: {formatRupees(remaining)})
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: '#6B7280' }}>₹</span>
                    <input type="number" value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      placeholder="0" min="1" step="0.01"
                      className="w-full border rounded-xl pl-7 pr-3 py-2 text-sm focus:outline-none input-focus"
                      style={{ borderColor: '#E5E5E3' }} />
                  </div>
                  <button onClick={handlePartialPay} disabled={partialLoading}
                    className="px-3 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                    style={{ background: '#27AE78' }}>
                    {partialLoading
                      ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                      : 'Record'}
                  </button>
                  <button onClick={() => { setShowPartial(false); setPartialAmount(''); setPartialError(''); }}
                    className="px-3 py-2 rounded-xl text-sm border transition-colors"
                    style={{ borderColor: '#E5E5E3', color: '#6B7280' }}>
                    ✕
                  </button>
                </div>
                {partialError && <p className="text-xs" style={{ color: '#CC4A12' }}>{partialError}</p>}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleMarkPaid}
                disabled={marking}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] disabled:opacity-60 text-white rounded-xl py-3 text-sm font-semibold transition-all"
                aria-label="Mark as paid"
              >
                {marking
                  ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  : <><Check size={15} /> Done, I Paid</>}
              </button>

              {onPayLater && (
                <button
                  onClick={() => onPayLater(splitId)}
                  className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 hover:bg-gray-50 active:scale-[0.98] rounded-xl px-4 py-3 text-sm font-medium transition-all"
                  aria-label="Pay later"
                >
                  <Clock size={14} />
                  Later
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
