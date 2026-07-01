/**
 * MIGRATION NOTE:
 * Angular: asmdashboard.page.ts + asmdashboard.page.html
 * React Native: Functional component with hooks.
 *
 * Key logic preserved:
 * - Two pickers: RM (filters vendors) + Vendor
 * - When RM selected → FilterListOfVendors filters by Optional array
 * - When RM=0 → show all vendors
 * - Refresh loads ASMDashboardData with both VendorID + RMID
 * - NSO button + Payment 5-days button in footer
 *
 * Ionic → RN: same as RMDashboard (Picker, FlatList, TouchableOpacity, routeMap)
 */
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
    GetListOfRMAndVendorsBasedOnASM,
    ASMDashboardData,
    LogoutEmployee,
} from '../../services/api';
import HelperService from '../../utils/helpers';

const routeMap: Record<string, string> = {
    '/tabs/pendingsalesorder': 'PendingSalesOrder',
    '/tabs/todaysalesorder': 'TodaySalesOrder',
    '/tabs/pendingpayment': 'PendingPayment',
    '/tabs/pending-salesletter': 'PendingSalesLetter',
    '/tabs/slcurrent-updates': 'SLCurrentUpdates',
    '/tabs/slrec-by-rm': 'SLRecByRM',
    '/tabs/service-book-status': 'ServiceBookStatus',
    '/tabs/hsrpnumber-receive-pending-by-rm-asm': 'HSRPNumberPending',
    '/tabs/vendors-without-sales-order': 'VendorsWithoutSalesOrder',
    '/tabs/payment-rec-from-vendor': 'PaymentRecFromVendor',
    '/tabs/payment-rec-without-amt': 'PaymentRecWithoutAmt',
    '/tabs/pending-payment-five-days-old': 'PendingPaymentFiveDaysOld',
};

