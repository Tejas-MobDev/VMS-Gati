/**
 * MIGRATION NOTE:
 * Angular: payment-rec-without-amt.page.ts + .html
 * React Native: Simplified version of PaymentRecFromVendor — blank cheque reception.
 *
 * Key differences from PaymentRecFromVendor:
 * - No advance received field
 * - No vehicle list — only Epayment list
 * - Uses GetOnlyPendingEPayment_OfVendorCompanyWiseAndDropdownListData
 * - Uses GetReceivedPaymentWithoutAmountFromVendor for submission
 * - No amount input per item (blank cheque = no amount)
 * - Simpler form: Mode, Account/Cheque details, Customer name, Direct to Auth
 */
import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useAppContext } from '../../context/AppContext';
import {
  GetOnlyPendingEPayment_OfVendorCompanyWiseAndDropdownListData,
  GetReceivedPaymentWithoutAmountFromVendor,
  GetBankDetails,
} from '../../services/api';
import type {
  BankAccountDetail,
  DropdownItem,
  PaymentCompany,
  PaymentEpaymentItem,
  ReceivedPaymentWithoutAmtPayload,
} from '../../types/api';
import HelperService from '../../utils/helpers';

const emptyForm = () => ({
  VendorID: '',
  PaymentMode: '',
  ChqNeft_Number: '',
  ChequeDate: '',
  ChqNEFTOfBankNameMasterID: '',
  Branch_No: '',
  AccType: '',
  IFSCCode: '',
  AccHolderName: '',
  PaymentRecInCompany: '',
  AccountNumberForDD: '',
  AccountNumberForText: '',
  SalesLetter_Customer_Name: '',
  DirectPaymentToAuth: false,
});

