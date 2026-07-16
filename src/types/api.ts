/**
 * Typed API response shapes derived from screen usage and Angular migration contracts.
 */

// ─── Generic wrapper ───────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  IsSuccess: boolean;
  Msg: string;
  Data: T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginSessionDetails {
  remote_user_agent: number;
  device_token: string;
  Ipaddress: string;
  os_version: string;
  device_model: string;
}

export interface LoginRequest {
  UserName: string;
  Password: string;
  DesignationName: string;
  SessionDetails: LoginSessionDetails;
}

export interface LoginResponseData {
  SessionTok: string;
  ID?: number | string;
  EmployeeID?: number | string;
  EmpID?: number | string;
  UserID?: number | string;
  EmployeeName?: string;
  EmpName?: string;
  Name?: string;
  UserName?: string;
  objEmployee?: Record<string, unknown>;
  Employee?: Record<string, unknown>;
  User?: Record<string, unknown>;
  LoginEmployee?: Record<string, unknown>;
  [key: string]: unknown;
}

// ─── Shared list / dropdown items ────────────────────────────────────────────

export interface DropdownItem {
  ID: number | string;
  Name: string;
}

export interface VendorItem extends DropdownItem {
  Optional?: number[];
}

export interface DashboardMenuItem {
  m_Item1: string;
  m_Item2: string | number;
  m_Item3: string;
}

export type ASMRMAndVendorData = [DropdownItem[], VendorItem[]];

// ─── Sales orders ──────────────────────────────────────────────────────────────

export interface SalesOrderItem {
  InternalVendorName: string;
  CreatedOn: string;
  ProductName: string;
  ColorName: string;
  TypeName: string;
  GoodsRec_DispDate?: string;
  TotalAmt: string | number;
  Aging: string | number;
}

// ─── Sales letters ─────────────────────────────────────────────────────────────

export interface PendingSalesLetterItem {
  ChasisNo: string;
  EngineNo: string;
  ProductName: string;
  Color: string;
  VechicleAllotDate: string;
  Aging: string | number;
  SalesOrderDt_DispatchDate: string;
  SalesOrderDt_DispatchDate_Aging: string | number;
  SoldTo: string;
}

export interface SalesLetterUpdateItem {
  Id?: string | number;
  Name: string;
  ChassisNumber: string;
  EngineNumber: string;
  ProductName: string;
  VehicleColor: string;
  SalesletterCreatedDate: string;
  Statusid: number | string;
  Stat: string;
  CreatedDate: string;
  Remark: string;
}

export interface SLRecByRMItem {
  Id: string | number;
  SoldTo_N: string;
  Name: string;
  ChassisNumber: string;
  EngineNumber: string;
  ProductName: string;
  VehicleColor: string;
  IsChecked: boolean;
}

// ─── Service book ──────────────────────────────────────────────────────────────

export interface ServiceBookItem {
  Name: string;
  SoldTo_N?: string;
  ChassisNumber: string;
  EngineNumber: string;
  ProductName: string;
  VehicleColor: string;
  Status_Name?: string;
  ServicebookStatusRemark?: string;
  Statusid?: number | string;
  SLStatusID?: string | number;
  SalesletterStats_ID?: string | number;
  IsChecked?: boolean;
}

export type ServiceBookStatusData = [
  ServiceBookItem[],
  ServiceBookItem[],
  ServiceBookItem[],
];

// ─── HSRP ──────────────────────────────────────────────────────────────────────

export interface HSRPItem {
  HSRPDetail_ID: string | number;
  NumberPlate: string;
  ChassisNumber: string;
  ProductName: string;
  VehicleColor: string;
  DealerName: string;
}

// ─── Vendors ─────────────────────────────────────────────────────────────────

export interface VendorWithoutSalesOrderItem {
  VendorName: string;
}

// ─── Payment — pending lists ───────────────────────────────────────────────────

export interface PendingPaymentFiveDaysItem {
  InternalVendorName: string;
  Aging: string | number;
  Quantity: string | number;
  TotalAmt: string | number;
}

export interface PendingPaymentVehicleItem {
  ID: string | number;
  InternalVendorName: string;
  AllotmentDateOn: string;
  Aging: number;
  VehicleDispatchedOn: string;
  SalesOrderDt_DispatchDate_Aging: string | number;
  ChessisNo: string;
  EngineNo: string;
  ProductName: string;
  ColorName: string;
  PaidTillNow: string | number;
  Balance: number;
  InternalCompanyName: string;
  PaymentRemark?: string;
}

export interface PendingPaymentEpaymentItem {
  SalesOrderDetID: string | number;
  InternalVendorName: string;
  VehicleAllotDt: string;
  VehicleAllot_Aging: string | number;
  VehicleDispatchedDt: string;
  Aging: number;
  ChessisNo: string;
  EngineNo: string;
  ProductName: string;
  ColorName: string;
  PaidTillNow: string | number;
  Balance: number;
  InternalCompanyName?: string;
  PaymentRemark?: string;
}

