/**
 * MIGRATION NOTE:
 * Angular: tabs.page.html (ion-tabs + ion-tab-bar) + tabs-routing.module.ts
 * React Native: Bottom tab navigator with 4 tabs, each with its own stack navigator.
 *
 * The designation-based dashboard tab (RM vs ASM) is handled inside
 * DashboardStackNavigator — it checks context and renders the correct screen.
 *
 * Icons: react-native-vector-icons/Ionicons mirrors Ionic icon names.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { TabParamList } from './types';
import { useAppContext } from '../context/AppContext';

// Dashboard stack screens
import RMDashboardScreen from '../screens/RMDashboard/RMDashboardScreen';
import ASMDashboardScreen from '../screens/ASMDashboard/ASMDashboardScreen';
import VendorsWithoutSalesOrderScreen from '../screens/VendorsWithoutSalesOrder/VendorsWithoutSalesOrderScreen';
import PendingPaymentFiveDaysOldScreen from '../screens/PendingPaymentFiveDaysOld/PendingPaymentFiveDaysOldScreen';

// Sales Order stack screens
import SalesOrderDashboardScreen from '../screens/SalesOrderDashboard/SalesOrderDashboardScreen';
import TodaySalesOrderScreen from '../screens/TodaySalesOrder/TodaySalesOrderScreen';
import PendingSalesOrderScreen from '../screens/PendingSalesOrder/PendingSalesOrderScreen';

// Payment stack screens
import PaymentDashboardScreen from '../screens/PaymentDashboard/PaymentDashboardScreen';
import PendingPaymentScreen from '../screens/PendingPayment/PendingPaymentScreen';
import PaymentRecFromVendorScreen from '../screens/PaymentRecFromVendor/PaymentRecFromVendorScreen';
import PaymentRecWithoutAmtScreen from '../screens/PaymentRecWithoutAmt/PaymentRecWithoutAmtScreen';

// Sales Letter stack screens
import SLDashboardScreen from '../screens/SLDashboard/SLDashboardScreen';
import PendingSalesLetterScreen from '../screens/PendingSalesLetter/PendingSalesLetterScreen';
import SLCurrentUpdatesScreen from '../screens/SLCurrentUpdates/SLCurrentUpdatesScreen';
import SLRecByRMScreen from '../screens/SLRecByRM/SLRecByRMScreen';
import ServiceBookStatusScreen from '../screens/ServiceBookStatus/ServiceBookStatusScreen';
import HSRPNumberPendingScreen from '../screens/HSRPNumberPending/HSRPNumberPendingScreen';
import AttachNewDocsScreen from '../screens/AttachNewDocs/AttachNewDocsScreen';
import AddDocumentModalScreen from '../screens/AddDocumentModal/AddDocumentModalScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const DashboardStack = createNativeStackNavigator();
const SalesOrderStack = createNativeStackNavigator();
const PaymentStack = createNativeStackNavigator();
const SalesLetterStack = createNativeStackNavigator();

// ─── Dashboard Stack ──────────────────────────────────────────────────────────
const DashboardStackNavigator = () => {
  const { designation, employeeName } = useAppContext();
  const InitialDashboard =
    designation === 'RM' ? RMDashboardScreen : ASMDashboardScreen;

  return (
    <DashboardStack.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTintColor: '#000',
        headerStyle: { backgroundColor: '#38e8ff' },
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,

        tabBarActiveTintColor: '#38e8ff',
        tabBarInactiveTintColor: '#999',
      })}
    >
      <DashboardStack.Screen
        name={designation === 'RM' ? 'RMDashboard' : 'ASMDashboard'}
        component={InitialDashboard}
        options={{
          title: "Hello " + employeeName || (designation === 'RM' ? 'RM Dashboard' : 'ASM Dashboard'),
        }}
      />
      <DashboardStack.Screen
        name="VendorsWithoutSalesOrder"
        component={VendorsWithoutSalesOrderScreen}
        options={{ title: 'NSO Dealers' }}
      />
      <DashboardStack.Screen
        name="PendingPaymentFiveDaysOld"
        component={PendingPaymentFiveDaysOldScreen}
        options={{ title: 'Payment Pending 5+ Days' }}
      />
    </DashboardStack.Navigator>
  );
};

// ─── Sales Order Stack ────────────────────────────────────────────────────────
const SalesOrderStackNavigator = () => (
  <SalesOrderStack.Navigator
    screenOptions={({ route }) => ({
      headerShown: true,
      headerTintColor: '#000',
      headerStyle: { backgroundColor: '#38e8ff' },
      headerTitleStyle: { fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerBackTitleVisible: false,

      tabBarActiveTintColor: '#38e8ff',
      tabBarInactiveTintColor: '#999',
    })}
  >
    <SalesOrderStack.Screen
      name="SalesOrderDashboard"
      component={SalesOrderDashboardScreen}
      options={{ title: 'Sales Order' }}
    />
    <SalesOrderStack.Screen
      name="TodaySalesOrder"
      component={TodaySalesOrderScreen}
      options={{ title: "Today's Sales Order" }}
    />
    <SalesOrderStack.Screen
      name="PendingSalesOrder"
      component={PendingSalesOrderScreen}
      options={{ title: 'Pending Sales Order' }}
    />
    <SalesOrderStack.Screen
      name="VendorsWithoutSalesOrderSO"
      component={VendorsWithoutSalesOrderScreen}
      options={{ title: 'NSO Dealers' }}
    />
  </SalesOrderStack.Navigator>
);

// ─── Payment Stack ────────────────────────────────────────────────────────────
const PaymentStackNavigator = () => (
  <PaymentStack.Navigator
    screenOptions={({ route }) => ({
      headerShown: true,
      headerTintColor: '#000',
      headerStyle: { backgroundColor: '#38e8ff' },
      headerTitleStyle: { fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerBackTitleVisible: false,

      tabBarActiveTintColor: '#38e8ff',
      tabBarInactiveTintColor: '#999',
    })}
  >
    <PaymentStack.Screen
      name="PaymentDashboard"
      component={PaymentDashboardScreen}
      options={{ title: 'Payment' }}
    />
    <PaymentStack.Screen
      name="PendingPayment"
      component={PendingPaymentScreen}
      options={{ title: 'Pending Payment' }}
    />
    <PaymentStack.Screen
      name="PaymentRecFromVendor"
      component={PaymentRecFromVendorScreen}
      options={{ title: 'Receive Payment' }}
    />
    <PaymentStack.Screen
      name="PaymentRecWithoutAmt"
      component={PaymentRecWithoutAmtScreen}
      options={{ title: 'Receive Blank Cheque' }}
    />
  </PaymentStack.Navigator>
);

// ─── Sales Letter Stack ───────────────────────────────────────────────────────
const SalesLetterStackNavigator = () => (
  <SalesLetterStack.Navigator
    screenOptions={({ route }) => ({
      headerShown: true,
      headerTintColor: '#000',
      headerStyle: { backgroundColor: '#38e8ff' },
      headerTitleStyle: { fontWeight: 'bold' },
      headerTitleAlign: 'center',
      headerBackTitleVisible: false,

      tabBarActiveTintColor: '#38e8ff',
      tabBarInactiveTintColor: '#999',
    })}
  >
    <SalesLetterStack.Screen
      name="SLDashboard"
      component={SLDashboardScreen}
      options={{ title: 'Sales Letter' }}
    />
    <SalesLetterStack.Screen
      name="PendingSalesLetter"
      component={PendingSalesLetterScreen}
      options={{ title: 'SL Request Pending' }}
    />
    <SalesLetterStack.Screen
      name="SLCurrentUpdates"
      component={SLCurrentUpdatesScreen}
      options={{ title: 'SL Current Updates' }}
    />
    <SalesLetterStack.Screen
      name="SLRecByRM"
      component={SLRecByRMScreen}
      options={{ title: 'Receive Sales Letter' }}
    />
    <SalesLetterStack.Screen
      name="ServiceBookStatus"
      component={ServiceBookStatusScreen}
      options={{ title: 'Service Book Status' }}
    />
    <SalesLetterStack.Screen
      name="HSRPNumberPending"
      component={HSRPNumberPendingScreen}
      options={{ title: 'HSRP Pending' }}
    />
    <SalesLetterStack.Screen
      name="AttachNewDocs"
      component={AttachNewDocsScreen}
      options={{ title: 'Attach Documents' }}
    />
    <SalesLetterStack.Screen
      name="AddDocumentModal"
      component={AddDocumentModalScreen}
      options={{ title: 'Add Document' }}
    />
  </SalesLetterStack.Navigator>
);

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#3880ff',
      tabBarInactiveTintColor: '#999',
      //   tabBarActiveLabelStyle: {
      //     fontSize: 12,
      //     fontWeight: 'bold', // or '700'
      //   },

      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, string> = {
          DashboardTab: 'bar-chart-outline',
          SalesOrderTab: 'print-outline',
          PaymentTab: 'wallet-outline',
          SalesLetterTab: 'newspaper-outline',
        };
        return <Ionicons name={icons[route.name]} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen
      name="DashboardTab"
      component={DashboardStackNavigator}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen
      name="SalesOrderTab"
      component={SalesOrderStackNavigator}
      options={{ title: 'Sales Order' }}
    />
    <Tab.Screen
      name="PaymentTab"
      component={PaymentStackNavigator}
      options={{ title: 'Payment' }}
    />
    <Tab.Screen
      name="SalesLetterTab"
      component={SalesLetterStackNavigator}
      options={{ title: 'Sales Letter' }}
    />
  </Tab.Navigator>
);

export default TabNavigator;
