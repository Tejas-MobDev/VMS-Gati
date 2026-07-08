/**
 * MIGRATION NOTE:
 * Angular: pendingpayment.page.ts + .html
 * React Native: 2-tab screen (Vehicle / Epayment). Advance tab is commented out in
 * original Angular code so not included here.
 *
 * Key logic preserved:
 * - Vehicle tab: search by company name, total balance calculation, save payment remark
 * - Epayment tab: total balance (only positive balances summed), save remark
 * - Aging > 5 days → highlighted card (red left border)
 * - ion-segment → custom tab buttons
 * - ion-searchbar → TextInput
 * - ion-input for remark → TextInput per item (controlled via item state)
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
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  PaymenofVendorForRM,
  SavePaymentRemarkInSalesOrderDet,
} from '../../services/api';
import { dateTimeSplit } from '../../utils/formatters';
import HelperService from '../../utils/helpers';

type TabType = 'Vehicle' | 'Epayment';

const PendingPaymentScreen = () => {
  const { sessionToken, selectedVendorId, selectedRMId } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabType>('Vehicle');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [vehicleList, setVehicleList] = useState<any[]>([]);
  const [filteredVehicleList, setFilteredVehicleList] = useState<any[]>([]);
  const [epaymentList, setEpaymentList] = useState<any[]>([]);
  const [totalVehicleBalance, setTotalVehicleBalance] = useState(0);
  const [totalEpaymentBalance, setTotalEpaymentBalance] = useState(0);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      setActiveTab('Vehicle');
      if (!sessionToken) {
        return;
      }
      setIsLoading(true);
      PaymenofVendorForRM(selectedRMId, selectedVendorId, sessionToken)
        .then(res => {
          if (res.IsSuccess) {
            const vehicles = res.Data.m_Item1 ?? [];
            const epayments = res.Data.m_Item3 ?? [];
            setVehicleList(vehicles);
            setFilteredVehicleList(vehicles);
            setEpaymentList(epayments);
            setTotalVehicleBalance(
              vehicles.reduce((s: number, c: any) => s + (c.Balance ?? 0), 0),
            );
            setTotalEpaymentBalance(
              epayments.reduce((s: number, c: any) => {
                return c.Balance > 0 ? s + c.Balance : s;
              }, 0),
            );
            // console.log("filteredVehicleList on pending payment screen : ", filteredVehicleList)
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, selectedVendorId, selectedRMId]),
  );

  const handleSearch = (text: string) => {
    console.log('[PendingPayment] Search changed:', text);
    setSearchText(text);
    if (!text) {
      setFilteredVehicleList(vehicleList);
      setTotalVehicleBalance(
        vehicleList.reduce((s, c) => s + (c.Balance ?? 0), 0),
      );
    } else {
      const lower = text.toLowerCase();
      const filtered = vehicleList.filter(item =>
        (item.InternalCompanyName ?? '').toLowerCase().includes(lower),
      );
      setFilteredVehicleList(filtered);
      setTotalVehicleBalance(
        filtered.reduce((s, c) => s + (c.Balance ?? 0), 0),
      );
    }
  };

  const saveRemark = async (item: any, type: 'Vehicle' | 'Epayment') => {
    const key = `${type}_${item.ID ?? item.SalesOrderDetID}`;
    console.log(
      '[PendingPayment] Save Remark pressed | type:',
      type,
      '| key:',
      key,
    );
    const remark = remarks[key] ?? item.PaymentRemark ?? '';
    const paymentData = {
      SalesOrderdetID: type === 'Epayment' ? item.SalesOrderDetID : item.ID,
      RemarkPayment: remark,
      RemarkType: type,
    };
    setIsLoading(true);
    try {
      const res = await SavePaymentRemarkInSalesOrderDet(
        paymentData,
        sessionToken!,
      );
      HelperService.showAlert('Thank You', res.Msg);
    } catch {
      HelperService.showAlert('Error', 'Error in API.');
    } finally {
      setIsLoading(false);
    }
  };

  const setRemark = (key: string, value: string) =>
    setRemarks(prev => ({ ...prev, [key]: value }));

  const renderVehicleItem = ({ item, index }: { item: any; index: number }) => {
    const key = `Vehicle_${item.ID}`;
    const isOld = (item.Aging ?? 0) > 5;
    return (
      <View style={[styles.card, isOld && styles.cardOld]}>
        <Text style={styles.vendorName}>
          {item.InternalVendorName}
          {/* serial number shown below line*/}
          {/* {index + 1}. {item.InternalVendorName} */}
        </Text>
        <Text style={styles.detail}>
          Allotted on: {dateTimeSplit(item.AllotmentDateOn)}. Aging:{' '}
          {item.Aging}
        </Text>
        <Text style={styles.detail}>
          Dispatched on: {dateTimeSplit(item.VehicleDispatchedOn)}. Aging:{' '}
          {item.SalesOrderDt_DispatchDate_Aging}
        </Text>
        <Text style={styles.detail}>
          Chassis: {item.ChessisNo}, Engine: {item.EngineNo}
        </Text>
        <Text style={styles.detail}>
          {item.ProductName}, {item.ColorName}
        </Text>
        <Text style={styles.detail}>
          Paid: {item.PaidTillNow} | Pending: {item.Balance}
        </Text>
        <Text style={styles.detail}>{item.InternalCompanyName}</Text>
        <TextInput
          style={styles.remarkInput}
          value={remarks[key] ?? item.PaymentRemark ?? ''}
          onChangeText={val => setRemark(key, val)}
          placeholder="Enter remark..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          style={styles.remarkBtn}
          onPress={() => saveRemark(item, 'Vehicle')}
        >
          <Text style={styles.remarkBtnText}>Save Remark</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEpaymentItem = ({ item }: { item: any }) => {
    const key = `Epayment_${item.SalesOrderDetID}`;
    const isOld = (item.Aging ?? 0) > 5;
    return (
      <View style={[styles.card, isOld && styles.cardOld]}>
        <Text style={styles.vendorName}>{item.InternalVendorName}</Text>
        <Text style={styles.detail}>
          Allotted on: {dateTimeSplit(item.VehicleAllotDt)}. Aging:{' '}
          {item.VehicleAllot_Aging}
        </Text>
        <Text style={styles.detail}>
          Dispatched on: {dateTimeSplit(item.VehicleDispatchedDt)}. Aging:{' '}
          {item.Aging}
        </Text>
        <Text style={styles.detail}>
          Chassis: {item.ChessisNo}, Engine: {item.EngineNo}
        </Text>
        <Text style={styles.detail}>
          {item.ProductName}, {item.ColorName}
        </Text>
        <Text style={styles.detail}>
          Paid: {item.PaidTillNow} | Pending: {item.Balance}
        </Text>
        <Text style={styles.detail}>{item.InternalCompanyName}</Text>
        <TextInput
          style={styles.remarkInput}
          value={remarks[key] ?? item.PaymentRemark ?? ''}
          onChangeText={val => setRemark(key, val)}
          placeholder="Enter remark..."
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity
          style={styles.remarkBtn}
          onPress={() => saveRemark(item, 'Epayment')}
        >
          <Text style={styles.remarkBtnText}>Save Remark</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab row */}
      <View style={styles.tabRow}>
        {(['Vehicle', 'Epayment'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              console.log('[PendingPayment] Tab switched to:', tab);
              setActiveTab(tab);
              setSearchText('');
            }}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === tab && styles.tabBtnTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <ActivityIndicator
          style={styles.loaderOverlay}
          size="large"
          color="#3880ff"
        />
      )}

      {activeTab === 'Vehicle' && (
        <>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Filter by Company..."
              placeholderTextColor="#aaa"
              value={searchText}
              onChangeText={handleSearch}
            />
          </View>
          {/* <View style={styles.totalRow}> */}
          <View style={styles.countBadge}>
            <Text style={styles.totalText}>
              Total Balance: {totalVehicleBalance}
            </Text>
          </View>
          {/* </View> */}
          <FlatList
            data={filteredVehicleList}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderVehicleItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No pending vehicle payments.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      {activeTab === 'Epayment' && (
        <>
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>
              Total Balance: {totalEpaymentBalance}
            </Text>
          </View>
          <FlatList
            data={epaymentList}
            keyExtractor={(_, i) => i.toString()}
            renderItem={renderEpaymentItem}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No pending epayments.</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        </>
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
  tabBtnText: { fontSize: 14, color: '#888', fontWeight: '600' },
  tabBtnTextActive: { color: '#3880ff' },
  loaderOverlay: { marginTop: 20 },
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
  totalRow: {
    paddingHorizontal: 14,
    // paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
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
  listContent: { padding: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  cardOld: { borderLeftColor: '#eb445a' },
  vendorName: {
    fontWeight: '700',
    fontSize: 16,
    color: '#222',
    marginBottom: 4,
  },
  detail: { fontSize: 13, color: '#555', marginBottom: 2 },
  remarkInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#222',
    backgroundColor: '#fafafa',
    marginTop: 8,
  },
  remarkBtn: {
    backgroundColor: '#3880ff',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  remarkBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default PendingPaymentScreen;
