/**
 * Angular: pending-payment-five-days-old.page.ts + .html
 * React Native: Simple card list — ASM only screen.
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
import { getPaymentPendingMorethan5daysofVendorForRM } from '../../services/api';
import HelperService from '../../utils/helpers';

const PendingPaymentFiveDaysOldScreen = () => {
  const { sessionToken, selectedRMId, designation } = useAppContext();
  const [list, setList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!sessionToken || designation !== 'ASM') {
        return;
      }
      setIsLoading(true);
      getPaymentPendingMorethan5daysofVendorForRM(selectedRMId, sessionToken)
        .then(res => {
          if (res.IsSuccess) {
            setList(res.Data);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, selectedRMId, designation]),
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#3880ff" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.vendorName}>{item.InternalVendorName}</Text>
              <Text style={styles.detail}>Aging: {item.Aging}</Text>
              <Text style={styles.detail}>Quantity: {item.Quantity}</Text>
              <Text style={[styles.detail, { fontWeight: 'bold' }]}>
                Pending Amount: {item.TotalAmt}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No payments pending 5+ days.</Text>
          }
          contentContainerStyle={{ padding: 12 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loader: { flex: 1, marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  vendorName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
  },
  detail: { fontSize: 13, color: '#555', marginBottom: 2 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default PendingPaymentFiveDaysOldScreen;
