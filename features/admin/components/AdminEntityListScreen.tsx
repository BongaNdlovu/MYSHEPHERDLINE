import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AppHeader } from '@/components/ui/AppHeader';
import { PaginatedFlatList } from '@/components/ui/PaginatedFlatList';
import { QueryRefreshFeedback } from '@/components/ui/QueryRefreshFeedback';
import { QueryStateView } from '@/components/ui/QueryStateView';
import { colors } from '@/constants/theme';
import { adminListStyles as styles } from '@/features/admin/components/adminFormStyles';
import { isInitialLoad, queryDisplayError, type PaginatedQueryState } from '@/lib/core/query-types';

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
  getItemRoute,
  getItemTestId,
}: AdminEntityListScreenProps<T>) {
  const { data, loading, error, refresh, loadMore, hasMore, loadingMore } = query;
  const initialLoad = isInitialLoad(loading, data.length);

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
            <View style={styles.topBar}>
              <Pressable onPress={() => router.back()} style={styles.back}>
                <Feather name="chevron-left" size={24} color={colors.primary} />
              </Pressable>
              <AppHeader title={title} subtitle={subtitle} />
            </View>
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
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            testID={getItemTestId(item)}
            onPress={() => router.push(getItemRoute(item))}
          >
            <Text style={styles.name}>{getItemName(item)}</Text>
            <Text style={styles.meta}>{getItemMeta(item)}</Text>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      />
    </View>
  );
}
