import Feather from '@expo/vector-icons/Feather';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/ui/FormField';
import { InlineError } from '@/components/ui/InlineError';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { testIds } from '@/constants/testIds';
import { colors, radii, spacing } from '@/constants/theme';
import {
  createTask,
  deleteTask,
  fetchTasks,
  updateTask,
  type TaskInput,
} from '@/features/tasks/services/tasks.service';
import { createAppError } from '@/lib/core/errors';
import { useToast } from '@/lib/core/toast';
import type { TaskPriority, TaskStatus } from '@/types/database';

const priorities: TaskPriority[] = ['low', 'medium', 'high'];
const statuses: TaskStatus[] = ['open', 'completed', 'cancelled'];

export default function AdminTaskFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<ReturnType<typeof createAppError> | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('open');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    void fetchTasks()
      .then((tasks) => {
        const found = tasks.find((t) => t.id === id) ?? null;
        if (!found) {
          setLoadError(createAppError('not_found', 'Task not found.'));
          return;
        }
        setTitle(found.title);
        setDescription(found.description ?? '');
        setDueDate(found.due_date ?? '');
        setPriority(found.priority);
        setStatus(found.status);
      })
      .catch(() => setLoadError(createAppError('server', 'Unable to load task.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (isEdit && loading) {
    return (
      <View style={styles.centered}>
        <QueryStateView loading={loading} error={loadError} />
      </View>
    );
  }

  const input = (): TaskInput => ({
    title,
    description,
    due_date: dueDate || null,
    priority,
    status,
  });

  const save = async () => {
    if (!title.trim()) {
      setSubmitError('Title is required.');
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
      router.back();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unable to save task.');
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
      setSubmitError(err instanceof Error ? err.message : 'Unable to delete task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} testID={testIds.admin.tasks.form}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Feather name="chevron-left" size={24} color={colors.primary} />
      </Pressable>
      <Text style={styles.heading}>{isEdit ? 'Edit task' : 'New task'}</Text>

      <FormField label="Title" value={title} onChangeText={setTitle} />
      <FormField label="Description" value={description} onChangeText={setDescription} multiline />
      <FormField
        label="Due date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
        placeholder="2026-05-30"
      />

      <Text style={styles.section}>Priority</Text>
      <View style={styles.chips}>
        {priorities.map((value) => (
          <Pressable
            key={value}
            style={[styles.chip, priority === value && styles.chipActive]}
            onPress={() => setPriority(value)}
          >
            <Text style={styles.chipText}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Status</Text>
      <View style={styles.chips}>
        {statuses.map((value) => (
          <Pressable
            key={value}
            style={[styles.chip, status === value && styles.chipActive]}
            onPress={() => setStatus(value)}
          >
            <Text style={styles.chipText}>{value}</Text>
          </Pressable>
        ))}
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  centered: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  back: { marginBottom: spacing.md },
  heading: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: spacing.lg },
  section: { fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: '#ecfdf5' },
  chipText: { fontWeight: '600', color: colors.primary, textTransform: 'capitalize' },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontWeight: '700' },
  danger: { marginTop: spacing.md, alignItems: 'center', paddingVertical: spacing.md },
  dangerText: { color: colors.accent, fontWeight: '700' },
});
