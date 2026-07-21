# VMS GATTI App

A React Native mobile application for **Gati's Vendor Management System (VMS)**, used by field staff — **Relationship Managers (RM)** and **Area Sales Managers (ASM)** — to manage sales orders, payments, sales letters, HSRP numbers, and vendor documents on the go.

> **Note:** This app is a ground-up migration of a legacy **Angular/Ionic + Capacitor** application to **React Native**. Most source files retain a `MIGRATION NOTE` comment block at the top explaining how the original Angular/Ionic concept was mapped to its React Native equivalent — useful context when comparing behavior against the old app.

## Tech Stack

- **React Native** 0.82 + **React** 19
- **TypeScript**
- **React Navigation** — native-stack + bottom-tabs
- **Axios** for API calls
- **react-native-config** for environment-based configuration (`.env` files)
- **AsyncStorage** for session/local persistence
- **react-native-bootsplash** for the native splash screen
- **react-native-vector-icons** (Ionicons / MaterialIcons)
- **Jest** + **react-test-renderer** for testing
- **ESLint** + **Prettier** for linting/formatting

## Prerequisites

Set up your environment by following the official React Native guide for **React Native CLI (not Expo)**:
https://reactnative.dev/docs/set-up-your-environment

You will need:

- Node.js `>= 20`
- A package manager (npm is used in this repo — see `package-lock.json`)
- **Android**: Android Studio, Android SDK, a configured emulator or physical device
- **iOS** (macOS only): Xcode, CocoaPods, an iOS Simulator or physical device
- Ruby + Bundler (for CocoaPods, see `Gemfile`)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. iOS only — install CocoaPods

```bash
bundle install
cd ios
bundle exec pod install
cd ..
```

### 3. Configure environment variables

The app reads its API base URL via `react-native-config` (`Config.API_URL`, see `src/services/api.ts`). Create the appropriate `.env` file(s) in the project root (these are git-ignored):

```
API_URL=https://your-api-host/api/
```

The `package.json` scripts reference environment-specific files:

- `.env` — default (used by `npm start` / `npm run android` / `npm run ios`)
- `.env.uat` — used by `npm run android:uat`
- `.env.live` — used by `npm run android:live`

### 4. Start Metro

```bash
npm start
```

### 5. Run the app

In a new terminal, with Metro running:

```bash
# Android (default env)
npm run android

# Android — UAT environment
npm run android:uat

# Android — Live/production environment
npm run android:live

# iOS
npm run ios
```

If everything is set up correctly, the app should launch in your Android Emulator/device or iOS Simulator/device.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the Metro bundler |
| `npm run android` | Build & run the Android app (default env) |
| `npm run android:uat` | Build & run the Android app with `.env.uat` |
| `npm run android:live` | Build & run the Android app with `.env.live` |
| `npm run ios` | Build & run the iOS app |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Jest test suite |

## Project Structure

```
├── App.tsx                    # Root component — providers + navigation container
├── index.js                   # RN entry point
├── src/
│   ├── assets/                 # Images, bootsplash assets
│   ├── components/             # Reusable UI + skeleton loading components
│   ├── context/                # AppContext — session, designation, selected vendor/RM state
│   ├── navigation/              # AppNavigator (auth stack) + TabNavigator (bottom tabs & nested stacks)
│   ├── screens/                 # Feature screens (one folder per screen)
│   │   ├── SignIn/
│   │   ├── RMDashboard/  ASMDashboard/
│   │   ├── SalesOrderDashboard/  TodaySalesOrder/  PendingSalesOrder/
│   │   ├── PaymentDashboard/  PendingPayment/  PaymentRecFromVendor/  PaymentRecWithoutAmt/
│   │   ├── SLDashboard/  PendingSalesLetter/  SLCurrentUpdates/  SLRecByRM/
│   │   ├── ServiceBookStatus/  HSRPNumberPending/
│   │   ├── AttachNewDocs/  AddDocumentModal/
│   │   └── VendorsWithoutSalesOrder/  PendingPaymentFiveDaysOld/  PendingSalesOrder/
│   ├── services/                # api.ts (axios API client), storage.ts (AsyncStorage wrapper)
│   ├── types/                   # Shared TypeScript types (API request/response shapes)
│   └── utils/                    # Formatters, helpers, login helpers, selection guards
├── android/                     # Native Android project
├── ios/                         # Native iOS project
└── __tests__/                   # Jest tests
```

## App Overview

- **Authentication** — Users sign in with a designation (`RM` or `ASM`), username, and password. The session token, designation, and related identifiers are persisted via `AsyncStorage` (see `src/services/storage.ts`) and exposed app-wide through `AppContext` (`src/context/AppContext.tsx`).
- **Navigation** — `AppNavigator` renders either the `SignIn` screen or the `MainTabs` bottom-tab navigator depending on whether a valid session exists. `MainTabs` (`src/navigation/TabNavigator.tsx`) has four tabs, each backed by its own native stack:
  - **Dashboard** — RM or ASM dashboard depending on the logged-in user's designation
  - **Sales Order** — today's / pending sales orders, vendors without sales orders
  - **Payment** — pending payments, payment receipt from vendor, blank cheque receipt
  - **Sales Letter** — sales letter requests, current updates, service book status, HSRP pending, document attachments
- **API layer** — All backend calls live in `src/services/api.ts`, grouped by domain (Auth, Vendor/RM lists, Dashboard, Sales Orders, Sales Letters, Service Book, Payment, HSRP, Documents). Requests are authenticated via a `SessionToken` header attached automatically for endpoints that require it.
- **Splash screen** — The native splash (`react-native-bootsplash`) stays visible until the initial auth check (`AsyncStorage` read) completes, avoiding any blank-screen flash before routing to `SignIn` or `MainTabs`.

## Testing

Run the test suite with:

```bash
npm test
```

## Troubleshooting

If you run into issues getting the app to run, check out the official React Native troubleshooting docs:
https://reactnative.dev/docs/troubleshooting

## Learn More

- [React Native website](https://reactnative.dev)
- [React Navigation docs](https://reactnavigation.org)
- [react-native-config docs](https://github.com/lugg/react-native-config)
