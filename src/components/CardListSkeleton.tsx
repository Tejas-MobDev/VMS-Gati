import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

type CardListSkeletonProps = {
  rowCount?: number;
  detailLines?: number;
  showCountBadge?: boolean;
  showActionButton?: boolean;
  contentStyle?: ViewStyle;
};

export function CardListSkeleton({
  rowCount = 6,
  detailLines = 5,
  showCountBadge = false,
  showActionButton = false,
  contentStyle,
}: CardListSkeletonProps) {
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
        <View key={index} style={styles.card}>
          <Skeleton width="55%" height={16} borderRadius={4} />
          {Array.from({ length: detailLines }, (_, lineIndex) => (
            <Skeleton
              key={lineIndex}
              width={lineIndex % 2 === 0 ? '92%' : '78%'}
              height={12}
              borderRadius={4}
              style={styles.detailLine}
            />
          ))}
          {showActionButton && (
            <Skeleton
              width={120}
              height={34}
              borderRadius={6}
              style={styles.actionButton}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
  },
  countBadge: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  detailLine: {
    marginTop: 8,
  },
  actionButton: {
    marginTop: 12,
  },
});
