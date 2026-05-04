/**
 * UPI Deep Link utilities
 *
 * CRITICAL RULE: UPI ID and name in every link = PAYER's.
 * Amount = debtor's share + carry-forward, in paise.
 *
 * HOW UPI DEEP LINKS WORK:
 *   Android browser  → window.location.href = "upi://pay?..." works fine
 *   Android PWA      → window.location.href is blocked by WebView
 *                       Use <a href="..."> .click() instead — bypasses restriction
 *   iOS              → upi:// not supported; use intent:// or just show QR
 *   Desktop          → No UPI apps installed; show QR + copy UPI ID
 */

export function buildUpiLink(payer, amountPaise, purpose) {
  const upiId = payer.upi_id || payer.upiId;
  const am = (amountPaise / 100).toFixed(2);
  const tn = encodeURIComponent(`RoomieSplit: ${purpose}`.slice(0, 50));
  const pn = encodeURIComponent(payer.name);
  return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export function buildPhonePeLink(payer, amountPaise, purpose) {
  const upiId = payer.upi_id || payer.upiId;
  const am = (amountPaise / 100).toFixed(2);
  const tn = encodeURIComponent(`RoomieSplit: ${purpose}`.slice(0, 50));
  const pn = encodeURIComponent(payer.name);
  return `phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export function buildGPayLink(payer, amountPaise, purpose) {
  const upiId = payer.upi_id || payer.upiId;
  const am = (amountPaise / 100).toFixed(2);
  const tn = encodeURIComponent(`RoomieSplit: ${purpose}`.slice(0, 50));
  const pn = encodeURIComponent(payer.name);
  return `gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

export function buildPaytmLink(payer, amountPaise, purpose) {
  const upiId = payer.upi_id || payer.upiId;
  const am = (amountPaise / 100).toFixed(2);
  const tn = encodeURIComponent(`RoomieSplit: ${purpose}`.slice(0, 50));
  const pn = encodeURIComponent(payer.name);
  return `paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
}

/**
 * Detect if running as installed PWA (standalone mode).
 * In standalone mode, window.location.href for custom schemes is blocked.
 */
export function isPWA() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true // iOS Safari
  );
}

/**
 * THE CORRECT WAY to launch a UPI deep link on Android.
 *
 * Uses a hidden <a> tag + programmatic .click() — this works in BOTH:
 *   ✅ Android Chrome browser
 *   ✅ Android PWA (standalone WebView)
 *   ✅ iOS Safari browser (for upi:// — limited support)
 *
 * window.location.href fails silently in PWA WebView for custom schemes.
 * The <a href> approach is the correct W3C-compliant method.
 */
export function launchUpiDeepLink(link) {
  const a = document.createElement('a');
  a.href = link;
  a.rel = 'noopener noreferrer';
  // Must be in DOM for Firefox/some WebViews
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Clean up after a tick
  setTimeout(() => {
    document.body.removeChild(a);
  }, 100);
}

/**
 * Launch a specific UPI app with payment pre-filled.
 * Works in browser AND PWA on Android.
 *
 * @param {'phonepe'|'gpay'|'paytm'|'upi'} app
 * @param {{ upi_id: string, name: string }} payer
 * @param {number} amountPaise
 * @param {string} purpose
 * @returns {string} the link that was launched
 */
export function launchUpiPayment(app, payer, amountPaise, purpose) {
  let link;
  switch (app) {
    case 'phonepe': link = buildPhonePeLink(payer, amountPaise, purpose); break;
    case 'gpay':    link = buildGPayLink(payer, amountPaise, purpose);    break;
    case 'paytm':   link = buildPaytmLink(payer, amountPaise, purpose);   break;
    default:        link = buildUpiLink(payer, amountPaise, purpose);     break;
  }
  launchUpiDeepLink(link);
  return link;
}

export function isMobile() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );
}

export function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

export function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function formatRupees(paise) {
  if (!paise || paise === 0) return '₹0';
  return `₹${(paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function rupeesToPaise(rupees) {
  return Math.round(parseFloat(rupees) * 100);
}
