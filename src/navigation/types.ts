/**
 * Centralised navigation type definitions.

 * Every screen that receives navigation params declares them here.
 */

export type RootStackParamList = {
    SignIn: undefined;
    MainTabs: undefined;
};

export type TabParamList = {
    DashboardTab: undefined;
    SalesOrderTab: undefined;
    PaymentTab: undefined;
    SalesLetterTab: undefined;
};

// Stack inside Dashboard tab.
// Includes ALL screens reachable from the RM/ASM dashboard so they open
// within the same stack (providing a back button) without touching other tabs.
export type DashboardStackParamList = {
    RMDashboard: undefined;
    ASMDashboard: undefined;
    // Dashboard-owned
    VendorsWithoutSalesOrder: undefined;
    PendingPaymentFiveDaysOld: undefined;
    // Sales Order screens
    PendingSalesOrder: undefined;
    TodaySalesOrder: undefined;
    // Payment screens
    PendingPayment: undefined;
    PaymentRecFromVendor: undefined;
    PaymentRecWithoutAmt: undefined;
    // Sales Letter screens
    PendingSalesLetter: undefined;
    SLCurrentUpdates: undefined;
    SLRecByRM: { param1?: string };
    ServiceBookStatus: { param1?: string };
    HSRPNumberPending: undefined;
};

// Stack inside Sales Order tab
export type SalesOrderStackParamList = {
    SalesOrderDashboard: undefined;
    TodaySalesOrder: undefined;
    PendingSalesOrder: undefined;
    VendorsWithoutSalesOrderSO: undefined;
};

// Stack inside Payment tab
export type PaymentStackParamList = {
    PaymentDashboard: undefined;
    PendingPayment: undefined;
    PaymentRecFromVendor: undefined;
    PaymentRecWithoutAmt: undefined;
};

// Stack inside Sales Letter tab
export type SalesLetterStackParamList = {
    SLDashboard: undefined;
    PendingSalesLetter: undefined;
    SLCurrentUpdates: undefined;
    SLRecByRM: { param1?: string };
    ServiceBookStatus: { param1?: string };
    HSRPNumberPending: undefined;
    AttachNewDocs: { SLID: string; newDoc?: any };
    AddDocumentModal: {
        compulsoryDocIDs: any[];
        maxLengthDocIDList: any[];
        returnScreen: string;
    };
};
