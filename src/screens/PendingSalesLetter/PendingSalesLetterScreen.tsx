/**
 * MIGRATION NOTE:
 * Angular: pending-salesletter.page.ts + .html
 * React Native: Simple list with useFocusEffect.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { CardListSkeleton } from '../../components/CardListSkeleton';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import { GetPendingSalesLetterRequestForRM } from '../../services/api';
import type { PendingSalesLetterItem } from '../../types/api';
import { dateTimeSplit } from '../../utils/formatters';
import HelperService from '../../utils/helpers';

const PendingSalesLetterScreen = () => {
    const { sessionToken, selectedVendorId, selectedRMId } = useAppContext();
    const [list, setList] = useState<PendingSalesLetterItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!sessionToken) { return; }
            setIsLoading(true);
            GetPendingSalesLetterRequestForRM(sessionToken, selectedVendorId, selectedRMId)
                .then(res => {
                    if (res.IsSuccess) {
                        setList(res.Data);
                    } else {
                        HelperService.showAlert('Error', res.Msg);
                    }
                })
                .catch(() => HelperService.showAlert('Error', 'Error in API.'))
                .finally(() => setIsLoading(false));
        }, [sessionToken, selectedVendorId, selectedRMId]),
    );

    const renderItem = ({ item }: { item: PendingSalesLetterItem }) => (
        <View style={styles.item}>
            <Text style={styles.chassis}>Chassis No: {item.ChasisNo}</Text>
            <Text style={styles.detail}>Engine No: {item.EngineNo}</Text>
            <Text style={styles.detail}>
                {item.ProductName}, {item.Color}
            </Text>
            <Text style={styles.detail}>
                Allotted on: {dateTimeSplit(item.VechicleAllotDate)}. Aging:{' '}
                {item.Aging}
            </Text>
            <Text style={styles.detail}>
                Dispatched on: {dateTimeSplit(item.SalesOrderDt_DispatchDate)}. Aging:{' '}
                {item.SalesOrderDt_DispatchDate_Aging}
            </Text>
            <Text style={styles.detail}>Sold To: {item.SoldTo}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {isLoading ? (
                <CardListSkeleton showCountBadge detailLines={5} />
            ) : (
                <FlatList
                    data={list}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderItem}
                    ListHeaderComponent={
                        <View style={styles.countBadge}>
                            <Text style={styles.totalText}>
                                Total: {list.length}
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No pending SL requests.</Text>
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    listContent: { padding: 12 },
    countBadge: {
        backgroundColor: '#3880ff',
        alignSelf: 'flex-end',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 5,
        marginVertical: 10,
        marginHorizontal: 12,
        // marginBottom: 10,
    },
    totalText: { fontWeight: '700', color: '#fff', fontSize: 12 },
    item: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        elevation: 1,
    },
    chassis: { fontWeight: '700', fontSize: 14, color: '#222', marginBottom: 4 },
    detail: { fontSize: 13, color: '#555', marginBottom: 2 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default PendingSalesLetterScreen;
