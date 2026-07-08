/**
 * MIGRATION NOTE:
 * Angular: ApiService using HttpClient (RxJS Observables), called with .toPromise()
 * React Native: Plain async functions using axios with Promises.
 *
 * All endpoints, URLs, query params, and headers are preserved exactly.
 * SessionToken and AppVersion headers are passed identically.
 *
 * Migration decisions:
 * - Removed RxJS Observable wrapper — axios returns Promises natively
 * - Removed @Injectable decorator — plain module export
 * - HttpHeaders object replaced with plain JS headers object
 * - All method signatures kept identical for easy screen migration
 * - axios used instead of fetch for better error handling & interceptors
 */

import axios from 'axios';
import Config from 'react-native-config';

const BASE_PATH = Config.API_URL;
// const BASE_PATH = 'http://122.185.131.170:222/api/';
const CURRENT_VERSION = '1.0.18';

export interface ApiResponse {
    IsSuccess: boolean;
    Msg: string;
    Data: any;
}

// Build headers for authenticated requests
const authHeaders = (sessionToken: string) => ({
    'Content-Type': 'application/json',
    SessionToken: sessionToken,
    AppVersion: CURRENT_VERSION,
});

const defaultHeaders = {
    'Content-Type': 'application/json',
};

// GET helper (axios)
async function apiGet(url: string, headers: Record<string, string>): Promise<ApiResponse> {
    console.log('[API GET] →', url);
    const response = await axios.get<ApiResponse>(url, { headers });
    console.log('[API GET Response] ←', url, '| status:', response);
    return response.data;
}

// POST helper (axios)
async function apiPost(url: string, headers: Record<string, string>, body: any): Promise<ApiResponse> {
    console.log('[API POST] →', url, '| body:', JSON.stringify(body));
    const response = await axios.post<ApiResponse>(url, body, { headers });
    console.log('[API POST] ←', url, '| status:', response.status, '| IsSuccess:', response.data?.IsSuccess);
    return response.data;
}

// ─── Authentication ────────────────────────────────────────────────────────────

export function LogIn(LoginData: any): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobileLogin/LoginEmployees', defaultHeaders, LoginData);
}

export function LogoutEmployee(sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobileLogin/LogoutEmployee', authHeaders(sessionToken), null);
}

// ─── Vendor / RM Lists ────────────────────────────────────────────────────────

export function GetVendorListOfRM(sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + 'Other/GetListOfVendorBasedOnRM', authHeaders(sessionToken));
}

export function GetListOfRMAndVendorsBasedOnASM(sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + 'Other/GetListOfRMAndVendorsBasedOnASM', authHeaders(sessionToken));
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function RMDashboardData(sessionToken: string, vendorID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `Other/RMDashboardData?VendorID=${vendorID}`, authHeaders(sessionToken));
}

export function ASMDashboardData(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `Other/ASMDashboardData?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

// ─── Sales Orders ─────────────────────────────────────────────────────────────

export function TodaysSalesorderForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileGoodown/TodaysSalesOrderForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function LastFewDaysPending_GoodsDispatchForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileGoodown/LastFewDaysPending_GoodsDispatchForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function VendorWithoutSalesOrderForRM(sessionToken: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileGoodown/VendorWithoutSalesOrderForRM?RMID=${rmID}`, authHeaders(sessionToken));
}

// ─── Sales Letters ────────────────────────────────────────────────────────────

export function GetPendingSalesLetterRequestForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetPendingSalesLetterRequestForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function GetCurrentSLRequestedForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetCurrentSLRequestedForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function GetCurrentSLHoldForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetCurrentSLHoldForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function GetCurrentSLInProgressForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetCurrentSLInProgressForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function GetSLRecByRM_SalesLetterForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetSLRecByRM_SalesLetterForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function SLRecievedByRMForRM(salesLetterID: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobileSalesLetter/SLRecievedByRMForRM', authHeaders(sessionToken), salesLetterID);
}

// ─── Service Book ─────────────────────────────────────────────────────────────

