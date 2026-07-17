/**
 * MIGRATION NOTE:
 * Angular: slrec-by-rm.page.ts + .html
 * React Native: Toggle list with confirm dialog before marking SL received.
 *
 * Key logic preserved:
 * - param1='T' → load all SLs (ShowAllData mode): VendorID=0, RMID=null/0
 * - param1 missing → use stored VendorID + RMID
 * - ion-toggle → Switch (React Native built-in)
 * - AlertController confirm dialog → Alert.alert with Yes/No buttons
 * - On confirm: call SLRecievedByRMForRM API, remove item from list on success
 * - On cancel/reject: revert toggle to false
 * - Search filters by SoldTo_N (dealer name)
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Switch,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { ToggleListSkeleton } from '../../components/ToggleListSkeleton';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  GetSLRecByRM_SalesLetterForRM,
  SLRecievedByRMForRM,
} from '../../services/api';
import type { SLRecByRMItem } from '../../types/api';
import HelperService from '../../utils/helpers';

type SLRecRouteParams = { SLRecByRM: { param1?: string } };

const SLRecByRMScreen = () => {
  const route = useRoute<RouteProp<SLRecRouteParams, 'SLRecByRM'>>();
  const showAll = route.params?.param1 === 'T';

  const { sessionToken, designation, selectedVendorId, selectedRMId } =
    useAppContext();

  const [list, setList] = useState<SLRecByRMItem[]>([]);
  const [filteredList, setFilteredList] = useState<SLRecByRMItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!sessionToken) {
        return;
      }

      // Replicate Angular param1='T' logic
      const vendorID = selectedVendorId;
      const rmID = showAll ? (designation === 'RM' ? null : '0') : selectedRMId;

      setIsLoading(true);
      setSearchText('');
      GetSLRecByRM_SalesLetterForRM(sessionToken, vendorID, rmID ?? '0')
        .then(res => {
          if (res.IsSuccess) {
            const data = res.Data.map((d): SLRecByRMItem => ({ ...d, IsChecked: false }));
            setList(data);
            setFilteredList(data);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, showAll, selectedVendorId, selectedRMId, designation]),
  );

  const handleSearch = (text: string) => {
    console.log('[SLRecByRM] Search changed:', text);
    setSearchText(text);
    if (!text) {
      setFilteredList(list);
    } else {
      const lower = text.toLowerCase();
      setFilteredList(
        list.filter(item =>
          (item.SoldTo_N ?? '').toLowerCase().includes(lower),
        ),
      );
    }
  };

  const handleToggle = (item: SLRecByRMItem) => {
    console.log(
      '[SLRecByRM] Toggle pressed for item ID:',
      item.Id,
      '| SoldTo:',
      item.SoldTo_N,
    );
    // Only act when turning ON (mirrors Angular check: if IsChecked == true)
    Alert.alert(
      'Confirm',
      `Are you sure Customer Name: ${item.SoldTo_N}. Chassis No: ${item.ChassisNumber}, Engine No: ${item.EngineNumber} of ${item.Name} is received?`,
      [
        {
          text: 'No',
          style: 'cancel',
          // Revert toggle — no action needed, Switch is controlled
        },
        {
          text: 'Yes',
          onPress: async () => {
            setIsLoading(true);
            try {
              const res = await SLRecievedByRMForRM(item.Id, sessionToken!);
              if (res.IsSuccess) {
                // Remove item from both lists (mirrors Angular filter)
                setList(prev => prev.filter(d => d.Id !== item.Id));
                setFilteredList(prev => prev.filter(d => d.Id !== item.Id));
                HelperService.showAlert('Success!', res.Msg);
              } else {
                HelperService.showAlert('ERROR!', res.Msg);
              }
            } catch {
              HelperService.showAlert('Error', 'Error in API.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: SLRecByRMItem }) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.soldTo}>{item.SoldTo_N}</Text>
        <Text style={styles.detail}>{item.Name}</Text>
        <Text style={styles.detail}>Chassis No: {item.ChassisNumber}</Text>
        <Text style={styles.detail}>Engine No: {item.EngineNumber}</Text>
        <Text style={styles.detail}>
          {item.ProductName}, {item.VehicleColor}
        </Text>
      </View>
      <Switch
        value={item.IsChecked}
        onValueChange={() => handleToggle(item)}
        trackColor={{ true: '#3880ff' }}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Filter by Dealer..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={handleSearch}
        />
      </View>

      {/* Count */}
      {/* <Text style={styles.countText}>Total: {filteredList.length}</Text> */}

      <View style={styles.countBadge}>
        <Text style={styles.totalText}>Total: {filteredList.length}</Text>
      </View>
      {isLoading ? (
        <ToggleListSkeleton showCountBadge detailLines={4} />
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No SLs to receive.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
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
  //   countText: {
  //     paddingHorizontal: 14,
  //     paddingVertical: 8,
  //     fontWeight: '700',
  //     color: '#444',
  //   },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  itemContent: { flex: 1, marginRight: 10 },
  soldTo: { fontWeight: '700', fontSize: 14, color: '#222', marginBottom: 2 },
  detail: { fontSize: 13, color: '#555', marginBottom: 1 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default SLRecByRMScreen;
