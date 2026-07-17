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
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Alert,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { CardListSkeleton } from '../../components/CardListSkeleton';
import {
  useFocusEffect,
  useNavigation,
  useIsFocused,
} from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  GetCurrentSLRequestedForRM,
  GetCurrentSLHoldForRM,
  GetCurrentSLInProgressForRM,
} from '../../services/api';
import type { SalesLetterUpdateItem } from '../../types/api';
import { formatSLStatus, dateTimeSplit } from '../../utils/formatters';
import HelperService from '../../utils/helpers';

type TabType = 'Hold' | 'Requested' | 'In Progress';

const SLCurrentUpdatesScreen = () => {
  const { sessionToken, selectedVendorId, selectedRMId } = useAppContext();
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const [activeTab, setActiveTab] = useState<TabType>('Hold');
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [requestedList, setRequestedList] = useState<SalesLetterUpdateItem[]>([]);
  const [holdList, setHoldList] = useState<SalesLetterUpdateItem[]>([]);
  const [inProgressList, setInProgressList] = useState<SalesLetterUpdateItem[]>([]);

  // Flags to avoid re-fetching on tab switch — mirrors Angular's isXxxMade
  const [requestedLoaded, setRequestedLoaded] = useState(false);
  const [holdLoaded, setHoldLoaded] = useState(false);
  const [inProgressLoaded, setInProgressLoaded] = useState(false);
  const [focusRefreshToken, setFocusRefreshToken] = useState(0);
  const lastHandledFocusRefreshToken = useRef(0);

  // Reset cache/search on focus and reload the currently active tab.
  useFocusEffect(
    useCallback(() => {
      setRequestedLoaded(false);
      setHoldLoaded(false);
      setInProgressLoaded(false);
      setSearchText('');
      setFocusRefreshToken(prev => prev + 1);
    }, []),
  );

  const loadTabData = async (tab: TabType, forceRefresh = false) => {
    if (!forceRefresh && tab === 'Requested' && requestedLoaded) {
      return;
    }
    if (!forceRefresh && tab === 'Hold' && holdLoaded) {
      return;
    }
    if (!forceRefresh && tab === 'In Progress' && inProgressLoaded) {
      return;
    }

    setIsLoading(true);
    setSearchText('');
    try {
      if (tab === 'Requested') {
        const res = await GetCurrentSLRequestedForRM(
          sessionToken!,
          selectedVendorId,
          selectedRMId,
        );
        if (res.IsSuccess) {
          setRequestedList(res.Data);
          setRequestedLoaded(true);
        } else {
          HelperService.showAlert('Error', res.Msg);
        }
      } else if (tab === 'Hold') {
        const res = await GetCurrentSLHoldForRM(
          sessionToken!,
          selectedVendorId,
          selectedRMId,
        );
        if (res.IsSuccess) {
          setHoldList(res.Data);
          setHoldLoaded(true);
        } else {
          HelperService.showAlert('Error', res.Msg);
        }
      } else if (tab === 'In Progress') {
        const res = await GetCurrentSLInProgressForRM(
          sessionToken!,
          selectedVendorId,
          selectedRMId,
        );
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

  React.useEffect(() => {
    if (!isFocused || !sessionToken) {
      return;
    }

    const shouldForceRefresh =
      focusRefreshToken !== lastHandledFocusRefreshToken.current;
    loadTabData(activeTab, shouldForceRefresh);
    if (shouldForceRefresh) {
      lastHandledFocusRefreshToken.current = focusRefreshToken;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, sessionToken, isFocused, focusRefreshToken]);

  const navigateToAttachDocs = (slid: string) => {
    const routeNames = navigation.getState?.()?.routeNames ?? [];

    if (routeNames.includes('AttachNewDocs')) {
      navigation.navigate('AttachNewDocs', { SLID: slid });
      return;
    }

    navigation.getParent()?.navigate('SalesLetterTab', {
      screen: 'AttachNewDocs',
      params: { SLID: slid },
    });
  };

  const handleHoldCardPress = (item: SalesLetterUpdateItem) => {
    const statusId = Number(item?.Statusid);
    if (statusId === 59 || statusId === 43) {
      navigateToAttachDocs(String(item?.Id ?? ''));
      return;
    }

    const stat = item?.Stat ?? '';
    const remark = item?.Remark ?? '';
    Alert.alert('Current status', `${stat}(${remark})`);
  };

  const getActiveList = (): SalesLetterUpdateItem[] => {
    let base: SalesLetterUpdateItem[] = [];
    if (activeTab === 'Requested') {
      base = requestedList;
    } else if (activeTab === 'Hold') {
      base = holdList;
    } else {
      base = inProgressList;
    }

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

  const renderCardContent = (item: SalesLetterUpdateItem) => (
    <>
      <Text style={styles.dealerName}>{item.Name}</Text>
      <Text style={styles.detail}>Chassis: {item.ChassisNumber}</Text>
      <Text style={styles.detail}>Engine: {item.EngineNumber}</Text>
      <Text style={styles.detail}>
        {item.ProductName}, {item.VehicleColor}
      </Text>
      <Text style={styles.detail}>
        Sales Letter Requested on:{' '}
        {new Date(item.SalesletterCreatedDate).toLocaleDateString('en-GB')}
      </Text>
      <Text style={styles.detail}>
        Status: {formatSLStatus({ Statusid: Number(item.Statusid), Stat: item.Stat })}
      </Text>
      <Text style={styles.detail}>
        Updated on: {new Date(item.CreatedDate).toLocaleDateString('en-GB')}
      </Text>
      <Text
        style={[
          styles.remarkText,
          activeTab === 'Hold'
            ? Number(item?.Statusid) === 59
              ? styles.remarkRed
              : styles.remarkGreen
            : styles.remarkDefault,
        ]}
      >
        {item.Remark}
      </Text>
    </>
  );

  const renderItem = ({ item }: { item: SalesLetterUpdateItem }) => {
    if (activeTab === 'Hold') {
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => handleHoldCardPress(item)}
        >
          {renderCardContent(item)}
        </TouchableOpacity>
      );
    }

    return <View style={styles.card}>{renderCardContent(item)}</View>;
  };

  const displayList = getActiveList();

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabRow}>
        {(['Requested', 'Hold', 'In Progress'] as TabType[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => {
              console.log('[SLCurrentUpdates] Tab switched to:', tab);
              setActiveTab(tab);
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
      {/* <Text style={styles.countText}>Total: {displayList.length}</Text> */}
      <View style={styles.countBadge}>
        <Text style={styles.totalText}>Total: {displayList.length}</Text>
      </View>
      {/* List */}
      {isLoading ? (
        <CardListSkeleton showCountBadge detailLines={7} />
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
  // countText: {
  //     paddingHorizontal: 14,
  //     paddingVertical: 8,
  //     fontWeight: '700',
  //     color: '#444',
  // },
  listContent: { paddingHorizontal: 12, paddingBottom: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  dealerName: {
    fontWeight: '700',
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
  },
  detail: { fontSize: 13, color: '#555', marginBottom: 2 },
  remarkText: {
    fontSize: 13,
    marginBottom: 2,
    fontWeight: '700',
  },
  remarkRed: { color: '#d32f2f' },
  remarkGreen: { color: '#2e7d32' },
  remarkDefault: { color: '#3880ff' },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default SLCurrentUpdatesScreen;
