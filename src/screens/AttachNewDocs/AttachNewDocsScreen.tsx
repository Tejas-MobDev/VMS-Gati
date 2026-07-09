/**
 * MIGRATION NOTE:
 * Angular: attach-new-docs.page.ts + .html
 * React Native: Document attachment screen.
 *
 * Key logic preserved:
 * - SL_ID comes from navigation route params (replaces ActivatedRoute queryParams)
 * - Loads existing docs + compulsory doc validation rules on enter
 * - Document URLs prefixed with API IP: http://122.185.131.170:223/
 * - Opens AddDocumentModal screen via navigation (replaces ModalController)
 * - Image docs shown as Image, PDF docs shown as PDF placeholder image
 * - Remark textarea + Submit button (disabled if no changes)
 * - On success: navigate to SLCurrentUpdates
 *
 * MIGRATION DECISION:
 * Ionic ModalController → React Navigation modal stack screen.
 * Modal returns data via navigation params (useRoute after goBack).
 * We use a callback pattern via a shared ref or navigation state listener.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  GetListOfDocsBySLID,
  GetValidationForDocs,
  SaveAdditionalSLDocs,
} from '../../services/api';
import HelperService from '../../utils/helpers';

const API_IP = 'http://122.185.131.170:223/';

type AttachDocsRoute = { AttachNewDocs: { SLID: string; newDoc?: any } };

const AttachNewDocsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AttachDocsRoute, 'AttachNewDocs'>>();
  const { sessionToken } = useAppContext();

  const [docs, setDocs] = useState<any[]>([]);
  const [addedDocs, setAddedDocs] = useState<any[]>([]);
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingDocsLength, setExistingDocsLength] = useState(0);
  const compulsoryDocIDs = useRef<any[]>([]);
  const maxLengthDocIDList = useRef<any[]>([]);

  const SLID = route.params?.SLID ?? '0';

  const loadData = useCallback(async () => {
    if (!sessionToken) {
      return;
    }
    setIsLoading(true);
    try {
      const [docsRes, validationRes] = await Promise.all([
        GetListOfDocsBySLID(SLID, sessionToken),
        GetValidationForDocs(),
      ]);
      if (docsRes.IsSuccess) {
        const prefixed = (docsRes.Data ?? []).map((d: any) => ({
          ...d,
          DocumentURL: API_IP + d.DocumentURL,
        }));
        setDocs(prefixed);
        setExistingDocsLength(prefixed.length);
      } else {
        HelperService.showAlert('Error', docsRes.Msg);
      }
      if (validationRes.IsSuccess) {
        compulsoryDocIDs.current = validationRes.Data.ComplusoryDocID ?? [];
        maxLengthDocIDList.current =
          validationRes.Data.MaxLengthOfdocIDList ?? [];
      }
    } catch {
      HelperService.showAlert('Error', 'Error in web API');
    } finally {
      setIsLoading(false);
    }
  }, [SLID, sessionToken]);

  useFocusEffect(
    useCallback(() => {
      if (docs.length === 0) {
        loadData();
      }
      console.log(
        '[AttachNewDocs] Focused | SLID:',
        SLID,
        '| existing docs:',
        docs.length,
        '| added docs:',
        addedDocs.length,
      );
    }, [loadData, SLID, docs.length, addedDocs.length]),
  );

  // Listen for data returned from AddDocumentModal
  // Navigation state param 'newDoc' is set by modal on save
  useEffect(() => {
    const params = route.params as any;
    if (!params?.newDoc) {
      return;
    }

    const newDoc = params.newDoc;
    console.log('[AttachNewDocs] Received newDoc from modal:', newDoc);
    setAddedDocs(prev => [
      ...prev,
      {
        SalesLetterID: SLID,
        ProofName: newDoc.ProofName,
        Document_ID: newDoc.Document_ID,
        DocSubName: newDoc.DocSubName,
        DocumentURL: newDoc.DocBase64Str,
        DocBase64Str: newDoc.DocBase64Str,
        Str_ProofName: newDoc.ProofNameStr,
        Str_SLDoctyp_DocSubName: newDoc.DocSubNameStr,
      },
    ]);

    // Clear the param so it doesn't re-add on next focus
    navigation.setParams({ newDoc: undefined });
  }, [route.params, SLID, navigation]);

  const openModal = () => {
    console.log('[AttachNewDocs] Add Document button pressed | SLID:', SLID);
    navigation.navigate('AddDocumentModal', {
      compulsoryDocIDs: compulsoryDocIDs.current,
      maxLengthDocIDList: maxLengthDocIDList.current,
      returnScreen: 'AttachNewDocs',
      returnRouteKey: route.key,
    });
  };

  const handleSubmit = async () => {
    const docsForSubmit = [...docs, ...addedDocs].map(item => ({
      SalesLetterID: item.SalesLetterID ?? SLID,
      ProofName: item.ProofName,
      DocSubName: item.DocSubName,
      Document_ID: item.Document_ID ?? '',
      DocBase64Str:
        item.DocBase64Str ??
        (typeof item.DocumentURL === 'string' &&
        !item.DocumentURL.startsWith(API_IP)
          ? item.DocumentURL
          : ''),
      Str_ProofName: item.Str_ProofName ?? '',
      Str_SLDoctyp_DocSubName: item.Str_SLDoctyp_DocSubName ?? '',
    }));

    console.log(
      '[AttachNewDocs] Submit pressed | SLID:',
      SLID,
      '| remark:',
      remark,
      '| docs count:',
      docsForSubmit.length,
    );
    if (!sessionToken) {
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        SalesLetterID: SLID,
        Remark: remark,
        DocsList: docsForSubmit,
      };
      console.log(
        '[AttachNewDocs] Submitting payload:',
        JSON.stringify(payload),
      );
      // const res = await SaveAdditionalSLDocs(sessionToken, payload);
      // if (res.IsSuccess) {
      //   HelperService.showAlert('Success!!!', res.Data ?? res.Msg, () => {
      //     navigation.navigate('SLCurrentUpdates');
      //   });
      // } else {
      //   HelperService.showAlert('Error occurred', res.Data ?? res.Msg);
      // }
    } catch (e: any) {
      const msg =
        e?.message?.includes('Http failure') || e?.message?.includes('fetch')
          ? 'Our app server is down, please try after sometime.'
          : e?.message ?? 'Error in API.';
      HelperService.showAlert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const mergedDocs = [...docs, ...addedDocs];
  const isSubmitDisabled = remark === '' && addedDocs.length === 0;

  const renderDoc = ({ item }: { item: any }) => {
    const url: string = item.DocumentURL ?? '';
    const isPDF =
      url.endsWith('pdf') ||
      (!url.startsWith('data:image') && !url.endsWith('jpeg'));
    return (
      <View style={styles.docItem}>
        {!isPDF ? (
          <Image
            source={{ uri: url }}
            style={styles.docImage}
            resizeMode="cover"
          />
        ) : (
          <Image
            source={require('../../assets/imgs/pdfviewer.png')}
            style={styles.docImage}
            resizeMode="contain"
          />
        )}
        <Text style={styles.docLabel}>
          {item.Str_ProofName} {item.Str_SLDoctyp_DocSubName}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Add Document button */}
      <TouchableOpacity style={styles.addBtn} onPress={openModal}>
        <Text style={styles.addBtnText}>+ Add Document</Text>
      </TouchableOpacity>

      {/* Document grid */}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#3880ff" />
      ) : (
        <FlatList
          data={mergedDocs}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderDoc}
          numColumns={2}
          scrollEnabled={false}
          contentContainerStyle={styles.docGrid}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No documents yet.</Text>
          }
        />
      )}
      {/* Remark */}
      <Text style={styles.label}>Remark</Text>
      <TextInput
        style={styles.remarkInput}
        value={remark}
        onChangeText={setRemark}
        placeholder="Enter remarks..."
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={4}
      />

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitDisabled || isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitBtnText}>Submit</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  addBtn: {
    backgroundColor: '#3880ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loader: { marginVertical: 20 },
  docGrid: { paddingBottom: 12 },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  docItem: {
    margin: 6,
    alignItems: 'center',

    width: '48%', // Leaves space between the two items
    // alignItems: 'center',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
  },
  docImage: {
    // width: 80,
    // height: 80,
    aspectRatio: 1,
    borderRadius: 6,
    // backgroundColor: '#eee',

    width: '100%',
    height: 120,
    // borderRadius: 6,
  },
  docLabel: { fontSize: 11, color: '#555', textAlign: 'center', marginTop: 4 },
  label: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  remarkInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitBtn: {
    backgroundColor: '#3880ff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 20 },
});

export default AttachNewDocsScreen;