export function GetListofServiceBookStatusForRM(sessionToken: string, vendorID: string, rmID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetListofServiceBookStatusForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function ServiceBookRecByRMForRM(salesletterStatsID: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobileSalesLetter/ServiceBookRecByRMForRM', authHeaders(sessionToken), salesletterStatsID);
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export function PaymenofVendorForRM(rmID: string, vendorID: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobilePayment/getPaymenofVendorForRM?VendorID=${vendorID}&RMID=${rmID}`, authHeaders(sessionToken));
}

export function getPaymentPendingMorethan5daysofVendorForRM(rmID: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobilePayment/getPaymentPendingMorethan5daysofVendorForRM?RMID=${rmID}`, authHeaders(sessionToken));
}

export function GetPendingPaymentOfVendorCompanyWiseAndDropdownListData(vendorID: string, designation: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobilePayment/GetPendingPaymentOfVendorCompanyWiseAndDropdownListData?VendorID=${vendorID}&DesignationName=${designation}`, authHeaders(sessionToken));
}

export function ReceivedPaymentFromVendor(paymentData: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobilePayment/ReceivedPaymentFromVendor', authHeaders(sessionToken), paymentData);
}

export function GetBankDetails(sessionToken: string, paymentMode: string, vendorID: string, hypothicationID: string, dsaID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobilePayment/GetBankDetails?PaymentMode=${paymentMode}&VendorID=${vendorID}&HypothicationID=${hypothicationID}&DSAID=${dsaID}`, authHeaders(sessionToken));
}

export function GetOnlyPendingEPayment_OfVendorCompanyWiseAndDropdownListData(vendorID: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobilePayment/GetOnlyPendingEPayment_OfVendorCompanyWiseAndDropdownListData?VendorID=${vendorID}`, authHeaders(sessionToken));
}

export function CheckPurchaseVendorFromSalesOrderDetID(salesOrderDetIDs: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobilePayment/CheckPurchaseVendorFromSalesOrderDetID', authHeaders(sessionToken), salesOrderDetIDs);
}

export function GetReceivedPaymentWithoutAmountFromVendor(paymentData: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobilePayment/ReceivedPaymentWithoutAmountFromVendor', authHeaders(sessionToken), paymentData);
}

export function SavePaymentRemarkInSalesOrderDet(data: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobilePayment/SavePaymentRemarkInSalesOrderDet', authHeaders(sessionToken), data);
}

export function GetCustomerNameOfSalesletter(sessionToken: string, salesOrderDetID: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetCustomerNameOfSalesletter?SalesOrderDetID=${salesOrderDetID}`, authHeaders(sessionToken));
}

export function IsChequOrPaymentNumberAvail(sessionToken: string, paymentMode: string, vendorID: string, accountNo: string, bankNameId: string, chqPaymentNumber: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `/MobilePayment/IsChequOrPaymentNumberAvail?PaymentMode=${paymentMode}&VendorID=${vendorID}&AccountNo=${accountNo}&BankNameId=${bankNameId}&ChqPaymentNumber=${chqPaymentNumber}`, authHeaders(sessionToken));
}

// ─── HSRP ─────────────────────────────────────────────────────────────────────

export function HSRPNumberReceivePendingByRM_ASM(designation: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileHSRP/HSRPNumberReceivePendingByRM_ASM?Designation=${designation}`, authHeaders(sessionToken));
}

export function HSRPNumberHoldByDolphinOrAuthForRM_ASM_App(designation: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileHSRP/HSRPNumberHoldByDolphinOrAuthForRM_ASM_App?Designation=${designation}`, authHeaders(sessionToken));
}

export function HSRPNumberReceivedByRM_ASM(hsrpdetID: any, sessionToken: string): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobileHSRP/HSRPNumberReceivedByRM_ASM', authHeaders(sessionToken), { hsrpdetID });
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function GetMobileDropDownList(typeOfList: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `Other/GetMobileList?Typeof=${typeOfList}`, defaultHeaders);
}

export function GetListOfDocsBySLID(slID: string, sessionToken: string): Promise<ApiResponse> {
    return apiGet(BASE_PATH + `MobileSalesLetter/GetDocumentFromIDForRM?SalesLetterID=${slID}`, authHeaders(sessionToken));
}

export function GetValidationForDocs(): Promise<ApiResponse> {
    return apiGet(BASE_PATH + 'MobileSalesLetter/GetValidationForDocs', defaultHeaders);
}

export function SaveAdditionalSLDocs(sessionToken: string, slIDWithDocsList: any): Promise<ApiResponse> {
    return apiPost(BASE_PATH + 'MobileSalesLetter/SaveSLDocsForRM', authHeaders(sessionToken), slIDWithDocsList);
}
