/**
 * MIGRATION NOTE:
 * Angular: service-book-status.page.ts + .html
 * React Native: 3-tab screen (Rec_ServiceBook / Pending / Hold).
 *
 * Key logic preserved:
 * - param1='T' → show all data (VendorID=0, RMID=null/0 based on designation)
 * - API returns Data[0]=Pending, Data[1]=Hold, Data[2]=Rec_ServiceBook
 * - Search filters by Name or ChassisNumber across all tabs
 * - ServiceBookRecByRMForRM API call to mark received
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
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  GetListofServiceBookStatusForRM,
  ServiceBookRecByRMForRM,
} from '../../services/api';
import type { ServiceBookItem } from '../../types/api';
import HelperService from '../../utils/helpers';

type RouteParams = { ServiceBookStatus: { param1?: string } };
type TabType = 'Rec_ServiceBook' | 'Pending' | 'Hold';

const ServiceBookStatusScreen = () => {
  const route = useRoute<RouteProp<RouteParams, 'ServiceBookStatus'>>();
  const showAll = route.params?.param1 === 'T';
  const { sessionToken, designation, selectedVendorId, selectedRMId } =
    useAppContext();

  const [activeTab, setActiveTab] = useState<TabType>('Rec_ServiceBook');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [pendingList, setPendingList] = useState<ServiceBookItem[]>([]);
  const [holdList, setHoldList] = useState<ServiceBookItem[]>([]);
  const [recList, setRecList] = useState<ServiceBookItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!sessionToken) {
        return;
      }
      const vendorID = selectedVendorId;
      const rmID = showAll ? (designation === 'RM' ? null : '0') : selectedRMId;
      // console.log(
      //   'data comming from useContext hook: ',
      //   sessionToken,
      //   selectedVendorId,
      //   selectedRMId,
      //   designation,
      // );
      setIsLoading(true);
      setSearchText('');
      setActiveTab('Rec_ServiceBook');
      console.log(
        '[ServiceBookStatus] Loading data for vendorID:',
        vendorID,
        '| rmID:',
        rmID,
      );
      GetListofServiceBookStatusForRM(sessionToken, vendorID, rmID ?? '0')
        .then(res => {
          if (res.IsSuccess) {
            console.log('ServiceBookStatusScreen loaded : ', res.Data);
            setPendingList(res.Data[0] ?? []);
            setHoldList(res.Data[1] ?? []);
            setRecList(res.Data[2] ?? []);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, showAll, designation, selectedVendorId, selectedRMId]),
  );

  const getFilteredList = (): ServiceBookItem[] => {
    let base =
      activeTab === 'Pending'
        ? pendingList
        : activeTab === 'Hold'
        ? holdList
        : recList;
    if (!searchText) {
      return base;
    }
    const lower = searchText.toLowerCase();
    return base.filter(
      item =>
        (item.Name ?? '').toLowerCase().includes(lower) ||
        (item.ChassisNumber ?? '').toLowerCase().includes(lower),
    );
  };

  const handleMarkReceived = async (item: ServiceBookItem) => {
    const statusEntryId = item?.SLStatusID ?? item?.SalesletterStats_ID;

    if (!statusEntryId) {
      HelperService.showAlert(
        'Error',
        'Unable to mark received. Missing service book status identifier.',
      );
      return;
    }

    console.log(
      '[ServiceBookStatus] Mark Received pressed for:',
      item.Name,
      '| Chassis:',
      item.ChassisNumber,
    );
    HelperService.showConfirm(
      'Confirm',
      `Mark service book received for ${item.Name}? Chassis: ${item.ChassisNumber}`,
      async () => {
        setIsLoading(true);
        try {
          const res = await ServiceBookRecByRMForRM(statusEntryId, sessionToken!);
          if (res.IsSuccess) {
            setPendingList(prev =>
              prev.filter(
                d => (d?.SLStatusID ?? d?.SalesletterStats_ID) !== statusEntryId,
              ),
            );
            setRecList(prev =>
              prev.filter(
                d => (d?.SLStatusID ?? d?.SalesletterStats_ID) !== statusEntryId,
              ),
            );
            HelperService.showAlert('Success!', res.Msg);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        } catch {
          HelperService.showAlert('Error', 'Error in API.');
        } finally {
          setIsLoading(false);
        }
      },
    );
  };

  const renderItem = ({ item }: { item: ServiceBookItem }) => (
    <View style={styles.card}>
      <Text style={[styles.name, {fontSize: 16}]}>{item.SoldTo_N}</Text>
      <Text style={styles.name}>{item.Name}</Text>
      <Text style={styles.detail}>Chassis No. : {item.ChassisNumber}</Text>
      <Text style={styles.detail}>Engine No. : {item.EngineNumber}</Text>
      <Text style={[styles.detail, { color: '#646262' }]}>
        {item.ProductName}, {item.VehicleColor}
      </Text>
      <Text style={styles.detail}>Current Status : {item.Status_Name}</Text>
      <Text style={styles.detail}>
        Current Status Remark : {item.ServicebookStatusRemark}
      </Text>
      {activeTab === 'Pending' && (
        <TouchableOpacity
          style={styles.recBtn}
          onPress={() => handleMarkReceived(item)}
        >
          <Text style={styles.recBtnText}>Mark Received</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const displayList = getFilteredList();

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {(['Pending', 'Hold', 'Rec_ServiceBook'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              console.log('[ServiceBookStatus] Tab switched to:', tab);
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
              {tab === 'Rec_ServiceBook' ? 'Received' : tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or chassis..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={val => {
            console.log('[ServiceBookStatus] Search changed:', val);
            setSearchText(val);
          }}
        />
      </View>

      {/* <Text style={styles.countText}>Total: {displayList.length}</Text> */}

      <View style={styles.countBadge}>
        <Text style={styles.totalText}>Total: {displayList.length}</Text>
      </View>
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
  tabBtnText: { fontSize: 12, color: '#888', fontWeight: '600' },
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
  // countText: { paddingHorizontal: 14, paddingVertical: 8, fontWeight: '700', color: '#444' },
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
  loader: { flex: 1, marginTop: 40 },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  name: { fontWeight: '700', fontSize: 14, color: '#222', marginBottom: 4 },
  detail: { fontSize: 13, color: '#000', marginBottom: 2 },
  recBtn: {
    backgroundColor: '#3880ff',
    borderRadius: 6,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  recBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default ServiceBookStatusScreen;