const PaymentRecWithoutAmtScreen = () => {
  const navigation = useNavigation<any>();
  const { sessionToken, selectedVendorId, selectedVendorName } =
    useAppContext();

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<PaymentCompany[]>([]);
  const [paymentModeList, setPaymentModeList] = useState<DropdownItem[]>([]);
  const [bankNameList, setBankNameList] = useState<DropdownItem[]>([]);
  const [bankAccountTypeList, setBankAccountTypeList] = useState<DropdownItem[]>([]);
  const [bankDetails, setBankDetails] = useState<BankAccountDetail[]>([]);
  const [epaymentList, setEpaymentList] = useState<PaymentEpaymentItem[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [selectedPaymentModeText, setSelectedPaymentModeText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [show, setShow] = useState({
    AccountNo: true,
    ChqNo: true,
    ChqDt: true,
    BankName: true,
    BranchNo: true,
    AccountType: true,
    IFSC: true,
    AccHolderName: true,
    CustomerName: true,
  });
  const formScrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      setStep(0);
      setForm(emptyForm());
      setCompanies([]);
      setEpaymentList([]);

      if (!selectedVendorId || selectedVendorId === '0') {
        HelperService.showAlert(
          'Error',
          'Please go to dashboard and select a vendor.',
          () => navigation.goBack(),
        );
        return;
      }
      if (!sessionToken) {
        return;
      }

      setIsLoading(true);
      GetOnlyPendingEPayment_OfVendorCompanyWiseAndDropdownListData(
        selectedVendorId,
        sessionToken,
      )
        .then(res => {
          if (res.IsSuccess) {
            console.log('[Blank Cheque] data : ', res.Data);
            setPaymentModeList(res.Data.m_Item2?.[0] ?? []);
            setBankNameList(res.Data.m_Item2?.[1] ?? []);
            setBankAccountTypeList(res.Data.m_Item2?.[2] ?? []);
            setCompanies(res.Data.m_Item1 ?? []);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, selectedVendorId]),
  );

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');

      setField('ChequeDate', `${year}-${month}-${day}`);
    }
  };

  const setField = <K extends keyof ReturnType<typeof emptyForm>>(
    key: K,
    value: ReturnType<typeof emptyForm>[K],
  ) => setForm(prev => ({ ...prev, [key]: value }));

  const onCompanySelect = (company: PaymentCompany) => {
    console.log(
      '[PaymentRecWithoutAmt] Company selected:',
      company.CompanyName,
      '| CompanyID:',
      company.CompanyID,
    );
    const epayments = (
      JSON.parse(
        JSON.stringify(company.PaymentPendingListOfEpayment ?? []),
      ) as PaymentEpaymentItem[]
    ).map((e): PaymentEpaymentItem => ({ ...e, IsChecked: false }));
    setEpaymentList(epayments);
    console.log('[PaymentRecWithoutAmt] Epayment list:', epayments);
    setForm({
      ...emptyForm(),
      VendorID: selectedVendorId,
      PaymentRecInCompany: company.CompanyID.toString(),
    });
    setStep(1);
  };

  const toggleEpayment = (idx: number, checked: boolean) => {
    console.log(
      '[PaymentRecWithoutAmt] Epayment toggled | idx:',
      idx,
      '| checked:',
      checked,
    );
    const updated = [...epaymentList];
    updated[idx].IsChecked = checked;
    setEpaymentList(updated);
  };

  const onPaymentModeChange = async (modeId: string) => {
    console.log('[PaymentRecWithoutAmt] Payment mode changed:', modeId);
    setField('PaymentMode', modeId);
    const mode = paymentModeList.find(m => m.ID.toString() === modeId);
    setSelectedPaymentModeText(mode?.Name ?? '');
    setForm(prev => ({
      ...prev,
      PaymentMode: modeId,
      ChqNEFTOfBankNameMasterID: '',
      Branch_No: '',
      AccType: '',
      IFSCCode: '',
      AccHolderName: '',
      ChqNeft_Number: '',
      ChequeDate: '',
      SalesLetter_Customer_Name: '',
      AccountNumberForDD: '',
      AccountNumberForText: '',
    }));
    const id = parseInt(modeId, 10);
    if (id === 33 || id === 34) {
      setShow({
        AccountNo: true,
        ChqNo: true,
        ChqDt: true,
        BankName: true,
        BranchNo: true,
        AccountType: true,
        IFSC: true,
        AccHolderName: true,
        CustomerName: false,
      });
      if (sessionToken) {
        const res = await GetBankDetails(
          sessionToken,
          modeId,
          selectedVendorId,
          '',
          '',
        );
        if (res.IsSuccess) {
          setBankDetails(res.Data ?? []);
        }
      }
    } else if (id === 35) {
      setShow({
        AccountNo: false,
        ChqNo: false,
        ChqDt: true,
        BankName: false,
        BranchNo: false,
        AccountType: false,
        IFSC: false,
        AccHolderName: false,
        CustomerName: false,
      });
    } else if (id === 4097 || id === 4098) {
      setShow({
        AccountNo: true,
        ChqNo: true,
        ChqDt: true,
        BankName: true,
        BranchNo: true,
        AccountType: true,
        IFSC: true,
        AccHolderName: true,
        CustomerName: true,
      });
    } else if (id === 5100) {
      setShow({
        AccountNo: false,
        ChqNo: false,
        ChqDt: true,
        BankName: false,
        BranchNo: false,
        AccountType: false,
        IFSC: false,
        AccHolderName: false,
        CustomerName: true,
      });
    }
  };

  const validateAndNext = () => {
    console.log(
      '[PaymentRecWithoutAmt] Next pressed | form:',
      JSON.stringify(form),
    );
    const f = form;
    const mode = parseInt(f.PaymentMode, 10);
    if (!f.PaymentMode || !f.PaymentRecInCompany) {
      HelperService.showAlert('Error', 'Please select payment mode.');
      return;
    }
    if (f.IFSCCode && f.IFSCCode.length !== 11) {
      HelperService.showAlert('Error', 'Please enter 11 digit IFSC no.');
      return;
    }
    const acNo = f.AccountNumberForDD || f.AccountNumberForText;
    if (
      (mode === 33 || mode === 34) &&
      (!acNo ||
        !f.ChqNeft_Number ||
        !f.ChequeDate ||
        !f.ChqNEFTOfBankNameMasterID)
    ) {
      HelperService.showAlert('Error', 'Please enter all Details.');
      return;
    }
    setStep(3);
  };

  const handleInputFocus = () => {
    // Push focused field above keyboard in long forms.
    setTimeout(() => {
      formScrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const f = form;
    const accNo = f.AccountNumberForDD || f.AccountNumberForText;
    const payload: ReceivedPaymentWithoutAmtPayload = {
      VendorAndBankdetails: {
        ...f,
        VendorID: String(f.VendorID || selectedVendorId || ''),
        PaymentMode: String(f.PaymentMode || ''),
        PaymentRecInCompany: String(f.PaymentRecInCompany || ''),
        DirectPaymentToAuth: Boolean(f.DirectPaymentToAuth),
        Acc_No: accNo,
      },
      EpaymentSalesOrderPaymentRecList: epaymentList
        .filter(e => e.IsChecked)
        .map(e => ({
          ...e,
          IsChecked: true,
        })),
    };
    try {
      console.log(
        '[PaymentRecWithoutAmt] Submit pressed | payload form:',
        payload,
      );
      const res = await GetReceivedPaymentWithoutAmountFromVendor(
        payload,
        sessionToken!,
      );
      if (res.IsSuccess) {
        HelperService.showAlert('Success!', res.Msg, () => {
          setStep(0);
          setForm(emptyForm());
        });
      } else {
        HelperService.showAlert('Error', res.Msg);
      }
    } catch {
      HelperService.showAlert('Error', 'Error in API.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loaderFull}>
        <ActivityIndicator size="large" color="#3880ff" />
      </View>
    );
  }

  if (step === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.vendorLabel}>Vendor: {selectedVendorName}</Text>
        <FlatList
          data={companies}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.companyItem}
              onPress={() => onCompanySelect(item)}
            >
              <Text style={styles.companyName}>{item.CompanyName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.SumOfMoneyPendingOfEpayment ?? 0}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No companies found.</Text>
          }
          contentContainerStyle={{ padding: 12 }}
        />
      </View>
    );
  }

  if (step === 1) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ padding: 12 }}
      >
        <Text style={styles.sectionTitle}>Select Epayments (Blank Cheque)</Text>
        {epaymentList.map((item, idx) => (
          <View key={idx} style={styles.selectionCard}>
            <View style={styles.selectionRow}>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.cardTitle}>{item.InternalVendorName}</Text>
                <Text style={styles.detail}>
                  Dispatched On: {item.VehicleDispatchedDt}
                </Text>
                <Text style={styles.detail}>Aging: {item.Aging ?? 0}</Text>

                <Text style={styles.detail}>Chassis No: {item.ChessisNo}</Text>
                <Text style={styles.detail}>Engine No: {item.EngineNo}</Text>

                <Text style={styles.detail}>
                  {item.ProductName}, {item.ColorName}
                </Text>
                <Text style={styles.detail}>{item.StrSalesType}</Text>
                <Text style={styles.detail}>
                  Approx Epayment: {item.TotalEpaymentRecAmt ?? 0}
                </Text>
                <Text style={styles.detail}>
                  Paid till Now: {item.PaidTillNow ?? 0}
                </Text>
                <Text style={styles.detail}>Pending : {item.Balance}</Text>
              </View>
              <Switch
                value={item.IsChecked}
                onValueChange={v => toggleEpayment(idx, v)}
                // trackColor={{ true: '#3880ff' }}
              />
            </View>
          </View>
        ))}
        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(0)}>
            <Text style={styles.btnText}>
              {/* <AntDesign name="arrow-left" size={14} color="#fff" /> */}
              Back
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(2)}>
            <Text style={styles.btnText}>Next</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (step === 2) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 24}
      >
        <ScrollView
          ref={formScrollRef}
          style={styles.container}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Cheque Details</Text>

        <Text style={styles.label}>Payment Mode</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={form.PaymentMode}
            onValueChange={onPaymentModeChange}
            style={styles.picker}
          >
            <Picker.Item label="Select Mode" value="" />
            {paymentModeList.map(m => (
              <Picker.Item key={m.ID} label={m.Name} value={m.ID.toString()} />
            ))}
          </Picker>
        </View>

        {show.AccountNo && (
          <>
            <Text style={styles.label}>Account Number</Text>
            {bankDetails.length > 0 ? (
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.AccountNumberForDD}
                  onValueChange={v => setField('AccountNumberForDD', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Account" value="" />
                  {bankDetails.map((b, i) => (
                    <Picker.Item
                      key={i}
                      label={b.AccountNumber}
                      value={b.AccountNumber}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={form.AccountNumberForText}
                onChangeText={v => setField('AccountNumberForText', v)}
                placeholder="Account number"
                placeholderTextColor="#aaa"
                onFocus={handleInputFocus}
              />
            )}
          </>
        )}

        {show.ChqNo && (
          <>
            <Text style={styles.label}>Cheque / Ref Number</Text>
            <TextInput
              style={styles.input}
              value={form.ChqNeft_Number}
              onChangeText={v => setField('ChqNeft_Number', v)}
              placeholder="Cheque/Ref No"
              placeholderTextColor="#aaa"
              onFocus={handleInputFocus}
            />
          </>
        )}

        {show.ChqDt && (
          <>
            <Text style={styles.label}>Cheque Date</Text>
            {/* <TextInput
              style={styles.input}
              value={form.ChequeDate}
              onChangeText={v => setField('ChequeDate', v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#aaa"
            /> */}

            <TouchableOpacity
              style={styles.input}
              activeOpacity={0.7}
              onPress={() => setShowDatePicker(true)}
            >
              <Text
                style={{
                  color: form.ChequeDate ? '#000' : '#aaa',
                  fontSize: 16,
                }}
              >
                {form.ChequeDate || 'Select Cheque Date'}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={form.ChequeDate ? new Date(form.ChequeDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                // maximumDate={new Date()}
                // minimumDate={new Date()}
              />
            )}
          </>
        )}

        {show.BankName && (
          <>
            <Text style={styles.label}>Bank Name</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.ChqNEFTOfBankNameMasterID}
                onValueChange={v => setField('ChqNEFTOfBankNameMasterID', v)}
                style={styles.picker}
                mode={Platform.OS === 'android' ? 'dialog' : undefined}
              >
                <Picker.Item label="Select Bank" value="" />
                {bankNameList.map(b => (
                  <Picker.Item
                    key={b.ID}
                    label={b.Name}
                    value={b.ID.toString()}
                  />
                ))}
              </Picker>
            </View>
          </>
        )}

        {show.BranchNo && (
          <>
            <Text style={styles.label}>Branch</Text>
            <TextInput
              style={styles.input}
              value={form.Branch_No}
              onChangeText={v => setField('Branch_No', v)}
              placeholder="Branch"
              placeholderTextColor="#aaa"
              onFocus={handleInputFocus}
            />
          </>
        )}

        {show.AccountType && (
          <>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.AccType}
                onValueChange={v => setField('AccType', v)}
                style={styles.picker}
              >
                <Picker.Item label="Select Type" value="" />
                {bankAccountTypeList.map(a => (
                  <Picker.Item
                    key={a.ID}
                    label={a.Name}
                    value={a.ID.toString()}
                  />
                ))}
              </Picker>
            </View>
          </>
        )}

        {show.IFSC && (
          <>
            <Text style={styles.label}>IFSC Code</Text>
            <TextInput
              style={styles.input}
              value={form.IFSCCode}
              onChangeText={v => setField('IFSCCode', v)}
              placeholder="11-digit IFSC"
              placeholderTextColor="#aaa"
              maxLength={11}
              autoCapitalize="characters"
              onFocus={handleInputFocus}
            />
          </>
        )}

        {show.AccHolderName && (
          <>
            <Text style={styles.label}>Account Holder Name</Text>
            <TextInput
              style={styles.input}
              value={form.AccHolderName}
              onChangeText={v => setField('AccHolderName', v)}
              placeholder="Account Holder Name"
              placeholderTextColor="#aaa"
              onFocus={handleInputFocus}
            />
          </>
        )}

        {show.CustomerName && (
          <>
            <Text style={styles.label}>Customer Name</Text>
            <TextInput
              style={styles.input}
              value={form.SalesLetter_Customer_Name}
              onChangeText={v => setField('SalesLetter_Customer_Name', v)}
              placeholder="Customer Name"
              placeholderTextColor="#aaa"
              onFocus={handleInputFocus}
            />
          </>
        )}

        <View style={styles.switchRow}>
          <Text style={styles.label}>Direct Payment to Auth</Text>
          <Switch
            value={form.DirectPaymentToAuth as boolean}
            onValueChange={v => setField('DirectPaymentToAuth', v)}
          />
        </View>

        <View style={styles.navButtons}>
          <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(1)}>
            <Text style={styles.btnText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextBtn} onPress={validateAndNext}>
            <Text style={styles.btnText}>Review</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.formContent}
    >
      <Text style={styles.sectionTitle}>Review</Text>
      <View style={styles.reviewCard}>
        <Text style={styles.reviewRow}>Vendor: {selectedVendorName}</Text>
        <Text style={styles.reviewRow}>
          Payment Mode: {selectedPaymentModeText}
        </Text>
        <Text style={styles.reviewRow}>Cheque No: {form.ChqNeft_Number}</Text>
        <Text style={styles.reviewRow}>Date: {form.ChequeDate}</Text>
        <Text style={styles.reviewRow}>
          Epayments: {epaymentList.filter(e => e.IsChecked).length}
        </Text>
      </View>
      <View style={styles.navButtons}>
        <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(2)}>
          <Text style={styles.btnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.btnText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loaderFull: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  vendorLabel: {
    padding: 12,
    fontWeight: '700',
    fontSize: 12,
    color: '#333',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  companyName: {
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  badge: {
    flexShrink: 0,
    backgroundColor: '#3880ff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 32,
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  selectionCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  selectionRow: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontWeight: '600', fontSize: 14, color: '#222' },
  detail: { fontSize: 12, color: '#555', marginTop: 2 },
  navButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
  },
  prevBtn: {
    flex: 1,
    backgroundColor: '#92949c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: '#3880ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#0e9444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  formContent: { padding: 16 },
  label: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 12,
  },
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
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    overflow: 'hidden',
  },
  picker: { color: '#222' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
  },
  reviewRow: { fontSize: 14, color: '#444', marginBottom: 6 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default PaymentRecWithoutAmtScreen;
