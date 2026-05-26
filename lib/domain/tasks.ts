import type { Task } from '@/types/database';

export function toDateKey(value: Date = new Date()) {
  return value.toISOString().slice(0, 10);
}

export function groupTasksByDueDate(tasks: Task[], todayKey = toDateKey()) {
  const openTasks = tasks.filter((task) => task.status === 'open');
  const today = openTasks.filter((task) => task.due_date === todayKey);
  const upcoming = openTasks.filter((task) => task.due_date !== todayKey);
  return { today, upcoming, openTasks };
}

export function buildWeekDayStrip(reference = new Date()) {
  const start = new Date(reference);
  start.setDate(reference.getDate() - reference.getDay() + 1);
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return labels.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      label,
      dayNumber: date.getDate(),
      dateKey: toDateKey(date),
      isToday: toDateKey(date) === toDateKey(reference),
    };
  });
}
