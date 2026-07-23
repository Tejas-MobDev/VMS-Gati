/**
 * MIGRATION NOTE:
 * Angular: service-book-status.page.ts + .html
 * React Native: 3-tab screen (Rec_ServiceBook / Pending / Hold).
 *
 * Key logic preserved:
 * - param1='T' → show all data (VendorID=0, RMID=null/0 based on designation)
 * - API returns Data[0]=Pending, Data[1]=Hold, Data[2]=Rec_ServiceBook
 * - Search filters by Name or ChassisNumber across all tabs
 * - Rec_ServiceBook tab: ion-toggle (Statusid==135) → Switch to mark received
 * - Pending/Hold tabs: display only (no receive action)
 * - ServiceBookRecByRMForRM API call to mark received
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { ToggleListSkeleton } from '../../components/ToggleListSkeleton';
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
        HelperService.showAlert('Error', 'Session token is required.');
        return;
      }
      const vendorID = selectedVendorId;
      // const rmID = showAll ? (designation === 'RM' ? null : '0') : selectedRMId;

      let rmID = showAll
        ? (designation === 'RM' ? null : '0')
        : selectedRMId;

      rmID = rmID === '0' ? null : rmID;

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
      GetListofServiceBookStatusForRM(sessionToken, vendorID, rmID)
        .then(res => {
          if (res.IsSuccess) {
            console.log('ServiceBookStatusScreen loaded : ', res.Data);
            setPendingList(res.Data[0] ?? []);
            setHoldList(res.Data[1] ?? []);
            setRecList(
              (res.Data[2] ?? []).map(
                (d): ServiceBookItem => ({ ...d, IsChecked: false }),
              ),
            );
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

  const getStatusEntryId = (item: ServiceBookItem) =>
    item?.SLStatusID ?? item?.SalesletterStats_ID;

  const setRecItemChecked = (
    statusEntryId: string | number,
    checked: boolean,
  ) => {
    setRecList(prev =>
      prev.map(d =>
        getStatusEntryId(d) === statusEntryId ? { ...d, IsChecked: checked } : d,
      ),
    );
  };

  const handleToggleReceived = (item: ServiceBookItem, checked: boolean) => {
    if (!checked) {
      return;
    }

    const statusEntryId = getStatusEntryId(item);
    if (!statusEntryId) {
      HelperService.showAlert(
        'Error',
        'Unable to mark received. Missing service book status identifier.',
      );
      return;
    }

    setRecItemChecked(statusEntryId, true);

    Alert.alert(
      'Confirm!',
      `Are you sure Customer Name: ${item.Name}. Chassis No. ${item.ChassisNumber}, Engine No. ${item.EngineNumber} of ${item.Name} is received?`,
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => setRecItemChecked(statusEntryId, false),
        },
        {
          text: 'Yes',
          onPress: async () => {
            setIsLoading(true);
            try {
              const res = await ServiceBookRecByRMForRM(
                statusEntryId,
                sessionToken!,
              );
              if (res.IsSuccess) {
                setRecList(prev =>
                  prev.filter(d => getStatusEntryId(d) !== statusEntryId),
                );
                HelperService.showAlert('Success!', res.Msg);
              } else {
                setRecItemChecked(statusEntryId, false);
                HelperService.showAlert('ERROR!!!', res.Msg);
              }
            } catch {
              setRecItemChecked(statusEntryId, false);
              HelperService.showAlert('Error', 'Error in API.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: ServiceBookItem }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={[styles.name, { fontSize: 16 }]}>{item.SoldTo_N}</Text>
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
      </View>
      {activeTab === 'Rec_ServiceBook' && Number(item.Statusid) === 135 && (
        <Switch
          value={!!item.IsChecked}
          onValueChange={checked => handleToggleReceived(item, checked)}
          trackColor={{ true: '#3880ff' }}
        />
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
              {tab === 'Rec_ServiceBook' ? 'Receive' : tab}
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
        <ToggleListSkeleton showCountBadge detailLines={6} />
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
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  cardContent: { flex: 1, marginRight: 10 },
  name: { fontWeight: '700', fontSize: 14, color: '#222', marginBottom: 4 },
  detail: { fontSize: 13, color: '#000', marginBottom: 2 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default ServiceBookStatusScreen;
