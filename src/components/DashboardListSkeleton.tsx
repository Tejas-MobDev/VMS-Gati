import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';

const SKELETON_ROW_COUNT = 8;

export function DashboardListSkeleton() {
  return (
    <View style={styles.container}>
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <View key={index} style={styles.listItem}>
          <Skeleton width="68%" height={16} borderRadius={4} />
          <Skeleton width={40} height={24} borderRadius={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    elevation: 1,
  },
});
