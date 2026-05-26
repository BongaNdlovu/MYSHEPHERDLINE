import { FlatList, type FlatListProps, ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';

type PaginatedFlatListProps<T> = FlatListProps<T> & {
  loadingMore?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
};

export function PaginatedFlatList<T>({
  loadingMore,
  onLoadMore,
  hasMore,
  onEndReached,
  onEndReachedThreshold = 0.4,
  ListFooterComponent,
  ...rest
}: PaginatedFlatListProps<T>) {
  return (
    <FlatList
      {...rest}
      onEndReached={(info) => {
        if (hasMore && onLoadMore) onLoadMore();
        onEndReached?.(info);
      }}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={
        loadingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          ListFooterComponent ?? null
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: { paddingVertical: spacing.lg, alignItems: 'center' },
});
