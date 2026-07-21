import type { Designation } from '../context/AppContext';
import HelperService from './helpers';

type NavigationLike = { goBack: () => void };

/**
 * RM: requires a specific vendor.
 * ASM: requires at least one specific RM or vendor (not both "All").
 */
export function isDashboardSelectionValid(
  designation: Designation,
  selectedVendorId: string,
  selectedRMId: string,
): boolean {
  if (designation === 'RM') {
    return !!(selectedVendorId && selectedVendorId !== '0');
  }

  if (designation === 'ASM') {
    const isAllRM = !selectedRMId || selectedRMId === '0';
    const isAllVendor = !selectedVendorId || selectedVendorId === '0';
    return !(isAllRM && isAllVendor);
  }

  return true;
}

/**
 * Blocks list screens when dashboard selection is "All".
 * Shows an alert and navigates back when selection is invalid.
 */
export function guardDashboardSelection(
  designation: Designation,
  selectedVendorId: string,
  selectedRMId: string,
  navigation: NavigationLike,
): boolean {
  if (isDashboardSelectionValid(designation, selectedVendorId, selectedRMId)) {
    return true;
  }

  if (designation === 'RM') {
    HelperService.showAlert(
      'Error',
      'Please go to dashboard and select a vendor.',
      () => navigation.goBack(),
    );
  } else if (designation === 'ASM') {
    HelperService.showAlert(
      'Error',
      'Please go to dashboard and select an RM or vendor.',
      () => navigation.goBack(),
    );
  }

  return false;
}
