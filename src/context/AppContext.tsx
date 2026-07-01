/**
 * MIGRATION NOTE:
 * Angular: Each component injected StorageService individually via constructor DI.
 * React Native: Single AppContext provides session state to the entire tree.
 *
 * Keys preserved from Capacitor Preferences:
 *   UserSessiontk, DesingationName, SelectedVendorID, SelectedVendorName,
 *   SelectedRMID, SelectedRMName
 */
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import StorageService from '../services/storage';

export type Designation = 'RM' | 'ASM' | null;

interface AppContextType {
    sessionToken: string | null;
    designation: Designation;
    selectedVendorId: string;
    selectedVendorName: string;
    selectedRMId: string;
    selectedRMName: string;
    employeeName: string | null;
    isAuthChecked: boolean;
    setSessionToken: (token: string | null) => void;
    setDesignation: (d: Designation) => void;
    setSelectedVendor: (id: string, name: string) => void;
    setSelectedRM: (id: string, name: string) => void;
    setEmployeeName: (name: string | null) => void;
    clearSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [sessionToken, setSessionTokenState] = useState<string | null>(null);
    const [designation, setDesignationState] = useState<Designation>(null);
    const [selectedVendorId, setSelectedVendorIdState] = useState<string>('0');
    const [selectedVendorName, setSelectedVendorNameState] = useState<string>('');
    const [selectedRMId, setSelectedRMIdState] = useState<string>('0');
    const [selectedRMName, setSelectedRMNameState] = useState<string>('');
    const [employeeName, setEmployeeNameState] = useState<string | null>(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    // Load persisted values on startup — mirrors AppComponent.initializeApp()
    useEffect(() => {
        (async () => {
            const [token, desig, vendorId, vendorName, rmId, rmName, empName] =
                await Promise.all([
                    StorageService.get('UserSessiontk'),
                    StorageService.get('DesingationName'),
                    StorageService.get('SelectedVendorID'),
                    StorageService.get('SelectedVendorName'),
                    StorageService.get('SelectedRMID'),
                    StorageService.get('SelectedRMName'),
                    StorageService.get('LoggedInEmployeeName'),
                ]);
            setSessionTokenState(token);
            setDesignationState((desig as Designation) ?? null);
            setSelectedVendorIdState(vendorId ?? '0');
            setSelectedVendorNameState(vendorName ?? '');
            setSelectedRMIdState(rmId ?? '0');
            setSelectedRMNameState(rmName ?? '');
            setEmployeeNameState(empName);
            setIsAuthChecked(true);
        })();
    }, []);

    const setSessionToken = async (token: string | null) => {
        setSessionTokenState(token);
        if (token) {
            await StorageService.set('UserSessiontk', token);
        }
    };

    const setDesignation = async (d: Designation) => {
        setDesignationState(d);
        if (d) {
            await StorageService.set('DesingationName', d);
        }
    };

    const setSelectedVendor = async (id: string, name: string) => {
        setSelectedVendorIdState(id);
        setSelectedVendorNameState(name);
        await StorageService.set('SelectedVendorID', id);
        await StorageService.set('SelectedVendorName', name);
    };

    const setSelectedRM = async (id: string, name: string) => {
        setSelectedRMIdState(id);
        setSelectedRMNameState(name);
        await StorageService.set('SelectedRMID', id);
        await StorageService.set('SelectedRMName', name);
    };

    const setEmployeeName = async (name: string | null) => {
        setEmployeeNameState(name);
        if (name) {
            await StorageService.set('LoggedInEmployeeName', name);
        } else {
            await StorageService.remove('LoggedInEmployeeName');
        }
    };

    const clearSession = async () => {
        await StorageService.clear();
        setSessionTokenState(null);
        setDesignationState(null);
        setSelectedVendorIdState('0');
        setSelectedVendorNameState('');
        setSelectedRMIdState('0');
        setSelectedRMNameState('');
        setEmployeeNameState(null);
    };

    return (
        <AppContext.Provider
            value={{
                sessionToken,
                designation,
                selectedVendorId,
                selectedVendorName,
                selectedRMId,
                selectedRMName,
                employeeName,
                isAuthChecked,
                setSessionToken,
                setDesignation,
                setSelectedVendor,
                setSelectedRM,
                setEmployeeName,
                clearSession,
            }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook — replaces injecting StorageService in constructors
export const useAppContext = (): AppContextType => {
    const ctx = useContext(AppContext);
    if (!ctx) {
        throw new Error('useAppContext must be used inside AppProvider');
    }
    return ctx;
};
