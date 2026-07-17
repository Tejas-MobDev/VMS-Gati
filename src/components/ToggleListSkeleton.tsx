import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

type ToggleListSkeletonProps = {
  rowCount?: number;
  detailLines?: number;
  showCountBadge?: boolean;
  contentStyle?: ViewStyle;
};

export function ToggleListSkeleton({
  rowCount = 6,
  detailLines = 4,
  showCountBadge = false,
  contentStyle,
}: ToggleListSkeletonProps) {
  return (
    <View style={[styles.container, contentStyle]}>
      {showCountBadge && (
        <Skeleton
          width={90}
          height={28}
          borderRadius={8}
          style={styles.countBadge}
        />
      )}
      {Array.from({ length: rowCount }, (_, index) => (
        <View key={index} style={styles.item}>
          <View style={styles.itemContent}>
            <Skeleton width="60%" height={16} borderRadius={4} />
            {Array.from({ length: detailLines }, (_, lineIndex) => (
              <Skeleton
                key={lineIndex}
                width={lineIndex % 2 === 0 ? '88%' : '72%'}
                height={12}
                borderRadius={4}
                style={styles.detailLine}
              />
            ))}
          </View>
          <Skeleton width={48} height={28} borderRadius={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  countBadge: {
    alignSelf: 'flex-end',
    marginVertical: 10,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  detailLine: {
    marginTop: 8,
  },
});
