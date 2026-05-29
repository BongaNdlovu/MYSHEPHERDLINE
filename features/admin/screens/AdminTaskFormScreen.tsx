import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { FormField } from '@/components/ui/FormField';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { testIds } from '@/constants/testIds';
import { AdminEntityFormScreen } from '@/features/admin/components/AdminEntityFormScreen';
import { ChoiceChipGroup } from '@/features/admin/components/ChoiceChipGroup';
import { useAdminEditForm } from '@/features/admin/hooks/useAdminEditForm';
import { useAdminFormActions } from '@/features/admin/hooks/useAdminFormActions';
import { useAdminProfiles } from '@/features/admin/hooks/useAdminProfiles';
import {
  createTask,
  deleteTask,
  updateTask,
  useTask,
  type TaskInput,
} from '@/features/tasks';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { useToast } from '@/lib/core/toast';
import { validateDueAt, validateDueDate } from '@/lib/core/validation';
import type { Task, TaskPriority, TaskStatus } from '@/types/database';

function goBackOrTasksList() {
  if (router.canGoBack()) router.back();
  else router.replace('/admin/tasks');
}

const priorities: TaskPriority[] = ['low', 'medium', 'high'];
const statuses: TaskStatus[] = ['open', 'completed', 'cancelled'];

export default function AdminTaskFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { data: task, loading, error, refresh } = useTask(id);
  const { data: profiles, loading: profilesLoading } = useAdminProfiles();
  const { showToast } = useToast();

  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [dueDateError, setDueDateError] = useState<string | undefined>();
  const [dueAtError, setDueAtError] = useState<string | undefined>();

  const hydrate = useCallback((next: Task) => {
    setTitle(next.title);
    setDescription(next.description ?? '');
    setDueDate(next.due_date ?? '');
    setDueAt(next.due_at ? new Date(next.due_at).toISOString().slice(0, 16) : '');
    setPriority(next.priority);
    setStatus(next.status);
    setAssigneeId(next.assignee_id);
  }, []);

  const { formReady, retryLoad } = useAdminEditForm({
    isEdit,
    entity: task,
    loading,
    error,
    refresh,
    hydrate,
  });

  const { saving, submitError, setSubmitError, runSave, runRemove } = useAdminFormActions({
    saveFallbackMessage: 'Unable to save task.',
    removeFallbackMessage: 'Unable to delete task.',
  });

  useAndroidBackNavigation(goBackOrTasksList);

  const input = (): TaskInput => ({
    title,
    description,
    due_date: dueDate || null,
    due_at: dueAt.trim() ? new Date(dueAt.trim()).toISOString() : null,
    priority,
    status,
    assignee_id: assigneeId,
  });

  const save = () => {
    if (!title.trim()) {
      setSubmitError('Title is required.');
      return;
    }
    const dueDateValidation = validateDueDate(dueDate);
    const dueAtValidation = validateDueAt(dueAt);
    setDueDateError(dueDateValidation);
    setDueAtError(dueAtValidation);
    if (dueDateValidation || dueAtValidation) {
      setSubmitError(dueDateValidation ?? dueAtValidation ?? 'Invalid due date/time.');
      return;
    }

    void runSave(async () => {
      if (isEdit && id) {
        await updateTask(id, input());
        showToast('Task updated.');
      } else {
        await createTask(input());
        showToast('Task created.');
      }
      goBackOrTasksList();
    });
  };

  const remove = () => {
    if (!id) return;
    void runRemove(
      () => deleteTask(id),
      'Task removed.',
      () => router.replace('/admin/tasks'),
    );
  };

  return (
    <AdminEntityFormScreen
      formTestId={testIds.admin.tasks.form}
      editTitle="Edit task"
      createTitle="New task"
      isEdit={isEdit}
      formReady={formReady}
      loading={loading}
      error={error}
      onRetryLoad={retryLoad}
      onBack={goBackOrTasksList}
      profiles={profiles}
      profilesLoading={profilesLoading}
      assigneeId={assigneeId}
      onAssigneeSelect={setAssigneeId}
      assignShepherdTestId={testIds.admin.tasks.assignShepherd}
      saveTestId={testIds.admin.tasks.save}
      saveLabel="Save task"
      deleteLabel="Delete task"
      deleteConfirmTitle="Delete task?"
      deleteConfirmMessage="This permanently removes the follow-up task. This cannot be undone."
      saving={saving}
      submitError={submitError}
      onSave={save}
      onDelete={isEdit ? remove : undefined}
    >
      <SectionHeader title="Task" />
      <FormField label="Title" value={title} onChangeText={setTitle} />
      <FormField label="Description" value={description} onChangeText={setDescription} multiline />
      <SectionHeader title="Schedule" />
      <FormField
        label="Due date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={(value) => {
          setDueDate(value);
          setDueDateError(undefined);
        }}
        error={dueDateError}
        placeholder="2026-05-30"
      />
      <FormField
        label="Due at (for reminders, YYYY-MM-DDTHH:mm)"
        value={dueAt}
        onChangeText={(value) => {
          setDueAt(value);
          setDueAtError(undefined);
        }}
        error={dueAtError}
        placeholder="2026-05-30T14:00"
      />
      <SectionHeader title="Status" />
      <ChoiceChipGroup label="Priority" options={priorities} value={priority} onChange={setPriority} />
      <ChoiceChipGroup label="Status" options={statuses} value={status} onChange={setStatus} />
    </AdminEntityFormScreen>
  );
}
