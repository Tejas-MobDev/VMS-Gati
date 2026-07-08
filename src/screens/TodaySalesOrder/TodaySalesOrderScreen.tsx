/**
 * MIGRATION NOTE:
 * Angular: todaysalesorder.page.ts + todaysalesorder.page.html
 * React Native: useFocusEffect fetches data on every screen focus.
 *
 * ion-card list → FlatList of card Views
 * dateTimeSplit pipe → dateTimeSplit() utility function
 * ion-badge in header → badge View next to title text
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
import { TodaysSalesorderForRM } from '../../services/api';
import { dateTimeSplit } from '../../utils/formatters';
import HelperService from '../../utils/helpers';

const TodaySalesOrderScreen = () => {
    const { sessionToken, selectedVendorId, selectedRMId } = useAppContext();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!sessionToken) { return; }
            setIsLoading(true);
            TodaysSalesorderForRM(sessionToken, selectedVendorId, selectedRMId)
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

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.vendorName}>{item.InternalVendorName}</Text>
            <Text style={styles.detail}>
                Purchase order on: {dateTimeSplit(item.CreatedOn)}
            </Text>
            <Text style={styles.detail}>
                {item.ProductName}, {item.ColorName}
            </Text>
            <Text style={styles.detail}>Purchase Type: {item.TypeName}</Text>
            <Text style={styles.detail}>
                Goods dispatched on: {dateTimeSplit(item.GoodsRec_DispDate)}
            </Text>
            <Text style={styles.detail}>Sales order price: {item.TotalAmt}</Text>
            <Text style={styles.detail}>Aging: {item.Aging}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {isLoading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#3880ff" />
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                Total: {orders.length}
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No orders found.</Text>
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
    vendorName: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 6 },
    detail: { fontSize: 13, color: '#555', marginBottom: 3 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default TodaySalesOrderScreen;
