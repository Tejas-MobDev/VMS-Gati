import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton } from './Skeleton';

type DocGridSkeletonProps = {
  itemCount?: number;
  contentStyle?: ViewStyle;
};

export function DocGridSkeleton({
  itemCount = 4,
  contentStyle,
}: DocGridSkeletonProps) {
  const rows = Math.ceil(itemCount / 2);

  return (
    <View style={[styles.container, contentStyle]}>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {[0, 1].map(colIndex => {
            const itemIndex = rowIndex * 2 + colIndex;
            if (itemIndex >= itemCount) {
              return <View key={colIndex} style={styles.placeholder} />;
            }

            return (
              <View key={colIndex} style={styles.docItem}>
                <Skeleton width="100%" height={120} borderRadius={6} />
                <Skeleton
                  width="80%"
                  height={10}
                  borderRadius={4}
                  style={styles.docLabel}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  docItem: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  docLabel: {
    marginTop: 8,
  },
  placeholder: {
    width: '48%',
  },
});
