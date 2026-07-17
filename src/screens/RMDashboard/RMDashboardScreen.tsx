/**
 * MIGRATION NOTE:
 * Angular: rmdashboard.page.ts + rmdashboard.page.html
 * React Native: Functional component using hooks + React Navigation.
 *
 * Ionic → RN mapping:
 *   ion-select + ngModel     → Picker (controlled)
 *   ion-list / ion-item      → FlatList + TouchableOpacity rows
 *   ion-badge                → badge View with Text
 *   [routerLink]             → navigation.navigate() via routeMap lookup
 *   ionViewWillEnter()       → useFocusEffect (runs on every tab focus)
 *   NavController.navigateRoot() → navigation.reset()
 *
 * The dashboard items from the API contain m_Item3 which is a route path string
 * (e.g. '/tabs/pendingsalesorder'). A routeMap translates these to RN screen names.
 */
import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { DashboardListSkeleton } from '../../components/DashboardListSkeleton';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAppContext } from '../../context/AppContext';
import {
  GetVendorListOfRM,
  RMDashboardData,
  LogoutEmployee,
} from '../../services/api';
import type { DashboardMenuItem, VendorItem } from '../../types/api';
import HelperService from '../../utils/helpers';

// Maps Angular route paths from API response → RN screen names.
// All target screens are registered in DashboardStack so navigation.navigate()
// works within the same stack, providing an automatic back button.
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
};

const RMDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const {
    sessionToken,
    selectedVendorId,
    selectedRMId,
    loggedInEmployeeId,
    employeeName,
    setSelectedVendor,
    setSelectedRM,
    clearSession,
  } = useAppContext();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedVendor, setSelectedVendorLocal] = useState(
    selectedVendorId ?? '0',
  );
  const [dashboardData, setDashboardData] = useState<DashboardMenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [vendorsLoaded, setVendorsLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (selectedRMId === '0' && loggedInEmployeeId) {
        setSelectedRM(loggedInEmployeeId, employeeName ?? '');
      }
    }, [selectedRMId, loggedInEmployeeId, employeeName, setSelectedRM]),
  );

  // Load vendors on mount (mirrors constructor logic)
  useFocusEffect(
    useCallback(() => {
      if (!sessionToken || vendorsLoaded) {
        return;
      }
      (async () => {
        try {
          const res = await GetVendorListOfRM(sessionToken);
          if (res.IsSuccess) {
            setVendors(res.Data);
            setVendorsLoaded(true);
          }
        } catch {}
      })();
    }, [sessionToken, vendorsLoaded]),
  );

  const loadDashboardData = useCallback(
    async (vendorId: string) => {
      if (!sessionToken || !vendorId || vendorId === '0') {
        setDashboardData([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await RMDashboardData(sessionToken, vendorId);
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
    },
    [sessionToken],
  );

  const handleVendorChange = async (value: string) => {
    console.log('[RMDashboard] Vendor selected:', value);
    setSelectedVendorLocal(value);
    setDashboardData([]);
    const vendor = vendors.find(v => v.ID.toString() === value.toString());
    await setSelectedVendor(value.toString(), vendor?.Name ?? '');
    await loadDashboardData(value);
  };

  const handleLogout = useCallback(async () => {
    console.log('[RMDashboard] Logout pressed');
    Alert.alert('Logout', 'Are you sure you want to logout?', [
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
  }, [sessionToken, clearSession, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.headerLogoutBtn}
          accessibilityLabel="Logout"
        >
          <MaterialIcons name="logout" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleLogout]);

  const handleItemPress = (route: string) => {
    const screenName = routeMap[route];
    console.log(
      '[RMDashboard] Dashboard item pressed → route:',
      route,
      '→ screen:',
      screenName,
    );
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  const renderItem = ({ item }: { item: DashboardMenuItem }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleItemPress(item.m_Item3)}
    >
      <Text style={styles.listItemText}>{item.m_Item1}</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{item.m_Item2}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Vendor Picker */}
      <View style={styles.pickerWrapper}>
        <Text style={styles.pickerLabel}>Vendor Name</Text>
        <Picker
          selectedValue={selectedVendor}
          onValueChange={handleVendorChange}
          style={styles.picker}
        >
          <Picker.Item label="Select Vendor" value="0" />
          {vendors.map(v => (
            <Picker.Item key={v.ID} label={v.Name} value={v.ID.toString()} />
          ))}
        </Picker>
      </View>

      {/* Dashboard list */}
      {isLoading ? (
        <DashboardListSkeleton />
      ) : (
        <FlatList
          data={dashboardData}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Select a vendor to load dashboard</Text>
          }
          contentContainerStyle={styles.list}
        />
      )}

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nsoBtn}
          onPress={() => {
            console.log('[RMDashboard] NSO Dealer button pressed');
            navigation.navigate('VendorsWithoutSalesOrder');
          }}
        >
          <Text style={styles.nsoBtnText}>
            NSO Dealer (3 Days no Sales Order)
          </Text>
        </TouchableOpacity>
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
  pickerLabel: { fontSize: 12, color: '#383737', paddingTop: 8 },
  picker: { color: '#000' },
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
  emptyText: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 40,
    fontSize: 14,
  },
  footer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  nsoBtn: {
    backgroundColor: '#f33e3e',
    margin: 10,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nsoBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerLogoutBtn: { marginRight: 15 },
});

export default RMDashboardScreen;