export interface PendingPaymentVendorData {
  m_Item1: PendingPaymentVehicleItem[];
  m_Item3: PendingPaymentEpaymentItem[];
}

export interface PaymentRemarkPayload {
  SalesOrderdetID: string | number;
  RemarkPayment: string;
  RemarkType: 'Vehicle' | 'Epayment';
}

// ─── Payment — receipt wizard ──────────────────────────────────────────────────

export interface PaymentVehicleItem {
  ID: string | number;
  InternalVendorName: string;
  ChessisNo: string;
  Balance: number;
  IsChecked: boolean;
  PaymentRec_AfterPostBack: number | null;
}

export interface PaymentEpaymentItem {
  SalesOrderDetID: string | number;
  InternalVendorName: string;
  ChessisNo: string;
  EngineNo?: string;
  Balance: number | string;
  SalesType: string;
  StrSalesType?: string;
  TotalEpaymentRecAmt?: number | string | null;
  Receivable_HpAmount?: number | null;
  Receivable_InsuranceCoverAmt?: number | null;
  PaidTillNow?: number | string;
  VehicleDispatchedDt?: string;
  Aging?: number | string;
  ProductName?: string;
  ColorName?: string;
  InternalCompanyName?: string;
  IsChecked: boolean;
  PaymentRec_AfterPostBack: number | null;
}

export interface PaymentCompany {
  CompanyID: number | string;
  CompanyName: string;
  SumOfMoneyPending: string | number;
  SumOfMoneyPendingOfEpayment?: string | number;
  PaymentPendingList?: PaymentVehicleItem[];
  PaymentPendingListOfEpayment?: PaymentEpaymentItem[];
}

export interface BankAccountDetail {
  AccountNumber: string;
}

export type PaymentDropdownLists = [
  DropdownItem[],
  DropdownItem[],
  DropdownItem[],
  DropdownItem[],
  DropdownItem[],
];

export type EpaymentDropdownLists = [DropdownItem[], DropdownItem[], DropdownItem[]];

export interface PaymentCompanyWithDropdowns {
  m_Item1: PaymentCompany[];
  m_Item2: PaymentDropdownLists;
}

export interface EpaymentCompanyWithDropdowns {
  m_Item1: PaymentCompany[];
  m_Item2: EpaymentDropdownLists;
}

export interface PaymentVendorAndBankDetails {
  VendorID: string;
  PaymentMode: string;
  Acc_No: string;
  ChqNeft_Number: string;
  ChequeDate: string;
  RecievedAmt: number;
  AdvanceRecieved: number;
  ChqNEFTOfBankNameMasterID: string;
  Branch_No: string;
  AccType: string;
  IFSCCode: string;
  AccHolderName: string;
  PaymentRecInCompany: string;
  AccountNumberForDD: string;
  AccountNumberForText: string;
  SalesLetter_Customer_Name: string;
  DSABankMasterID?: string;
  HypothicationMasterID?: string;
  DirectPaymentToAuth: boolean;
  AdvancePaymentRemark: string;
}

export interface ReceivedPaymentPayload {
  VendorAndBankdetails: PaymentVendorAndBankDetails;
  SalesOrderPaymentRecList: PaymentVehicleItem[];
  EpaymentSalesOrderPaymentRecList: PaymentEpaymentItem[];
  AdjustedAmount: number;
}

export interface ReceivedPaymentWithoutAmtPayload {
  VendorAndBankdetails: Omit<
    PaymentVendorAndBankDetails,
    'RecievedAmt' | 'AdvanceRecieved' | 'AdvancePaymentRemark'
  >;
  EpaymentSalesOrderPaymentRecList: PaymentEpaymentItem[];
}

// ─── Documents ─────────────────────────────────────────────────────────────────

export interface SalesLetterDocument {
  SalesLetterID?: string | number;
  ProofName: number | string;
  Document_ID: string;
  DocSubName: number | string;
  DocumentURL?: string;
  DocBase64Str?: string;
  Str_ProofName?: string;
  Str_SLDoctyp_DocSubName?: string;
}

export interface DocLengthRule {
  m_Item1: number;
  m_Item2: number;
}

export interface DocValidationData {
  ComplusoryDocID: number[];
  MaxLengthOfdocIDList: DocLengthRule[];
}

export interface NewDocumentData {
  ProofName: number;
  DocSubName: number;
  DocBase64Str: string;
  ProofNameStr: string;
  DocSubNameStr: string;
  Document_ID: string;
}

export interface SaveSLDocsPayload {
  SalesLetterID: string;
  Remark: string;
  DocsList: SalesLetterDocument[];
}

export interface MobileDropdownItem extends DropdownItem {
  Optional?: number[];
}
