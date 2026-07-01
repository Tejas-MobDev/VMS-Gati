/**
 * Centralised navigation type definitions.
 * Replaces Angular's RouterModule route path strings with typed params.
 *
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

// Stack inside Dashboard tab
export type DashboardStackParamList = {
    RMDashboard: undefined;
    ASMDashboard: undefined;
    VendorsWithoutSalesOrder: undefined;
    PendingPaymentFiveDaysOld: undefined;
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
