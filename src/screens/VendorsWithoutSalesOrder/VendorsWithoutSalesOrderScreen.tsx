/**
 * MIGRATION NOTE:
 * Angular: vendors-without-sales-order.page.ts + .html
 * React Native: Simple FlatList of vendor names.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { VendorWithoutSalesOrderForRM } from '../../services/api';
import type { VendorWithoutSalesOrderItem } from '../../types/api';
import HelperService from '../../utils/helpers';

const VendorsWithoutSalesOrderScreen = () => {
  const { sessionToken, selectedRMId } = useAppContext();
  const [vendors, setVendors] = useState<VendorWithoutSalesOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // const selectedRMId = 670;
  useFocusEffect(
    useCallback(() => {
      if (!sessionToken) {
        return;
      }
      setIsLoading(true);
      console.log('selected RM ; ', selectedRMId);
      VendorWithoutSalesOrderForRM(sessionToken, selectedRMId)
        .then(res => {
          if (res.IsSuccess) {
            setVendors(res.Data);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, selectedRMId]),
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#3880ff" />
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.VendorName}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No vendors without sales orders.
            </Text>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, marginTop: 40 },
  list: { padding: 12 },
  item: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    elevation: 1,
  },
  itemText: { fontSize: 15, color: '#222' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default VendorsWithoutSalesOrderScreen;
