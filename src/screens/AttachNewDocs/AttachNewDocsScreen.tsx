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
 * Ionic ModalController -> React Navigation modal stack screen.
 * Modal returns data via navigation params (useRoute after goBack).
 */
import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { DocGridSkeleton } from '../../components/DocGridSkeleton';
import { ButtonSkeleton } from '../../components/ButtonSkeleton';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../../context/AppContext';
import {
  GetListOfDocsBySLID,
  GetValidationForDocs,
  SaveAdditionalSLDocs,
} from '../../services/api';
import type {
  DocLengthRule,
  NewDocumentData,
  SalesLetterDocument,
} from '../../types/api';
import HelperService from '../../utils/helpers';
import Config from 'react-native-config';

const API_IP = Config.API_URL;

type AttachDocsRoute = {
  AttachNewDocs: { SLID: string; newDoc?: NewDocumentData };
};

const AttachNewDocsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AttachDocsRoute, 'AttachNewDocs'>>();
  const { sessionToken } = useAppContext();

  const [docs, setDocs] = useState<SalesLetterDocument[]>([]);
  const [remark, setRemark] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [existingDocsLength, setExistingDocsLength] = useState(0);
  const compulsoryDocIDs = useRef<number[]>([]);
  const maxLengthDocIDList = useRef<DocLengthRule[]>([]);
  const lastHandledDocKey = useRef('');
  const scrollViewRef = useRef<ScrollView>(null);

  const SLID = route.params?.SLID ?? '0';

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('SLCurrentUpdates');
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleBack]);

  const loadData = useCallback(async () => {
    console.log('[AttachNewDocs] Loading data...');

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
        const prefixed = (docsRes.Data ?? []).map((d): SalesLetterDocument => ({
          ...d,
          DocumentURL: (API_IP ?? '') + (d.DocumentURL ?? ''),
        }));
        setDocs(prev => {
          const apiBase = API_IP ?? '';
          const localAddedDocs = prev.filter(
            doc => !(doc?.DocumentURL ?? '').startsWith(apiBase),
          );
          return [...prefixed, ...localAddedDocs];
        });
        console.log('[AttachNewDocs] Loaded docs:', prefixed);
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

  const appendReturnedDoc = useCallback(
    (newDoc: NewDocumentData | undefined) => {
      if (!newDoc) {
        return;
      }
      const docKey = `${newDoc.ProofName}-${newDoc.DocSubName}-${newDoc.Document_ID}-${(newDoc.DocBase64Str ?? '').length}`;
      if (docKey === lastHandledDocKey.current) {
        return;
      }

      console.log('[AttachNewDocs] Appending returned newDoc:', newDoc);
      setDocs(prev => [
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
      lastHandledDocKey.current = docKey;
      navigation.setParams({ newDoc: undefined });
    },
    [SLID, navigation],
  );

  useFocusEffect(
    useCallback(() => {
      const incomingDoc = route.params?.newDoc;
      if (incomingDoc) {
        appendReturnedDoc(incomingDoc);
      }

      if (docs.length === 0) {
        loadData();
      }
      console.log(
        '[AttachNewDocs] Focused | SLID:',
        SLID,
        '| existing docs:',
        docs.length,
      );
    }, [appendReturnedDoc, loadData, route.params, SLID, docs.length]),
  );

  const openModal = () => {
    console.log(
      '[AttachNewDocs] Add Document button pressed | SLID:',
      SLID,
    );
    navigation.navigate('AddDocumentModal', {
      compulsoryDocIDs: compulsoryDocIDs.current,
      maxLengthDocIDList: maxLengthDocIDList.current,
      returnScreen: 'AttachNewDocs',
      returnRouteKey: route.key,
      returnSLID: SLID,
    });
  };

  const handleSubmit = async () => {
    const docsForSubmit = docs.map(item => ({
      SalesLetterID: item.SalesLetterID ?? SLID,
      ProofName: item.ProofName,
      DocSubName: item.DocSubName,
      Document_ID: item.Document_ID ?? '',
      DocumentURL:
        item.DocumentURL ??
        (typeof item.DocBase64Str === 'string' ? item.DocBase64Str : ''),
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
      const res = await SaveAdditionalSLDocs(sessionToken, payload);
      if (res.IsSuccess) {
        HelperService.showAlert('Success!!!', res.Data ?? res.Msg, () => {
          navigation.navigate('SLCurrentUpdates');
        });
      } else {
        HelperService.showAlert('Error occurred', res.Data ?? res.Msg);
      }
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

  const mergedDocs = docs;
  const isSubmitDisabled = remark === '' && docs.length <= existingDocsLength;

  const renderDoc = ({ item }: { item: SalesLetterDocument }) => {
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

  const handleRemarkFocus = () => {
    // Ensure remark input is visible when keyboard opens.
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 24}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Add Document button */}
        <TouchableOpacity style={styles.addBtn} onPress={openModal}>
          <Text style={styles.addBtnText}>+ Add Document</Text>
        </TouchableOpacity>

        {/* Document grid */}

        {isLoading ? (
          <DocGridSkeleton itemCount={4} />
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
          onFocus={handleRemarkFocus}
        />

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, isSubmitDisabled && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled || isLoading}
        >
          {isLoading ? (
            <ButtonSkeleton />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  backButton: { padding: 4 },
  addBtn: {
    backgroundColor: '#3880ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
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