const ASMDashboardScreen = () => {
    const navigation = useNavigation<any>();
    const {
        sessionToken,
        selectedVendorId,
        selectedRMId,
        setSelectedVendor,
        setSelectedRM,
        clearSession,
    } = useAppContext();

    const [allVendors, setAllVendors] = useState<any[]>([]);
    const [filteredVendors, setFilteredVendors] = useState<any[]>([]);
    const [rmList, setRMList] = useState<any[]>([]);
    const [selectedVendorLocal, setSelectedVendorLocal] = useState(selectedVendorId ?? '0');
    const [selectedRMLocal, setSelectedRMLocal] = useState(selectedRMId ?? '0');
    const [dashboardData, setDashboardData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);

    useFocusEffect(
        useCallback(() => {
            if (!sessionToken || dataLoaded) { return; }
            (async () => {
                try {
                    const res = await GetListOfRMAndVendorsBasedOnASM(sessionToken);
                    if (res.IsSuccess) {
                        const vendors = res.Data[1];
                        const rms = res.Data[0];
                        setAllVendors(vendors);
                        setFilteredVendors(vendors);
                        setRMList(rms);
                        setDataLoaded(true);
                    }
                } catch { }
            })();
        }, [sessionToken, dataLoaded]),
    );

    const handleRMChange = async (value: string) => {
        console.log('[ASMDashboard] RM selected:', value);
        setSelectedRMLocal(value);
        setDashboardData([]);
        setSelectedVendorLocal('0');

        // Filter vendors by RM — mirrors StoreRMName() logic
        if (value === '0') {
            setFilteredVendors(allVendors);
        } else {
            const numericVal = parseInt(value, 10);
            const filtered = allVendors.filter(v => {
                const optional: number[] = v.Optional ?? [];
                return optional.includes(numericVal) || optional.includes(-1);
            });
            setFilteredVendors(filtered);
        }

        const rm = rmList.find(r => r.ID.toString() === value.toString());
        await setSelectedRM(value.toString(), rm?.Name ?? '');
    };

    const handleVendorChange = async (value: string) => {
        console.log('[ASMDashboard] Vendor selected:', value);
        setSelectedVendorLocal(value);
        setDashboardData([]);
        const vendor = allVendors.find(v => v.ID.toString() === value.toString());
        await setSelectedVendor(value.toString(), vendor?.Name ?? '');
    };

    const handleRefresh = async () => {
        console.log('[ASMDashboard] Refresh pressed, vendor:', selectedVendorLocal, ', RM:', selectedRMLocal);
        if (!sessionToken) { return; }
        setIsLoading(true);
        try {
            const res = await ASMDashboardData(
                sessionToken,
                selectedVendorLocal,
                selectedRMLocal,
            );
            if (res.IsSuccess) {
                setDashboardData(res.Data);
            } else {
                HelperService.showAlert('Error', res.Msg);
            }
        } catch {
            HelperService.showAlert('Error', 'Error in API.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        console.log('[ASMDashboard] Logout pressed');
        Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    setIsLoading(true);
                    try {
                        const res = await LogoutEmployee(sessionToken!);
                        if (res.IsSuccess || res.Msg === 'Invalid Session found.') {
                            await clearSession();
                            navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
                        } else {
                            HelperService.showAlert('Error', res.Msg);
                        }
                    } catch {
                        HelperService.showAlert('Error', 'Error in API.');
                    } finally {
                        setIsLoading(false);
                    }
                },
            },
        ]);
    };

    const handleItemPress = (route: string) => {
        const screenName = routeMap[route];
        console.log('[ASMDashboard] Dashboard item pressed → route:', route, '→ screen:', screenName);
        if (screenName) {
            navigation.navigate(screenName);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.listItem}
            onPress={() => handleItemPress(item.m_Item3)}>
            <Text style={styles.listItemText}>{item.m_Item1}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.m_Item2}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* RM Picker */}
            <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>RM Name</Text>
                <Picker
                    selectedValue={selectedRMLocal}
                    onValueChange={handleRMChange}
                    style={styles.picker}>
                    <Picker.Item label="All RMs" value="0" />
                    {rmList.map(r => (
                        <Picker.Item key={r.ID} label={r.Name} value={r.ID.toString()} />
                    ))}
                </Picker>
            </View>

            {/* Vendor Picker */}
            <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Vendor Name</Text>
                <Picker
                    selectedValue={selectedVendorLocal}
                    onValueChange={handleVendorChange}
                    style={styles.picker}>
                    <Picker.Item label="Select Vendor" value="0" />
                    {filteredVendors.map(v => (
                        <Picker.Item key={v.ID} label={v.Name} value={v.ID.toString()} />
                    ))}
                </Picker>
            </View>

            {isLoading ? (
                <ActivityIndicator style={styles.loader} size="large" color="#3880ff" />
            ) : (
                <FlatList
                    data={dashboardData}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={renderItem}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Select filters and tap Refresh</Text>
                    }
                    contentContainerStyle={styles.list}
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => navigation.navigate('PendingPaymentFiveDaysOld')}>
                    <Text style={styles.dangerBtnText}>
                        Payment Pending more than 5 days
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.dangerBtn}
                    onPress={() => navigation.navigate('VendorsWithoutSalesOrder')}>
                    <Text style={styles.dangerBtnText}>
                        NSO Dealer (3 Days no Sales Order)
                    </Text>
                </TouchableOpacity>
                <View style={styles.footerRow}>
                    <TouchableOpacity style={styles.refreshBtn} onPress={handleRefresh}>
                        <Text style={styles.refreshBtnText}>↻  Refresh</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    pickerWrapper: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingHorizontal: 12,
    },
    pickerLabel: { fontSize: 12, color: '#888', paddingTop: 8 },
    picker: { color: '#222' },
    loader: { flex: 1, marginTop: 40 },
    list: { paddingBottom: 12 },
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
    listItemText: { fontSize: 15, color: '#222', flex: 1 },
    badge: {
        backgroundColor: '#3880ff',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        minWidth: 32,
        alignItems: 'center',
    },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 14 },
    footer: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    dangerBtn: {
        backgroundColor: '#eb445a',
        margin: 10,
        marginBottom: 4,
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
    },
    dangerBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    footerRow: {
        flexDirection: 'row',
        paddingHorizontal: 10,
        paddingBottom: 10,
        paddingTop: 6,
        gap: 8,
    },
    refreshBtn: {
        flex: 1,
        backgroundColor: '#3880ff',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    refreshBtnText: { color: '#fff', fontWeight: '600' },
    logoutBtn: {
        flex: 1,
        backgroundColor: '#92949c',
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: 'center',
    },
    logoutBtnText: { color: '#fff', fontWeight: '600' },
});

export default ASMDashboardScreen;
