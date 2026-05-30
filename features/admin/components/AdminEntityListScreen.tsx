import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { PaginatedFlatList } from '@/components/ui/PaginatedFlatList';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { colors } from '@/constants/theme';
import { adminListStyles as styles } from '@/features/admin/components/adminFormStyles';
import { isInitialLoad, queryDisplayError, type PaginatedQueryState } from '@/lib/core/query-types';
import type { ComponentProps } from 'react';

type BadgeTone = ComponentProps<typeof StatusBadge>['tone'];

type ListBadge = { label: string; tone?: BadgeTone };

type AdminEntityListScreenProps<T extends { id: string }> = {
  screenTestId: string;
  title: string;
  subtitle: string;
  addLabel: string;
  addTestId: string;
  addRoute: Href;
  query: PaginatedQueryState<T>;
  getItemName: (item: T) => string;
  getItemMeta: (item: T) => string;
  getItemBadges?: (item: T) => readonly ListBadge[];
  getItemRoute: (item: T) => Href;
  getItemTestId: (item: T) => string;
};

export function AdminEntityListScreen<T extends { id: string }>({
  screenTestId,
  title,
  subtitle,
  addLabel,
  addTestId,
  addRoute,
  query,
  getItemName,
  getItemMeta,
  getItemBadges,
  getItemRoute,
  getItemTestId,
}: AdminEntityListScreenProps<T>) {
  const { data, loading, error, refresh, loadMore, hasMore, loadingMore } = query;
  const initialLoad = isInitialLoad(loading, data.length);
  const backButton = (
    <Pressable onPress={() => router.back()} style={styles.headerIcon} accessibilityRole="button">
      <Feather name="chevron-left" size={24} color={colors.white} />
    </Pressable>
  );

  return (
    <View style={styles.screen} testID={screenTestId}>
      <PaginatedFlatList
        data={data}
        keyExtractor={(item) => item.id}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={() => void loadMore()}
        ListHeaderComponent={
          <>
            <AppHeader title={title} subtitle={subtitle} leftIcon={backButton} />
            <Pressable
              style={styles.addButton}
              testID={addTestId}
              onPress={() => router.push(addRoute)}
            >
              <Feather name="plus" size={18} color={colors.white} />
              <Text style={styles.addText}>{addLabel}</Text>
            </Pressable>
            <QueryStateView
              loading={initialLoad}
              error={queryDisplayError(error, data.length)}
              onRetry={() => void refresh()}
            />
            <QueryRefreshFeedback
              loading={loading}
              error={error}
              dataLength={data.length}
              refreshingLabel="Refreshing…"
              staleErrorLabel="Could not refresh. Showing last loaded data."
            />
          </>
        }
        renderItem={({ item }) => {
          const badges = getItemBadges?.(item) ?? [];
          return (
            <Pressable
              style={styles.row}
              testID={getItemTestId(item)}
              onPress={() => router.push(getItemRoute(item))}
            >
              <View style={styles.rowBody}>
                <Text style={styles.name}>{getItemName(item)}</Text>
                <Text style={styles.meta}>{getItemMeta(item)}</Text>
                {badges.length > 0 ? (
                  <View style={styles.badges}>
                    {badges.map((badge) => (
                      <StatusBadge key={badge.label} label={badge.label} tone={badge.tone ?? 'neutral'} />
                    ))}
                  </View>
                ) : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}
