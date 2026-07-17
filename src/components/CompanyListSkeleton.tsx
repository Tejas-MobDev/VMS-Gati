import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

type CompanyListSkeletonProps = {
  rowCount?: number;
  contentStyle?: ViewStyle;
};

export function CompanyListSkeleton({
  rowCount = 8,
  contentStyle,
}: CompanyListSkeletonProps) {
  return (
    <View style={[styles.container, contentStyle]}>
      <Skeleton width="45%" height={18} borderRadius={4} style={styles.vendorLabel} />
      {Array.from({ length: rowCount }, (_, index) => (
        <View key={index} style={styles.item}>
          <Skeleton width="62%" height={16} borderRadius={4} />
          <Skeleton width={48} height={24} borderRadius={12} />
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
  vendorLabel: {
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    elevation: 1,
  },
});
