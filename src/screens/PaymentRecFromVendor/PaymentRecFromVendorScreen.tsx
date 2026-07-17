/**
 * MIGRATION NOTE:
 * Angular: payment-rec-from-vendor.page.ts + .html
 * React Native: 4-step wizard using state-based step management.
 *
 * Swiper (Angular) → step-based View switching (React Native).
 * No external carousel library needed — just step index state.
 *
 * Steps:
 *   0 - Company selection (list of companies with pending payment)
 *   1 - Vehicle / Epayment selection (checkboxes + amount input per item)
 *   2 - Payment form (mode, bank details, amounts — conditional fields)
 *   3 - Review + Submit
 *
 * All validation logic from Angular's next() method is preserved exactly.
 * All payment mode IDs preserved:
 *   33 = Dealer-Cheque, 34 = Dealer-Online, 35 = Dealer-Cash
 *   600 = Disbursement-Cheque, 601 = Disbursement-Online
 *   4097 = Customer-Cheque, 4098 = Customer-Online, 5100 = Customer-Cash
 *
 * ReactiveForm (Angular) → useState object (React Native).
 * FormBuilder → plain state object with field names matching original form.
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { CompanyListSkeleton } from '../../components/CompanyListSkeleton';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../context/AppContext';
import {
  GetPendingPaymentOfVendorCompanyWiseAndDropdownListData,
  ReceivedPaymentFromVendor,
  GetBankDetails,
  IsChequOrPaymentNumberAvail,
  CheckPurchaseVendorFromSalesOrderDetID,
} from '../../services/api';
import type {
  BankAccountDetail,
  DropdownItem,
  PaymentCompany,
  PaymentEpaymentItem,
  PaymentVehicleItem,
} from '../../types/api';
import HelperService from '../../utils/helpers';

const emptyForm = () => ({
  VendorID: '',
  PaymentMode: '',
  Acc_No: '',
  ChqNeft_Number: '',
  ChequeDate: '',
  RecievedAmt: '',
  AdvanceRecieved: '',
  ChqNEFTOfBankNameMasterID: '',
  Branch_No: '',
  AccType: '',
  IFSCCode: '',
  AccHolderName: '',
  PaymentRecInCompany: '',
  AccountNumberForDD: '',
  AccountNumberForText: '',
  SalesLetter_Customer_Name: '',
  DSABankMasterID: '',
  HypothicationMasterID: '',
  DirectPaymentToAuth: false,
  AdvancePaymentRemark: '',
});

type FormData = ReturnType<typeof emptyForm>;
type Step1TabType = 'Vehicle' | 'Epayment';

const parseDateFromYmd = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!match) {
    return new Date();
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsed = new Date(year, monthIndex, day);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateToYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toNumberOrZero = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const PaymentRecFromVendorScreen = () => {
  const navigation = useNavigation<any>();
  const { sessionToken, selectedVendorId, selectedVendorName, designation } =
    useAppContext();

  const [step, setStep] = useState(0);
  const [step1ActiveTab, setStep1ActiveTab] = useState<Step1TabType>('Vehicle');
  const [isLoading, setIsLoading] = useState(false);

  // Master data
  const [companies, setCompanies] = useState<PaymentCompany[]>([]);
  const [paymentModeList, setPaymentModeList] = useState<DropdownItem[]>([]);
  const [hypothicationList, setHypothicationList] = useState<DropdownItem[]>([]);
  const [dsaList, setDsaList] = useState<DropdownItem[]>([]);
  const [bankNameList, setBankNameList] = useState<DropdownItem[]>([]);
  const [bankAccountTypeList, setBankAccountTypeList] = useState<DropdownItem[]>([]);
  const [bankDetails, setBankDetails] = useState<BankAccountDetail[]>([]);

  // Selected company data
  const [vehicleList, setVehicleList] = useState<PaymentVehicleItem[]>([]);
  const [epaymentList, setEpaymentList] = useState<PaymentEpaymentItem[]>([]);

  // Form
  const [form, setForm] = useState<FormData>(emptyForm());
  const [selectedPaymentModeText, setSelectedPaymentModeText] = useState('');
  const [adjustedAmount, setAdjustedAmount] = useState(0);
  const [autoCalcTotal, setAutoCalcTotal] = useState(0);
  const [showChequeDatePicker, setShowChequeDatePicker] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollContentStyle = (baseStyle: object) => [
    baseStyle,
    { paddingBottom: 24 + keyboardHeight },
  ];

  // Field visibility (mirrors ShowXxx booleans)
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
    FinancerName: true,
    DSAName: true,
  });

  const resetAll = () => {
    setForm(emptyForm());
    setAdjustedAmount(0);
    setAutoCalcTotal(0);
    setSelectedPaymentModeText('');
    setBankDetails([]);
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
      FinancerName: true,
      DSAName: true,
    });
  };

  useFocusEffect(
    useCallback(() => {
      setStep(0);
      resetAll();
      setCompanies([]);
      setVehicleList([]);
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
      GetPendingPaymentOfVendorCompanyWiseAndDropdownListData(
        selectedVendorId,
        designation ?? '',
        sessionToken,
      )
        .then(res => {
          if (res.IsSuccess) {
            setPaymentModeList(res.Data.m_Item2[0] ?? []);
            setHypothicationList(res.Data.m_Item2[1] ?? []);
            setDsaList(res.Data.m_Item2[2] ?? []);
            setBankNameList(res.Data.m_Item2[3] ?? []);
            setBankAccountTypeList(res.Data.m_Item2[4] ?? []);
            setCompanies(res.Data.m_Item1 ?? []);
          } else {
            HelperService.showAlert('Error', res.Msg);
          }
        })
        .catch(() => HelperService.showAlert('Error', 'Error in API.'))
        .finally(() => setIsLoading(false));
    }, [sessionToken, selectedVendorId, designation]),
  );

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const onChequeDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowChequeDatePicker(false);
    if (event.type === 'dismissed' || !selectedDate) {
      return;
    }
    setField('ChequeDate', formatDateToYmd(selectedDate));
  };

  const onCompanySelect = (company: PaymentCompany) => {
    console.log(
      '[PaymentRecFromVendor] Company selected:',
      company.CompanyName,
      '| CompanyID:',
      company.CompanyID,
    );
    // Deep copy to avoid mutating master data
    const vehicles = JSON.parse(
      JSON.stringify(company.PaymentPendingList ?? []),
    ) as PaymentVehicleItem[];
    const rawEpayments = JSON.parse(
      JSON.stringify(company.PaymentPendingListOfEpayment ?? []),
    ) as PaymentEpaymentItem[];

    // Epayment balance calculation (mirrors Angular logic)
    const epayments = rawEpayments.map((ep): PaymentEpaymentItem => {
      if (ep.TotalEpaymentRecAmt == null) {
        if (
          ['19', '20', '21'].includes(ep.SalesType) &&
          (ep.Receivable_HpAmount != null ||
            ep.Receivable_InsuranceCoverAmt != null)
        ) {
          ep.TotalEpaymentRecAmt =
            (ep.Receivable_HpAmount ?? 0) +
            (ep.Receivable_InsuranceCoverAmt ?? 0);
          if (!ep.PaidTillNow) {
            ep.PaidTillNow = 0;
          }
          ep.Balance =
            Number(ep.TotalEpaymentRecAmt) - Number(ep.PaidTillNow);
        } else {
          ep.TotalEpaymentRecAmt = '';
          ep.Balance = '';
        }
      }
      return { ...ep, IsChecked: false, PaymentRec_AfterPostBack: null };
    });

    setVehicleList(
      vehicles.map((v): PaymentVehicleItem => ({
        ...v,
        IsChecked: false,
        PaymentRec_AfterPostBack: null,
      })),
    );
    setEpaymentList(epayments);
    resetAll();
    setField('VendorID', selectedVendorId);
    setField('PaymentRecInCompany', company.CompanyID.toString());
    setStep1ActiveTab('Vehicle');
    setStep(1);
  };

  const recalcTotal = (
    vehicles: PaymentVehicleItem[],
    epayments: PaymentEpaymentItem[],
    advance: number,
  ) => {
    const vTotal = vehicles
      .filter(v => v.IsChecked)
      .reduce((s, c) => s + (c.PaymentRec_AfterPostBack ?? 0), 0);
    const eTotal = epayments
      .filter(e => e.IsChecked)
      .reduce((s, c) => s + (c.PaymentRec_AfterPostBack ?? 0), 0);
    const adj = vTotal + eTotal;
    setAdjustedAmount(adj);
    setAutoCalcTotal(adj + (advance || 0));
  };

  const toggleVehicle = (idx: number, checked: boolean) => {
    console.log(
      '[PaymentRecFromVendor] Vehicle toggled | idx:',
      idx,
      '| checked:',
      checked,
    );
    const updated = [...vehicleList];
    updated[idx].IsChecked = checked;
    if (!checked) {
      updated[idx].PaymentRec_AfterPostBack = null;
    }
    setVehicleList(updated);
    recalcTotal(updated, epaymentList, Number(form.AdvanceRecieved) || 0);
  };

  const setVehicleAmount = (idx: number, val: string) => {
    console.log(
      '[PaymentRecFromVendor] Vehicle amount changed | idx:',
      idx,
      '| val:',
      val,
    );
    const updated = [...vehicleList];
    const num = parseFloat(val) || 0;
    if (num > updated[idx].Balance) {
      HelperService.showAlert(
        'Error',
        `Balance amount is Rs.${updated[idx].Balance}`,
      );
      updated[idx].PaymentRec_AfterPostBack = null;
      updated[idx].IsChecked = false;
    } else {
      updated[idx].PaymentRec_AfterPostBack = num;
    }
    setVehicleList(updated);
    recalcTotal(updated, epaymentList, Number(form.AdvanceRecieved) || 0);
  };

  const toggleEpayment = (idx: number, checked: boolean) => {
    console.log(
      '[PaymentRecFromVendor] Epayment toggled | idx:',
      idx,
      '| checked:',
      checked,
    );
    const updated = [...epaymentList];
    updated[idx].IsChecked = checked;
    if (!checked) {
      updated[idx].PaymentRec_AfterPostBack = null;
    }
    setEpaymentList(updated);
    recalcTotal(vehicleList, updated, Number(form.AdvanceRecieved) || 0);
  };

  const setEpaymentAmount = (idx: number, val: string) => {
    const updated = [...epaymentList];
    const num = parseFloat(val) || 0;
    const hasLimit =
      updated[idx].TotalEpaymentRecAmt !== '' &&
      updated[idx].TotalEpaymentRecAmt != null;
    if (hasLimit && num > Number(updated[idx].Balance)) {
      HelperService.showAlert(
        'Error',
        `Balance amount is Rs.${updated[idx].Balance}`,
      );
      updated[idx].PaymentRec_AfterPostBack = null;
      updated[idx].IsChecked = false;
    } else {
      updated[idx].PaymentRec_AfterPostBack = num;
    }
    setEpaymentList(updated);
    recalcTotal(vehicleList, updated, Number(form.AdvanceRecieved) || 0);
  };

  const onPaymentModeChange = async (modeId: string) => {
    console.log('[PaymentRecFromVendor] Payment mode changed:', modeId);
    setField('PaymentMode', modeId);
    const mode = paymentModeList.find(
      m => m.ID.toString() === modeId.toString(),
    );
    setSelectedPaymentModeText(mode?.Name ?? '');
    // Clear bank details
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
      DSABankMasterID: '',
      HypothicationMasterID: '',
      AccountNumberForDD: '',
      AccountNumberForText: '',
    }));

    const id = parseInt(modeId, 10);
    // Show/hide fields based on payment mode
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
        FinancerName: false,
        DSAName: false,
      });
      // Fetch bank details
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
    } else if (id === 600 || id === 601) {
      setShow({
        AccountNo: true,
        ChqNo: true,
        ChqDt: true,
        BankName: true,
        BranchNo: true,
        AccountType: true,
        IFSC: true,
        AccHolderName: false,
        CustomerName: true,
        FinancerName: true,
        DSAName: true,
      });
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
        FinancerName: false,
        DSAName: false,
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
        FinancerName: false,
        DSAName: false,
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
        FinancerName: false,
        DSAName: false,
      });
    }
  };

  const validateStep1AndNext = () => {
    const missingVehicleAmount = vehicleList.some(
      v => v.IsChecked && v.PaymentRec_AfterPostBack == null,
    );
    const missingEpaymentAmount = epaymentList.some(
      e => e.IsChecked && e.PaymentRec_AfterPostBack == null,
    );

    if (missingVehicleAmount || missingEpaymentAmount) {
      HelperService.showAlert(
        'Error',
        'Please enter received amount for selected item(s).',
      );
      return;
    }

    setStep(2);
  };

  const validateAndNext = async () => {
    console.log(
      '[PaymentRecFromVendor] Next button pressed at step 2 | form:',
      JSON.stringify(form),
    );
    const f = form;
    const mode = parseInt(f.PaymentMode, 10);

    if (autoCalcTotal !== (parseFloat(f.RecievedAmt) || 0)) {
      HelperService.showAlert(
        'Error',
        'Received money is not equal to auto calculated amount.',
      );
      return;
    }
    if (f.AdvanceRecieved && parseFloat(f.AdvanceRecieved) !== 0) {
      if (!f.AdvancePaymentRemark) {
        HelperService.showAlert('Error', 'Advance remark is compulsory.');
        return;
      }
    } else {
      if (f.IFSCCode && f.IFSCCode.length !== 11) {
        HelperService.showAlert('Error', 'Please enter 11 digit IFSC no.');
        return;
      }
      if (
        (mode === 33 || mode === 600 || mode === 4097) &&
        f.ChqNeft_Number &&
        f.ChqNeft_Number.length !== 6
      ) {
        HelperService.showAlert('Error', 'Cheque number should be 6 digit.');
        return;
      }
      if (!f.PaymentMode || !f.RecievedAmt || !f.PaymentRecInCompany) {
        HelperService.showAlert(
          'Error',
          'Please select payment mode and received amount and cheque in name of.',
        );
        return;
      }
      // Mode-specific validation
      const acNo = f.AccountNumberForDD || f.AccountNumberForText;
      if (mode === 33 || mode === 34) {
        if (
          !acNo ||
          !f.ChqNeft_Number ||
          !f.ChequeDate ||
          !f.ChqNEFTOfBankNameMasterID ||
          !f.Branch_No ||
          !f.AccType ||
          !f.IFSCCode ||
          !f.AccHolderName
        ) {
          HelperService.showAlert('Error', 'Please enter all Details.');
          return;
        }
      } else if (mode === 35) {
        if (!f.ChequeDate) {
          HelperService.showAlert('Error', 'Please enter all Details.');
          return;
        }
      } else if (mode === 600) {
        if (
          !f.HypothicationMasterID ||
          !f.DSABankMasterID ||
          !acNo ||
          !f.ChqNeft_Number ||
          !f.ChequeDate ||
          !f.ChqNEFTOfBankNameMasterID ||
          !f.Branch_No ||
          !f.AccType ||
          !f.IFSCCode ||
          !f.SalesLetter_Customer_Name
        ) {
          HelperService.showAlert('Error', 'Please enter all Details.');
          return;
        }
      } else if (mode === 601) {
        if (
          !f.HypothicationMasterID ||
          !f.DSABankMasterID ||
          !acNo ||
          !f.ChqNeft_Number ||
          !f.ChequeDate ||
          !f.ChqNEFTOfBankNameMasterID ||
          !f.SalesLetter_Customer_Name
        ) {
          HelperService.showAlert(
            'Error',
            'Please enter financer, DSA, Account no, ref id, payment date, bank name, customer name Details.',
          );
          return;
        }
      } else if (mode === 4097) {
        if (
          !acNo ||
          !f.ChqNeft_Number ||
          !f.ChequeDate ||
          !f.ChqNEFTOfBankNameMasterID ||
          !f.Branch_No ||
          !f.AccType ||
          !f.IFSCCode ||
          !f.AccHolderName ||
          !f.SalesLetter_Customer_Name
        ) {
          HelperService.showAlert('Error', 'Please enter all Details.');
          return;
        }
      } else if (mode === 4098) {
        if (
          !f.AccHolderName ||
          !f.ChqNeft_Number ||
          !f.ChequeDate ||
          !f.SalesLetter_Customer_Name
        ) {
          HelperService.showAlert(
            'Error',
            'Please enter ref id, payment date, customer Details.',
          );
          return;
        }
      } else if (mode === 5100) {
        if (!f.ChequeDate || !f.SalesLetter_Customer_Name) {
          HelperService.showAlert('Error', 'Please enter all Details.');
          return;
        }
      }
    }

    // Check duplicate cheque/payment number
    if (f.ChqNeft_Number && f.PaymentMode) {
      const acNo = f.AccountNumberForDD || f.AccountNumberForText;
      setIsLoading(true);
      try {
        const chkRes = await IsChequOrPaymentNumberAvail(
          sessionToken!,
          f.PaymentMode,
          f.VendorID,
          acNo,
          f.ChqNEFTOfBankNameMasterID,
          f.ChqNeft_Number,
        );
        if (chkRes.IsSuccess && chkRes.Data === true) {
          HelperService.showAlert(
            'Error',
            'Same payment details already exist.',
          );
          setIsLoading(false);
          return;
        }
      } catch { }
    }

    // Check direct payment to auth
    if (form.DirectPaymentToAuth) {
      const salesOrderDetIds = [
        ...vehicleList.filter(v => v.IsChecked).map(v => v.ID),
        ...epaymentList.filter(e => e.IsChecked).map(e => e.SalesOrderDetID),
      ];
      try {
        const vendorRes = await CheckPurchaseVendorFromSalesOrderDetID(
          salesOrderDetIds,
          sessionToken!,
        );
        if (!vendorRes.IsSuccess) {
          HelperService.showAlert('Error', vendorRes.Msg);
          setIsLoading(false);
          return;
        }
      } catch { }
    }

    setIsLoading(false);
    setStep(3);
  };

  const handleSubmit = async () => {
    console.log(
      '[PaymentRecFromVendor] Submit pressed | payload form:',
      JSON.stringify(form),
    );
    setIsLoading(true);
    const f = form;
    const accNo = f.AccountNumberForDD || f.AccountNumberForText;

    const selectedVehicleData = vehicleList
      .filter(v => v.IsChecked)
      .map(v => ({
        ...v,
        IsChecked: true,
        PaymentRec_AfterPostBack: toNumberOrZero(v.PaymentRec_AfterPostBack),
      }));

    const selectedEpaymentData = epaymentList
      .filter(e => e.IsChecked)
      .map(e => ({
        ...e,
        IsChecked: true,
        PaymentRec_AfterPostBack: toNumberOrZero(e.PaymentRec_AfterPostBack),
      }));

    const payload = {
      VendorAndBankdetails: {
        ...f,
        VendorID: String(f.VendorID || selectedVendorId || ''),
        PaymentMode: String(f.PaymentMode || ''),
        Acc_No: accNo,
        RecievedAmt: toNumberOrZero(f.RecievedAmt),
        AdvanceRecieved: toNumberOrZero(f.AdvanceRecieved),
        PaymentRecInCompany: String(f.PaymentRecInCompany || ''),
        DirectPaymentToAuth: Boolean(f.DirectPaymentToAuth),
      },
      SalesOrderPaymentRecList: selectedVehicleData,
      EpaymentSalesOrderPaymentRecList: selectedEpaymentData,
      AdjustedAmount: toNumberOrZero(adjustedAmount),
    };
    try {
      const res = await ReceivedPaymentFromVendor(payload, sessionToken!);
      if (res.IsSuccess) {
        HelperService.showAlert('Success!', res.Msg, () => {
          setStep(0);
          resetAll();
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
        <CompanyListSkeleton />
      </View>
    );
  }

  // ── Step 0: Company selection ─────────────────────────────────────────────
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
              <Text style={styles.companyBadge}>{item.SumOfMoneyPending}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No companies with pending payment.
            </Text>
          }
          contentContainerStyle={{ padding: 12 }}
        />
      </View>
    );
  }

  // ── Step 1: Vehicle + Epayment selection ─────────────────────────────────
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.tabRow}>
          {(['Vehicle', 'Epayment'] as Step1TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabBtn,
                step1ActiveTab === tab && styles.tabBtnActive,
              ]}
              onPress={() => setStep1ActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  step1ActiveTab === tab && styles.tabBtnTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ScrollView
          style={styles.container}
          contentContainerStyle={scrollContentStyle({ padding: 12 })}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {step1ActiveTab === 'Vehicle' &&
            vehicleList.map((item, idx) => (
              <View key={idx} style={styles.selectionCard}>
                <View style={styles.selectionRow}>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>{item.InternalVendorName}</Text>
                    <Text style={styles.detail}>Allot on : {item.AllotmentDateOn}</Text>
                    <Text style={styles.detail}>Dispatched on : {item.VehicleDispatchedOn}</Text>
                    <Text style={styles.detail}>Aging : {item.Aging}</Text>
                    <Text style={styles.detail}>Insurance Request Date : {item.InsuranceReqDate}</Text>
                    <Text style={styles.detail}>Chassis No. : {item.ChessisNo}</Text>
                    <Text style={styles.detail}>Engine No. : {item.EngineNo}</Text>
                    <Text style={styles.detail}>{item.ProductName}, {item.ColorName}, {item.StrSalesType}</Text>
                    <Text style={styles.detail}>Total Price. : {item.TotalAmt}</Text>
                    <Text style={styles.detail}>Paid Till Now. : {item.PaidTillNow}</Text>
                    <Text style={styles.detail}>Pending: {item.Balance}</Text>
                    <Text style={styles.detail}>Payment Remark: {item.PaymentRemark}</Text>
                  </View>
                  <Switch
                    value={item.IsChecked}
                    onValueChange={v => toggleVehicle(idx, v)}
                    trackColor={{ true: '#3880ff' }}
                  />
                </View>
                {item.IsChecked && (
                  <TextInput
                    style={styles.amtInput}
                    placeholder="Enter amount"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={item.PaymentRec_AfterPostBack?.toString() ?? ''}
                    onChangeText={v => setVehicleAmount(idx, v)}
                  />
                )}
              </View>
            ))}

          {step1ActiveTab === 'Epayment' &&
            epaymentList.map((item, idx) => (
              <View key={idx} style={styles.selectionCard}>
                <View style={styles.selectionRow}>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cardTitle}>{item.InternalVendorName}</Text>
                    <Text style={styles.detail}>Allot on : {item.VehicleAllotDt}</Text>
                    <Text style={styles.detail}>Dispatched on : {item.VehicleDispatchedDt}</Text>
                    <Text style={styles.detail}>Aging : {item.Aging}</Text>
                    <Text style={styles.detail}>Chassis: {item.ChessisNo}</Text>
                    <Text style={styles.detail}>Engine No. : {item.EngineNo}</Text>
                    <Text style={styles.detail}>{item.ProductName}, {item.ColorName}, {item.StrSalesType}</Text>
                    <Text style={styles.detail}>Approx Epayment : {item.TotalEpaymentRecAmt}</Text>
                    <Text style={styles.detail}>Paid Till Now. : {item.PaidTillNow}</Text>
                    <Text style={styles.detail}>Pending: {item.Balance}</Text>
                  </View>
                  <Switch
                    value={item.IsChecked}
                    onValueChange={v => toggleEpayment(idx, v)}
                    trackColor={{ true: '#3880ff' }}
                  />
                </View>
                {item.IsChecked && (
                  <TextInput
                    style={styles.amtInput}
                    placeholder="Enter amount"
                    placeholderTextColor="#aaa"
                    keyboardType="numeric"
                    value={item.PaymentRec_AfterPostBack?.toString() ?? ''}
                    onChangeText={v => setEpaymentAmount(idx, v)}
                  />
                )}
              </View>
            ))}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>
              Adjusted Amount: {adjustedAmount}
            </Text>
          </View>
          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(0)}>
              <Text style={styles.btnText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={validateStep1AndNext}>
              <Text style={styles.btnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 2: Payment form ─────────────────────────────────────────────────
  if (step === 2) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={scrollContentStyle(styles.formContent)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Text style={styles.sectionTitle}>Payment Details</Text>

          {/* Amounts */}
          <Text style={styles.label}>Advance Received</Text>
          <TextInput
            style={styles.input}
            value={form.AdvanceRecieved}
            onChangeText={v => {
              setField('AdvanceRecieved', v);
              setAutoCalcTotal(adjustedAmount + (parseFloat(v) || 0));
            }}
            placeholder="0"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Received Amount</Text>
          <TextInput
            style={styles.input}
            value={form.RecievedAmt}
            onChangeText={v => setField('RecievedAmt', v)}
            placeholder="Received amount"
            placeholderTextColor="#aaa"
            keyboardType="numeric"
          />

          <View style={styles.switchRow}>
            <Text style={styles.label}>Direct Payment to Auth</Text>
            <Switch
              value={form.DirectPaymentToAuth as boolean}
              onValueChange={v => setField('DirectPaymentToAuth', v)}
            />
          </View>

          {/* Payment Mode */}
          <Text style={styles.label}>Payment Mode</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={form.PaymentMode}
              onValueChange={v => onPaymentModeChange(v)}
              style={styles.picker}
            >
              <Picker.Item label="Select Mode" value="" />
              {paymentModeList.map(m => (
                <Picker.Item key={m.ID} label={m.Name} value={m.ID.toString()} />
              ))}
            </Picker>
          </View>

          {/* Account No */}
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
                  placeholder="Enter account number"
                  placeholderTextColor="#aaa"
                />
              )}
            </>
          )}

          {/* Cheque/Ref No */}
          {show.ChqNo && (
            <>
              <Text style={styles.label}>Cheque / Ref Number</Text>
              <TextInput
                style={styles.input}
                value={form.ChqNeft_Number}
                onChangeText={v => setField('ChqNeft_Number', v)}
                placeholder="Cheque/Ref No"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
              />
            </>
          )}

          {/* Cheque Date */}
          {show.ChqDt && (
            <>
              <Text style={styles.label}>Cheque / Payment Date</Text>
              <TouchableOpacity
                style={styles.input}
                activeOpacity={0.7}
                onPress={() => setShowChequeDatePicker(true)}
              >
                <Text
                  style={
                    form.ChequeDate
                      ? styles.dateValueText
                      : styles.datePlaceholderText
                  }
                >
                  {form.ChequeDate || 'Select date'}
                </Text>
              </TouchableOpacity>

              {showChequeDatePicker && (
                <DateTimePicker
                  value={parseDateFromYmd(form.ChequeDate)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChequeDateChange}
                />
              )}
            </>
          )}

          {/* Bank Name */}
          {show.BankName && (
            <>
              <Text style={styles.label}>Bank Name</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.ChqNEFTOfBankNameMasterID}
                  onValueChange={v => setField('ChqNEFTOfBankNameMasterID', v)}
                  style={styles.picker}
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

          {/* Branch */}
          {show.BranchNo && (
            <>
              <Text style={styles.label}>Branch</Text>
              <TextInput
                style={styles.input}
                value={form.Branch_No}
                onChangeText={v => setField('Branch_No', v)}
                placeholder="Branch"
                placeholderTextColor="#aaa"
              />
            </>
          )}

          {/* Account Type */}
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

          {/* IFSC */}
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
              />
            </>
          )}

          {/* Account Holder */}
          {show.AccHolderName && (
            <>
              <Text style={styles.label}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={form.AccHolderName}
                onChangeText={v => setField('AccHolderName', v)}
                placeholder="Account Holder Name"
                placeholderTextColor="#aaa"
              />
            </>
          )}

          {/* Customer Name */}
          {show.CustomerName && (
            <>
              <Text style={styles.label}>Customer Name</Text>
              <TextInput
                style={styles.input}
                value={form.SalesLetter_Customer_Name}
                onChangeText={v => setField('SalesLetter_Customer_Name', v)}
                placeholder="Customer Name"
                placeholderTextColor="#aaa"
              />
            </>
          )}

          {/* Financer */}
          {show.FinancerName && (
            <>
              <Text style={styles.label}>Financer (Hypothication)</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.HypothicationMasterID}
                  onValueChange={v => setField('HypothicationMasterID', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Financer" value="" />
                  {hypothicationList.map(h => (
                    <Picker.Item
                      key={h.ID}
                      label={h.Name}
                      value={h.ID.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}

          {/* DSA */}
          {show.DSAName && (
            <>
              <Text style={styles.label}>DSA</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={form.DSABankMasterID}
                  onValueChange={v => setField('DSABankMasterID', v)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select DSA" value="" />
                  {dsaList.map(d => (
                    <Picker.Item
                      key={d.ID}
                      label={d.Name}
                      value={d.ID.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </>
          )}



          {form.AdvanceRecieved && parseFloat(form.AdvanceRecieved) !== 0 ? (
            <>
              <Text style={styles.label}>Advance Remark (required)</Text>
              <TextInput
                style={styles.input}
                value={form.AdvancePaymentRemark}
                onChangeText={v => setField('AdvancePaymentRemark', v)}
                placeholder="Advance remark"
                placeholderTextColor="#aaa"
              />
            </>
          ) : null}

          <View style={styles.autoCalcRow}>
            <Text style={styles.autoCalcText}>
              Auto Calculated Total: {autoCalcTotal}
            </Text>
          </View>



          <View style={styles.navButtons}>
            <TouchableOpacity style={styles.prevBtn} onPress={() => setStep(1)}>
              <Text style={styles.btnText}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={validateAndNext}>
              <Text style={styles.btnText}>Review</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Step 3: Review + Submit ───────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={scrollContentStyle(styles.formContent)}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={styles.sectionTitle}>Review Payment</Text>
        <View style={styles.reviewCard}>
          <Text style={styles.reviewRow}>Vendor: {selectedVendorName}</Text>
          <Text style={styles.reviewRow}>
            Payment Mode: {selectedPaymentModeText}
          </Text>
          <Text style={styles.reviewRow}>
            Received Amount: {form.RecievedAmt}
          </Text>
          <Text style={styles.reviewRow}>
            Cheque / Ref No: {form.ChqNeft_Number}
          </Text>
          <Text style={styles.reviewRow}>Date: {form.ChequeDate}</Text>
          <Text style={styles.reviewRow}>
            Vehicles selected: {vehicleList.filter(v => v.IsChecked).length}
          </Text>
          <Text style={styles.reviewRow}>
            Epayments selected: {epaymentList.filter(e => e.IsChecked).length}
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
    </KeyboardAvoidingView>
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
  companyBadge: {
    flexShrink: 0,
    backgroundColor: '#3880ff',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
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
  amtInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: '#222',
    marginTop: 8,
    backgroundColor: '#fafafa',
  },
  summaryRow: {
    backgroundColor: '#e8f0ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  summaryText: { fontWeight: '700', color: '#3880ff', fontSize: 14 },
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
  autoCalcRow: {
    backgroundColor: '#e8f0ff',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  autoCalcText: { fontWeight: '700', color: '#3880ff' },
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
  dateValueText: { color: '#222', fontSize: 14 },
  datePlaceholderText: { color: '#aaa', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40 },
});

export default PaymentRecFromVendorScreen;
