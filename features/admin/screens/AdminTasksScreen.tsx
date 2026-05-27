import { testIds } from '@/constants/testIds';
import { AdminEntityListScreen } from '@/features/admin/components/AdminEntityListScreen';
import { useTasks } from '@/features/tasks';

export default function AdminTasksScreen() {
  const query = useTasks();

  return (
    <AdminEntityListScreen
      screenTestId={testIds.admin.tasks.screen}
      title="Tasks"
      subtitle="Create, assign, and close shepherding tasks"
      addLabel="Add task"
      addTestId={testIds.admin.tasks.add}
      addRoute="/admin/tasks/new"
      query={query}
      getItemName={(task) => task.title}
      getItemMeta={(task) =>
        `${task.status} · ${task.priority} priority${task.due_date ? ` · due ${task.due_date}` : ''}`
      }
      getItemRoute={(task) => `/admin/tasks/${task.id}`}
      getItemTestId={(task) => testIds.admin.tasks.item(task.id)}
    />
  );
}
