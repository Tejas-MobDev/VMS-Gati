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
 *   react-native-document-picker (DocumentPicker.pickSingle)
 *   File is read as base64 using react-native-fs or converted from blob.
 *
 * Libraries needed:
 *   - react-native-document-picker (already in package.json)
 *   - react-native-blob-util OR react-native-fs for base64 file reading
 *     (install separately: npm install react-native-blob-util)
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
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  CommonActions,
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { GetMobileDropDownList } from '../../services/api';
import HelperService from '../../utils/helpers';

type AddDocRoute = {
  AddDocumentModal: {
    compulsoryDocIDs: any[];
    maxLengthDocIDList: any[];
    returnScreen: string;
    returnRouteKey?: string;
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
  } = route.params ?? {};

  const [docTypeList, setDocTypeList] = useState<any[]>([]);
  const [allSubDocList, setAllSubDocList] = useState<any[]>([]);
  const [filteredSubDocList, setFilteredSubDocList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [newDocData, setNewDocData] = useState({
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

  const setField = (key: keyof typeof newDocData, value: any) =>
    setNewDocData(prev => ({ ...prev, [key]: value }));

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

  const selectPDF = () => {
    console.log('[AddDocumentModal] Upload PDF button pressed');
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.8,
      },
      response => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          HelperService.showAlert(
            'Error',
            response.errorMessage ?? 'File picker error.',
          );
          return;
        }
        const asset = response.assets?.[0];
        if (!asset) {
          return;
        }

        // Check file size (200KB limit)
        if (asset.fileSize && asset.fileSize > 200000) {
          HelperService.showAlert(
            'File size issue',
            'Please Select PDF file less than 200KB',
          );
          return;
        }

        if (!asset.base64) {
          HelperService.showAlert('Error', 'Could not read file.');
          return;
        }

        setField('DocBase64Str', asset.base64);
      },
    );
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

    // Pass data back to the exact previous route, then close modal.
    console.log(
      '[AddDocumentModal] Data passing to return screen:',
      JSON.stringify(newDocData),
    );
    if (returnRouteKey) {
      navigation.dispatch(
        CommonActions.setParams({
          params: { newDoc: newDocData },
          source: returnRouteKey,
        }),
      );
      navigation.goBack();
      return;
    }

    navigation.navigate({
      name: returnScreen,
      params: { newDoc: newDocData },
      merge: true,
    } as never);
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

      {isLoading && <ActivityIndicator style={styles.loader} color="#3880ff" />}

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
  loader: { marginVertical: 12 },
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
