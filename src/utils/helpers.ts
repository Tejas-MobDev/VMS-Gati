/**
 * MIGRATION NOTE:
 * Angular: HelperService using Ionic LoadingController + AlertController
 * React Native: Alert from react-native (built-in, no install needed).
 *
 * Loading spinner is managed per-screen via useState (isLoading state).
 * This is more idiomatic in React than a global loading service.
 *
 * showAlert() replaces presentAlert(subheader, Msg)
 */
import { Alert } from 'react-native';

const HelperService = {
    /**
     * Replaces: allhelper.presentAlert(subheader, Msg)
     * Usage: HelperService.showAlert('Error', 'Something went wrong')
     */
    showAlert(title: string, message: string, onOk?: () => void): void {
        Alert.alert(title, message, [
            { text: 'OK', onPress: onOk },
        ]);
    },

    /**
     * Replaces: confirm dialogs (AlertController with multiple buttons)
     * Usage: HelperService.showConfirm('Title', 'Message', onConfirm, onCancel)
     */
    showConfirm(
        title: string,
        message: string,
        onConfirm: () => void,
        onCancel?: () => void,
    ): void {
        Alert.alert(title, message, [
            { text: 'Cancel', style: 'cancel', onPress: onCancel },
            { text: 'OK', onPress: onConfirm },
        ]);
    },
};

export default HelperService;
