import { useState, useCallback } from 'react';
import { expensesApi } from '../utils/api';

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await expensesApi.list({ page, limit: 20 });
      const { expenses: data, pagination: pg } = res.data;
      if (page === 1) {
        setExpenses(data);
      } else {
        // Deduplicate when appending pages
        setExpenses((prev) => {
          const existingIds = new Set(prev.map((e) => e.id));
          const newItems = data.filter((e) => !existingIds.has(e.id));
          return [...prev, ...newItems];
        });
      }
      setPagination(pg);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalances = useCallback(async () => {
    try {
      const res = await expensesApi.balances();
      setBalances(res.data.balances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, []);

  const addExpense = useCallback(async (data) => {
    const res = await expensesApi.add(data);
    const { expense, splits } = res.data;
    // Deduplicate: only prepend if not already in list (Socket.io may have added it)
    setExpenses((prev) => {
      if (prev.find((e) => e.id === expense.id)) return prev;
      return [{ ...expense }, ...prev];
    });
    return { expense, splits };
  }, []);

  const markSplitPaid = useCallback(async (splitId) => {
    const res = await expensesApi.markPaid(splitId);
    return res.data;
  }, []);

  const removeExpense = useCallback((expenseId) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  }, []);

  // Called by Socket.io event handlers
  const onExpenseAdded = useCallback((data) => {
    setExpenses((prev) => {
      const exists = prev.find((e) => e.id === data.expense.id);
      if (exists) return prev;
      return [data.expense, ...prev];
    });
  }, []);

  const onSplitPaid = useCallback((data) => {
    // Trigger balance refresh
    fetchBalances();
  }, [fetchBalances]);

  const onBalanceUpdated = useCallback((data) => {
    setBalances((prev) =>
      prev.map((b) =>
        b.memberId === data.memberId ? { ...b, ...data.newBalance } : b
      )
    );
  }, []);

  return {
    expenses,
    balances,
    pagination,
    loading,
    error,
    fetchExpenses,
    fetchBalances,
    addExpense,
    markSplitPaid,
    removeExpense,
    onExpenseAdded,
    onSplitPaid,
    onBalanceUpdated,
  };
}
