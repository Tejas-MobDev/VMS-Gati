/**
 * MIGRATION NOTE:
 * Angular: slcurrent-updates.page.ts + .html
 * React Native: 3-tab segment (Requested / Hold / In Progress) with lazy loading.
 *
 * Ionic ion-segment → custom tab buttons row (TouchableOpacity)
 * ion-searchbar → TextInput with onChangeText filter
 * Format_SL_Status pipe → formatSLStatus() utility
 *
 * Key logic preserved:
 * - Each tab loads data only once (isXxxMade flags)
 * - Reset flags on screen focus (mirrors ionViewWillEnter)
 * - Search filters by Name or ChassisNumber
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
    GetCurrentSLRequestedForRM,
    GetCurrentSLHoldForRM,
    GetCurrentSLInProgressForRM,
} from '../../services/api';
import { formatSLStatus, dateTimeSplit } from '../../utils/formatters';
import HelperService from '../../utils/helpers';

type TabType = 'Hold' | 'Requested' | 'In Progress';

const SLCurrentUpdatesScreen = () => {
    const { sessionToken, selectedVendorId, selectedRMId } = useAppContext();

    const [activeTab, setActiveTab] = useState<TabType>('Hold');
    const [searchText, setSearchText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [requestedList, setRequestedList] = useState<any[]>([]);
    const [holdList, setHoldList] = useState<any[]>([]);
    const [inProgressList, setInProgressList] = useState<any[]>([]);

    // Flags to avoid re-fetching on tab switch — mirrors Angular's isXxxMade
    const [requestedLoaded, setRequestedLoaded] = useState(false);
    const [holdLoaded, setHoldLoaded] = useState(false);
    const [inProgressLoaded, setInProgressLoaded] = useState(false);

    // Reset on screen focus (mirrors ionViewWillEnter)
    useFocusEffect(
        useCallback(() => {
            setRequestedLoaded(false);
            setHoldLoaded(false);
            setInProgressLoaded(false);
            setSearchText('');
            setActiveTab('Hold');
        }, []),
    );

    // Load data for active tab when it changes
    useFocusEffect(
        useCallback(() => {
            if (!sessionToken) { return; }
            loadTabData(activeTab);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [activeTab, sessionToken]),
    );

    const loadTabData = async (tab: TabType) => {
        if (tab === 'Requested' && requestedLoaded) { return; }
        if (tab === 'Hold' && holdLoaded) { return; }
        if (tab === 'In Progress' && inProgressLoaded) { return; }

        setIsLoading(true);
        setSearchText('');
        try {
            if (tab === 'Requested') {
                const res = await GetCurrentSLRequestedForRM(sessionToken!, selectedVendorId, selectedRMId);
                if (res.IsSuccess) {
                    setRequestedList(res.Data);
                    setRequestedLoaded(true);
                } else {
                    HelperService.showAlert('Error', res.Msg);
                }
            } else if (tab === 'Hold') {
                const res = await GetCurrentSLHoldForRM(sessionToken!, selectedVendorId, selectedRMId);
                if (res.IsSuccess) {
                    setHoldList(res.Data);
                    setHoldLoaded(true);
                } else {
                    HelperService.showAlert('Error', res.Msg);
                }
            } else if (tab === 'In Progress') {
                const res = await GetCurrentSLInProgressForRM(sessionToken!, selectedVendorId, selectedRMId);
                if (res.IsSuccess) {
                    setInProgressList(res.Data);
                    setInProgressLoaded(true);
                } else {
                    HelperService.showAlert('Error', res.Msg);
                }
            }
        } catch {
            HelperService.showAlert('Error', 'Error in API.');
        } finally {
            setIsLoading(false);
        }
    };

    const getActiveList = (): any[] => {
        let base: any[] = [];
        if (activeTab === 'Requested') { base = requestedList; }
        else if (activeTab === 'Hold') { base = holdList; }
        else { base = inProgressList; }

        if (!searchText) { return base; }
        const lower = searchText.toLowerCase();
        return base.filter(
            item =>
                (item.Name ?? '').toLowerCase().includes(lower) ||
                (item.ChassisNumber ?? '').toLowerCase().includes(lower),
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <Text style={styles.dealerName}>{item.Name}</Text>
            <Text style={styles.detail}>Chassis: {item.ChassisNumber}</Text>
            <Text style={styles.detail}>Engine: {item.EngineNumber}</Text>
            <Text style={styles.detail}>
                {item.ProductName}, {item.VehicleColor}
            </Text>
            <Text style={styles.detail}>
                Status: {formatSLStatus({ Statusid: item.Statusid, Stat: item.Stat })}
            </Text>
            <Text style={styles.detail}>
                Date: {dateTimeSplit(item.SLRequestDate)}
            </Text>
        </View>
    );

    const displayList = getActiveList();

    return (
        <View style={styles.container}>
            {/* Tab Selector */}
            <View style={styles.tabRow}>
                {(['Hold', 'Requested', 'In Progress'] as TabType[]).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                        onPress={() => {
                            console.log('[SLCurrentUpdates] Tab switched to:', tab);
                            setActiveTab(tab);
                            loadTabData(tab);
                        }}>
                        <Text
                            style={[
                                styles.tabBtnText,
                                activeTab === tab && styles.tabBtnTextActive,
                            ]}>
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by dealer or chassis..."
                    placeholderTextColor="#aaa"
                    value={searchText}
                    onChangeText={val => {
                        console.log('[SLCurrentUpdates] Search changed:', val);
                        setSearchText(val);
                    }}
                />
            </View>

            {/* Count */}
            <Text style={styles.countText}>Total: {displayList.length}</Text>

            {/* List */}
            {isLoading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#3880ff" />
            ) : (
                <FlatList
                    data={displayList}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No items found.</Text>
                    }
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabBtnActive: { borderBottomColor: '#3880ff' },
    tabBtnText: { fontSize: 13, color: '#888', fontWeight: '600' },
    tabBtnTextActive: { color: '#3880ff' },
    searchRow: {
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInput: {
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#222',
    },
    countText: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        fontWeight: '700',
        color: '#444',
    },
    loader: { flex: 1, marginTop: 40 },
    listContent: { paddingHorizontal: 12, paddingBottom: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 14,
        marginBottom: 10,
        elevation: 1,
    },
    dealerName: { fontWeight: '700', fontSize: 14, color: '#222', marginBottom: 4 },
    detail: { fontSize: 13, color: '#555', marginBottom: 2 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default SLCurrentUpdatesScreen;
