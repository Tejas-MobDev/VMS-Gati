/**
 * MIGRATION NOTE:
 * Angular: pendingsalesorder.page.ts + pendingsalesorder.page.html
 * React Native: Same pattern as TodaySalesOrder — useFocusEffect + FlatList cards.
 *
 * API: LastFewDaysPending_GoodsDispatchForRM
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
} from 'react-native';
import { CardListSkeleton } from '../../components/CardListSkeleton';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { LastFewDaysPending_GoodsDispatchForRM } from '../../services/api';
import type { SalesOrderItem } from '../../types/api';
import { dateTimeSplit } from '../../utils/formatters';
import HelperService from '../../utils/helpers';

const PendingSalesOrderScreen = () => {
  const { sessionToken, selectedVendorId, selectedRMId } = useAppContext();
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!sessionToken) {
        return;
      }
      setIsLoading(true);
      LastFewDaysPending_GoodsDispatchForRM(
        sessionToken,
        selectedVendorId,
        selectedRMId,
      )
        .then(res => {
          if (res.IsSuccess) {
            setOrders(res.Data);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, selectedVendorId, selectedRMId]),
  );

  const renderItem = ({ item }: { item: SalesOrderItem }) => (
    <View style={styles.card}>
      <Text style={styles.vendorName}>{item.InternalVendorName}</Text>
      <Text style={styles.detail}>
        Purchase order on: {dateTimeSplit(item.CreatedOn)}
      </Text>
      <Text style={styles.detail}>
        {item.ProductName}, {item.ColorName}
      </Text>
      <Text style={styles.detail}>Purchase Type: {item.TypeName}</Text>
      <Text style={styles.detail}>Sales order price: {item.TotalAmt}</Text>
      <Text style={styles.detail}>Aging: {item.Aging}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <CardListSkeleton showCountBadge detailLines={5} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          ListHeaderComponent={
            <View style={styles.countBadge}>
              <Text style={styles.countText}>Total: {orders.length}</Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No pending orders.</Text>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { padding: 12 },
  countBadge: {
    backgroundColor: '#3880ff',
    alignSelf: 'flex-end',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 10,
  },
  countText: { color: '#fff', fontWeight: '700' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  vendorName: {
    fontWeight: '700',
    fontSize: 15,
    color: '#222',
    marginBottom: 6,
  },
  detail: { fontSize: 13, color: '#555', marginBottom: 3 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default PendingSalesOrderScreen;
