/**
 * MIGRATION NOTE:
 * Angular: add-document-modal.page.ts + .html — uses Ionic ModalController
 * React Native: Full screen modal in the navigation stack.
 *
 * MIGRATION DECISION:
 * Ionic ModalController (overlay) → React Navigation screen pushed on stack.
 * On save, passes data back to AttachNewDocs via navigation params:
 *   navigation.navigate('AttachNewDocs', { newDoc: {...} })
 * On cancel, simply goBack().
 *
 * Capacitor FilePicker (@capawesome/capacitor-file-picker) →
 *   @react-native-documents/picker + react-native-fs.
 *   We pick only PDF files from device file manager and read them as base64.
 *
 * All validation logic preserved exactly from Angular:
 * - ProofName + DocSubName required
 * - Document_ID max length validation from MaxLengthOfdocIDList
 * - Document_ID required if in ComplusoryDocID list
 * - PDF file only, max 200KB
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types as docTypes,
} from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import {
  CommonActions,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { GetMobileDropDownList } from '../../services/api';
import type {
  DocLengthRule,
  MobileDropdownItem,
  NewDocumentData,
} from '../../types/api';
import HelperService from '../../utils/helpers';

type AddDocRoute = {
  AddDocumentModal: {
    compulsoryDocIDs: number[];
    maxLengthDocIDList: DocLengthRule[];
    returnScreen: string;
    returnRouteKey?: string;
    returnSLID?: string;
  };
};

const AddDocumentModalScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AddDocRoute, 'AddDocumentModal'>>();

  const {
    compulsoryDocIDs = [],
    maxLengthDocIDList = [],
    returnScreen = 'AttachNewDocs',
    returnRouteKey,
    returnSLID,
  } = route.params ?? {};

  const [docTypeList, setDocTypeList] = useState<MobileDropdownItem[]>([]);
  const [allSubDocList, setAllSubDocList] = useState<MobileDropdownItem[]>([]);
  const [filteredSubDocList, setFilteredSubDocList] = useState<MobileDropdownItem[]>([]);

  const [newDocData, setNewDocData] = useState<NewDocumentData>({
    ProofName: 0,
    DocSubName: 0,
    DocBase64Str: '',
    ProofNameStr: '',
    DocSubNameStr: '',
    Document_ID: '',
  });

  // Load dropdown lists on mount (replaces constructor API calls)
  useEffect(() => {
    Promise.all([
      GetMobileDropDownList('SalesLetterDocTypeList'),
      GetMobileDropDownList('SalesLetterSubDocList'),
    ]).then(([typeRes, subRes]) => {
      if (typeRes.IsSuccess) {
        setDocTypeList(typeRes.Data ?? []);
      }
      if (subRes.IsSuccess) {
        setAllSubDocList(subRes.Data ?? []);
      }
    });
  }, []);

  const setField = <K extends keyof NewDocumentData>(
    key: K,
    value: NewDocumentData[K],
  ) => setNewDocData(prev => ({ ...prev, [key]: value }));

  const onDocTypeChange = (value: string) => {
    console.log('[AddDocumentModal] Doc type changed:', value);
    const id = parseInt(value, 10);
    setField('ProofName', id);
    setField('DocSubName', 0);
    setField('DocSubNameStr', '');

    // Filter sub-docs by parent type (replaces GetSubDoc)
    const filtered = allSubDocList.filter(item =>
      (item.Optional ?? []).includes(id),
    );
    setFilteredSubDocList(filtered);

    const selected = docTypeList.find(item => item.ID === id);
    setField('ProofNameStr', selected?.Name ?? '');
  };

  const onSubDocChange = (value: string) => {
    console.log('[AddDocumentModal] Sub-doc changed:', value);
    const id = parseInt(value, 10);
    setField('DocSubName', id);
    const selected = allSubDocList.find(item => item.ID === id);
    setField('DocSubNameStr', selected?.Name ?? '');
  };

  const selectPDF = async () => {
    console.log('[AddDocumentModal] Upload PDF button pressed');

    try {
      const [pickedFile] = await pick({
        type: [docTypes.pdf],
        allowMultiSelection: false,
      });

      if (!pickedFile?.hasRequestedType) {
        HelperService.showAlert('Error', 'File is not PDF');
        return;
      }

      const mimeType = (pickedFile?.type ?? '').toLowerCase();
      if (mimeType && mimeType !== 'application/pdf') {
        HelperService.showAlert('Error', 'File is not PDF');
        return;
      }

      const fileSize = Number(pickedFile?.size ?? 0);
      if (fileSize > 200000) {
        HelperService.showAlert('Error', 'File is more than 200kb');
        return;
      }

      let copyUri = pickedFile?.uri;
      if (Platform.OS === 'android' && copyUri?.startsWith('content://')) {
        const fileName = pickedFile?.name ?? `doc_${Date.now()}.pdf`;
        const [copyResult] = await keepLocalCopy({
          destination: 'cachesDirectory',
          files: [{ uri: copyUri, fileName }],
        });

        if (copyResult?.status !== 'success' || !copyResult.localUri) {
          HelperService.showAlert('Error', 'Unable to read selected file');
          return;
        }

        copyUri = copyResult.localUri;
      }

      if (!copyUri) {
        HelperService.showAlert('Error', 'No file is selected');
        return;
      }

      const localPath = copyUri.startsWith('file://')
        ? copyUri.replace('file://', '')
        : copyUri;
      const base64String = await RNFS.readFile(localPath, 'base64');

      if (!base64String) {
        HelperService.showAlert('Error', 'No file is selected');
        return;
      }

      setField('DocBase64Str', base64String);
    } catch (error) {
      const isCancelError =
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED;

      if (isCancelError) {
        return;
      }
      HelperService.showAlert('Error', 'File picker error.');
    }
  };

  const handleSave = () => {
    console.log(
      '[AddDocumentModal] Save button pressed | data:',
      JSON.stringify(newDocData),
    );
    let errorText = '';

    if (!newDocData.ProofName || !newDocData.DocSubName) {
      errorText += 'Please fill document type & doc name\n';
    }

    // Max length validation
    if (newDocData.Document_ID) {
      const rule = maxLengthDocIDList.find(
        it => it.m_Item1 === newDocData.DocSubName,
      );
      if (rule && rule.m_Item2 !== newDocData.Document_ID.length) {
        errorText += `Document ID of ${newDocData.DocSubNameStr} length should be ${rule.m_Item2} digits.\n`;
      }
    }

    // Compulsory doc ID validation
    if (compulsoryDocIDs.includes(newDocData.DocSubName)) {
      if (!newDocData.Document_ID) {
        errorText += `Document ID is compulsory for ${newDocData.DocSubNameStr}`;
      }
    }

    if (errorText) {
      HelperService.showAlert('Error occurred', errorText);
      return;
    }

    // Pass data back to AttachNewDocs and close modal.
    console.log(
      '[AddDocumentModal] Data passing to return screen:',
      JSON.stringify(newDocData),
    );
    if (returnRouteKey) {
      navigation.dispatch(
        CommonActions.setParams({
          source: returnRouteKey,
          params: { newDoc: newDocData },
        }),
      );
    }

    navigation.navigate(
      returnScreen,
      { SLID: returnSLID, newDoc: newDocData },
      { merge: true },
    );
  };

  const handleCancel = () => {
    console.log('[AddDocumentModal] Cancel pressed');
    navigation.goBack();
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Document Type */}
      <Text style={styles.label}>Document Type</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={newDocData.ProofName.toString()}
          onValueChange={onDocTypeChange}
          style={styles.picker}
        >
          <Picker.Item label="Select Document Type : " value="0" />
          {docTypeList.map(item => (
            <Picker.Item
              key={item.ID}
              label={item.Name}
              value={item.ID.toString()}
            />
          ))}
        </Picker>
      </View>

      {/* Document Sub-type */}
      <Text style={styles.label}>Document Name</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={newDocData.DocSubName.toString()}
          onValueChange={onSubDocChange}
          style={styles.picker}
        >
          <Picker.Item label="Select Document Name" value="0" />
          {filteredSubDocList.map(item => (
            <Picker.Item
              key={item.ID}
              label={item.Name}
              value={item.ID.toString()}
            />
          ))}
        </Picker>
      </View>

      {/* Document ID */}
      <Text style={styles.label}>Document ID Number</Text>
      <TextInput
        style={styles.input}
        value={newDocData.Document_ID}
        onChangeText={v => setField('Document_ID', v)}
        placeholder="Enter document ID"
        placeholderTextColor="#aaa"
      />

      {/* Upload PDF */}
      <TouchableOpacity style={styles.uploadBtn} onPress={selectPDF}>
        <Text style={styles.uploadBtnText}>📎 Upload PDF</Text>
      </TouchableOpacity>

      {/* Preview */}
      {newDocData.DocBase64Str ? (
        <View style={styles.previewContainer}>
          {newDocData.DocBase64Str.startsWith('data:image') ? (
            <Image
              source={{ uri: newDocData.DocBase64Str }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <Image
              source={require('../../assets/imgs/pdfviewer.png')}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
          <Text style={styles.previewLabel}>File selected ✓</Text>
        </View>
      ) : null}
      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  label: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 14,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: { color: '#222' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#fafafa',
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: '#3880ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadBtnText: { color: '#3880ff', fontWeight: '600', fontSize: 14 },
  previewContainer: { alignItems: 'center', marginTop: 12 },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    // backgroundColor: '#eee',
  },
  previewLabel: { color: '#1e7541', fontWeight: '600', marginTop: 6 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#92949c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3880ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default AddDocumentModalScreen;
