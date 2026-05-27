import type { Task, TaskListRow } from '@/types/database';

type TaskLike = Task | TaskListRow;

function padDatePart(value: number) {
  return String(value).padStart(2, '0');
}

export function toDateKey(value: Date = new Date()) {
  return `${value.getFullYear()}-${padDatePart(value.getMonth() + 1)}-${padDatePart(value.getDate())}`;
}

export function normalizeDueDateKey(dueDate: string | null | undefined) {
  if (!dueDate) return null;
  return dueDate.slice(0, 10);
}

export function formatTaskDueDate(dueDate: string | null | undefined) {
  const key = normalizeDueDateKey(dueDate);
  if (!key) return null;

  const parsed = new Date(`${key}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return key;
  return parsed.toLocaleDateString();
}

export function groupTasksByDueDate(tasks: TaskLike[], todayKey = toDateKey()) {
  const openTasks = tasks.filter((task) => task.status === 'open');
  const today: TaskLike[] = [];
  const overdue: TaskLike[] = [];
  const upcoming: TaskLike[] = [];
  const unscheduled: TaskLike[] = [];

  for (const task of openTasks) {
    const dueKey = normalizeDueDateKey(task.due_date);
    if (!dueKey) {
      unscheduled.push(task);
      continue;
    }
    if (dueKey === todayKey) today.push(task);
    else if (dueKey < todayKey) overdue.push(task);
    else upcoming.push(task);
  }

  return { today, overdue, upcoming, unscheduled, openTasks };
}

export function buildWeekDayStrip(reference = new Date()) {
  const start = new Date(reference);
  const weekDay = reference.getDay();
  const mondayOffset = weekDay === 0 ? -6 : 1 - weekDay;
  start.setDate(reference.getDate() + mondayOffset);
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
