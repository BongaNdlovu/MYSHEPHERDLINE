import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { Member, Task, Visit } from '@/types/database';
import { demoMembers, demoTasks } from '@/lib/demo-data';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>(demoMembers);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('members').select('*').order('full_name');
    if (!error && data?.length) setMembers(data as Member[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { members, loading, refresh };
}

export function useMember(id: string | undefined) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const demo = demoMembers.find((item) => item.id === id) ?? null;
    setMember(demo);
    void supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setMember(data as Member);
        setLoading(false);
      });
  }, [id]);

  return { member, loading };
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(demoTasks);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').order('due_date');
    if (!error && data?.length) setTasks(data as Task[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleTask = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'open' : 'completed';
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? { ...item, status: nextStatus } : item)),
    );
    await supabase.from('tasks').update({ status: nextStatus }).eq('id', task.id);
  };

  return { tasks, loading, refresh, toggleTask };
}

export async function createVisit(input: {
  memberId: string;
  userId: string;
  visitType: Visit['visit_type'];
  notes: string;
  followUpRequired: boolean;
}) {
  const payload = {
    member_id: input.memberId,
    logged_by: input.userId,
    visit_type: input.visitType,
    notes: input.notes,
    follow_up_required: input.followUpRequired,
    visited_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('visits').insert(payload);
  if (!error) {
    await supabase
      .from('members')
      .update({ last_contact_at: payload.visited_at })
      .eq('id', input.memberId);
  }
  return error?.message ?? null;
}

export function filterMembers(
  members: Member[],
  query: string,
  filter: 'all' | 'risk' | 'inactive' | 'new',
) {
  const lower = query.trim().toLowerCase();
  return members.filter((member) => {
    const matchesQuery =
      !lower ||
      member.full_name.toLowerCase().includes(lower) ||
      (member.phone ?? '').toLowerCase().includes(lower);
    if (!matchesQuery) return false;

    if (filter === 'all') return true;
    if (filter === 'risk') return member.risk_level === 'high';
    if (filter === 'inactive') return member.status === 'inactive';
    if (filter === 'new') return member.status === 'new';
    return true;
  });
}

export function membersNeedingAttention(members: Member[]) {
  return members.filter(
    (member) => member.risk_level === 'high' || member.status === 'inactive' || member.status === 'new',
  );
}

export function buildLocalReportSummary(members: Member[], tasks: Task[]) {
  const openTasks = tasks.filter((task) => task.status === 'open').length;
  const attention = membersNeedingAttention(members).length;
  return {
    membersNeedingAttention: attention,
    visitsCompleted: 24,
    tasksOpen: openTasks,
    recentActivityDays: 7,
    visitBreakdown: {
      visits: 12,
      calls: 18,
      bibleStudies: 6,
      newConverts: 3,
    },
  };
}
