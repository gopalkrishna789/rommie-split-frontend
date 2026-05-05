/**
 * Client-side split calculation utilities
 * Mirror of server-side logic for optimistic UI updates
 */

/**
 * Calculate equal split per member
 * @param {number} totalPaise - total amount in paise
 * @param {number} memberCount
 * @returns {number} per-share in paise (rounded)
 */
export function calcPerShare(totalPaise, memberCount) {
  if (memberCount <= 0) return 0;
  return Math.round(totalPaise / memberCount);
}

/**
 * Get net balance summary for a member from balances array
 * @param {string} memberId
 * @param {object[]} balances
 * @returns {{ totalOwed, totalOwedTo, netBalance } | null}
 */
export function getMemberBalance(memberId, balances) {
  return balances.find((b) => b.memberId === memberId) || null;
}

/**
 * Calculate total group spending from expenses
 * @param {object[]} expenses
 * @returns {number} total in paise
 */
export function calcGroupTotal(expenses) {
  return expenses.reduce((sum, e) => sum + (e.total_amount || 0), 0);
}

/**
 * Get the current month's expenses
 * @param {object[]} expenses
 * @returns {object[]}
 */
export function thisMonthExpenses(expenses) {
  const now = new Date();
  return expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
}

/**
 * Sort members by who owes the most (descending)
 */
export function sortByDebt(balances) {
  return [...balances].sort((a, b) => a.netBalance - b.netBalance);
}
