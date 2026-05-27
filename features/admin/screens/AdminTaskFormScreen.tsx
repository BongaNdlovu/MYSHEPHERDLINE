import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { FormScreen } from '@/components/ui/FormScreen';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors } from '@/constants/theme';
import { adminFormStyles as styles } from '@/features/admin/components/adminFormStyles';
import { ChoiceChipGroup } from '@/features/admin/components/ChoiceChipGroup';
import { ShepherdPicker } from '@/features/admin/components/ShepherdPicker';
import { useAdminProfiles } from '@/features/admin/hooks/useAdminProfiles';
import {
  createTask,
  deleteTask,
  updateTask,
  useTask,
  type TaskInput,
} from '@/features/tasks';
import { useAndroidBackNavigation } from '@/lib/app-shell';
import { getUserMessage, toAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import { validateDueDate } from '@/lib/core/validation';
import type { TaskPriority, TaskStatus } from '@/types/database';

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
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [dueDateError, setDueDateError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formReady, setFormReady] = useState(!isEdit);
  const formInitializedRef = useRef(false);
  useAndroidBackNavigation(goBackOrTasksList);

  useEffect(() => {
    if (!isEdit || !task || formInitializedRef.current) return;
    setTitle(task.title);
    setDescription(task.description ?? '');
    setDueDate(task.due_date ?? '');
    setPriority(task.priority);
    setStatus(task.status);
    setAssigneeId(task.assignee_id);
    formInitializedRef.current = true;
    setFormReady(true);
  }, [isEdit, task]);

  const retryLoad = useCallback(() => {
    formInitializedRef.current = false;
    setFormReady(false);
    void refresh();
  }, [refresh]);

  if (isEdit && !formReady) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading={loading} error={error} onRetry={retryLoad} />
      </View>
    );
  }

  const input = (): TaskInput => ({
    title,
    description,
    due_date: dueDate || null,
    priority,
    status,
    assignee_id: assigneeId,
  });

  const save = async () => {
    if (!title.trim()) {
      setSubmitError('Title is required.');
      return;
    }
    const dueDateValidation = validateDueDate(dueDate);
    setDueDateError(dueDateValidation);
    if (dueDateValidation) {
      setSubmitError(dueDateValidation);
      return;
    }
    if (!assigneeId) {
      setSubmitError('Assign a shepherd before saving this task.');
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      if (isEdit && id) {
        await updateTask(id, input());
        showToast('Task updated.');
      } else {
        await createTask(input());
        showToast('Task created.');
      }
      goBackOrTasksList();
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to save task.')));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await deleteTask(id);
      showToast('Task removed.');
      router.replace('/admin/tasks');
    } catch (err) {
      setSubmitError(getUserMessage(toAppError(err, 'Unable to delete task.')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen style={styles.screen} contentContainerStyle={styles.formContent} testID={testIds.admin.tasks.form}>
      <Pressable onPress={goBackOrTasksList} style={styles.back}>
        <Feather name="chevron-left" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.title}>{isEdit ? 'Edit task' : 'New task'}</Text>

      <FormField label="Title" value={title} onChangeText={setTitle} />
      <FormField label="Description" value={description} onChangeText={setDescription} multiline />
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

      <ShepherdPicker
        profiles={profiles}
        loading={profilesLoading}
        selectedId={assigneeId}
        onSelect={setAssigneeId}
        getTestId={testIds.admin.tasks.assignShepherd}
      />

      <ChoiceChipGroup label="Priority" options={priorities} value={priority} onChange={setPriority} />
      <ChoiceChipGroup label="Status" options={statuses} value={status} onChange={setStatus} />

      {submitError ? <InlineError message={submitError} /> : null}

      <Pressable
        style={styles.primary}
        disabled={saving}
        testID={testIds.admin.tasks.save}
        onPress={() => void save()}
      >
        <Text style={styles.primaryText}>{saving ? 'Saving…' : 'Save task'}</Text>
      </Pressable>

      {isEdit ? (
        <Pressable style={styles.danger} disabled={saving} onPress={() => void remove()}>
          <Text style={styles.dangerText}>Delete task</Text>
        </Pressable>
      ) : null}
    </FormScreen>
  );
}
