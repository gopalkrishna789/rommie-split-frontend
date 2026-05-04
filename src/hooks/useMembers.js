import { useState, useCallback } from 'react';
import { membersApi } from '../utils/api';

export function useMembers() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await membersApi.list();
      setMembers(res.data.members);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (data) => {
    const res = await membersApi.add(data);
    const { member } = res.data;
    setMembers((prev) => [...prev, member]);
    return member;
  }, []);

  const updateMember = useCallback(async (id, data) => {
    const res = await membersApi.update(id, data);
    const { member } = res.data;
    setMembers((prev) => prev.map((m) => (m.id === id ? member : m)));
    return member;
  }, []);

  const getMemberById = useCallback(
    (id) => members.find((m) => m.id === id) || null,
    [members]
  );

  return {
    members,
    loading,
    error,
    fetchMembers,
    addMember,
    updateMember,
    getMemberById,
  };
}
