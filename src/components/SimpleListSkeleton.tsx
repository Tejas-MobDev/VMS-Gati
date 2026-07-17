import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

type SimpleListSkeletonProps = {
  rowCount?: number;
  contentStyle?: ViewStyle;
};

export function SimpleListSkeleton({
  rowCount = 8,
  contentStyle,
}: SimpleListSkeletonProps) {
  return (
    <View style={[styles.container, contentStyle]}>
      {Array.from({ length: rowCount }, (_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton width="72%" height={16} borderRadius={4} />
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
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    elevation: 1,
  },
});
