/**
 * MIGRATION NOTE:
 * Angular: hsrpnumber-receive-pending-by-rm-asm.page.ts + .html
 * React Native: 2-tab screen (NumberReceive / Hold).
 *
 * Key logic preserved:
 * - Both lists loaded simultaneously on screen focus
 * - SaveRecByRM: POST to mark HSRP received, remove from list on success
 * - Search filters by ChassisNumber or NumberPlate
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
  HSRPNumberReceivePendingByRM_ASM,
  HSRPNumberHoldByDolphinOrAuthForRM_ASM_App,
  HSRPNumberReceivedByRM_ASM,
} from '../../services/api';
import type { HSRPItem } from '../../types/api';
import HelperService from '../../utils/helpers';

type TabType = 'NumberReceive' | 'Hold';

const HSRPNumberPendingScreen = () => {
  const { sessionToken, designation } = useAppContext();

  const [activeTab, setActiveTab] = useState<TabType>('NumberReceive');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [pendingList, setPendingList] = useState<HSRPItem[]>([]);
  const [holdList, setHoldList] = useState<HSRPItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!sessionToken || !designation) {
        return;
      }
      setIsLoading(true);
      setSearchText('');
      setActiveTab('NumberReceive');

      Promise.all([
        HSRPNumberReceivePendingByRM_ASM(designation, sessionToken),
        HSRPNumberHoldByDolphinOrAuthForRM_ASM_App(designation, sessionToken),
      ])
        .then(([pendRes, holdRes]) => {
          if (pendRes.IsSuccess) {
            setPendingList(pendRes.Data ?? []);
          } else {
            HelperService.showAlert('Error', pendRes.Msg);
          }
          if (holdRes.IsSuccess) {
            setHoldList(holdRes.Data ?? []);
          } else {
            HelperService.showAlert('Error', holdRes.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, designation]),
  );

  const handleMarkReceived = async (item: HSRPItem) => {
    console.log(
      '[HSRPNumberPending] Mark Received pressed | ID:',
      item.HSRPDetail_ID,
      '| Chassis:',
      item.ChassisNumber,
    );
    setIsLoading(true);
    try {
      const res = await HSRPNumberReceivedByRM_ASM(
        item.HSRPDetail_ID,
        sessionToken!,
      );
      if (res.IsSuccess) {
        setPendingList(prev =>
          prev.filter(d => d.HSRPDetail_ID !== item.HSRPDetail_ID),
        );
        HelperService.showAlert('Success!!!', 'Thank you for receiving.');
      } else {
        HelperService.showAlert('Error occurred', 'ERROR in API.');
      }
    } catch {
      HelperService.showAlert('Error', 'Error in API.');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredList = (): HSRPItem[] => {
    const base = activeTab === 'NumberReceive' ? pendingList : holdList;
    if (!searchText) {
      return base;
    }
    const lower = searchText.toLowerCase();
    return base.filter(
      item =>
        (item.ChassisNumber ?? '').toLowerCase().includes(lower) ||
        (item.NumberPlate ?? '').toLowerCase().includes(lower),
    );
  };

  const renderItem = ({ item }: { item: HSRPItem }) => (
    <View style={styles.card}>
      <Text style={styles.numberPlate}>{item.NumberPlate}</Text>
      <Text style={styles.detail}>Chassis: {item.ChassisNumber}</Text>
      <Text style={styles.detail}>
        {item.ProductName}, {item.VehicleColor}
      </Text>
      <Text style={styles.detail}>{item.DealerName}</Text>
      {activeTab === 'NumberReceive' && (
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
        {(['NumberReceive', 'Hold'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              console.log('[HSRPNumberPending] Tab switched to:', tab);
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
              {tab === 'NumberReceive' ? 'Number Receive' : 'Hold'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by chassis or number plate..."
          placeholderTextColor="#aaa"
          value={searchText}
          onChangeText={val => {
            console.log('[HSRPNumberPending] Search changed:', val);
            setSearchText(val);
          }}
        />
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
  tabBtnText: { fontSize: 14, color: '#888', fontWeight: '600' },
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
  loader: { flex: 1, marginTop: 40 },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  numberPlate: {
    fontWeight: '700',
    fontSize: 15,
    color: '#3880ff',
    marginBottom: 4,
  },
  detail: { fontSize: 13, color: '#555', marginBottom: 2 },
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

export default HSRPNumberPendingScreen;
