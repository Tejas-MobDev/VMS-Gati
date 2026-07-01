/**
 * MIGRATION NOTE:
 * Angular: sign-in.page.ts + sign-in.page.html
 * React Native: Functional component with hooks.
 *
 * Ionic → RN mapping:
 *   ion-select             → @react-native-picker/picker (Picker)
 *   ion-input              → TextInput
 *   ion-button             → TouchableOpacity
 *   ion-icon (eye/eye-off) → Text toggle (or react-native-vector-icons)
 *   [(ngModel)]            → useState + onChangeText
 *   NavController.navigateRoot() → navigation.reset() — clears back stack
 *
 * Loading: local isLoading state drives ActivityIndicator overlay.
 * Auth: on success stores token + designation in AppContext then resets nav.
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
    Image,
    Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useAppContext } from '../../context/AppContext';
import { LogIn } from '../../services/api';
import HelperService from '../../utils/helpers';

const CURRENT_VERSION = '1.0.18';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'SignIn'>;

const SignInScreen = () => {
    const navigation = useNavigation<NavProp>();
    const { setSessionToken, setDesignation, setEmployeeName } = useAppContext();

    const [designation, setDesignationLocal] = useState('');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!designation) {
            console.log('designation not selected')
            HelperService.showAlert('Error', 'Please select a designation.');
            return;
        }
        if (!userName.trim()) {
            console.log('userName not selected')
            HelperService.showAlert('Error', 'Please enter your username.');
            return;
        }
        if (!password.trim()) {
            console.log('password not selected')
            HelperService.showAlert('Error', 'Please enter your password.');
            return;
        }

        const loginData = {
            UserName: userName,
            Password: password,
            DesignationName: designation,
            SessionDetails: {
                remote_user_agent: 0,
                device_token: '121',
                Ipaddress: '12',
                os_version: '12',
                device_model: '12',
            },
        };

        setIsLoading(true);
        try {
            // console.log('login started with data:', loginData);

            const response = await LogIn(loginData);
            // console.log('login Response:', response);

            if (response.IsSuccess === true) {
                const token = response.Data.SessionTok;
                await setSessionToken(token);
                await setDesignation(designation as 'RM' | 'ASM');

                const nameToStore = response.Data.EmployeeName || response.Data.EmpName || response.Data.Name || response.Data.UserName || userName;
                await setEmployeeName(nameToStore);

                // Replace entire navigation stack — mirrors NavController.navigateRoot()
                navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
            } else {
                HelperService.showAlert('Error', response.Msg);
            }
        } catch {
            HelperService.showAlert('Error', 'Error in web API');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled">
            {/* Logo */}
            <Image
                source={require('../../assets/imgs/logo.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Version */}
            <Text style={styles.versionText}>Version {CURRENT_VERSION}</Text>

            {/* Designation Picker — replaces ion-select */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Designation</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={designation}
                        onValueChange={val => {
                            console.log('[SignIn] Designation selected:', val);
                            setDesignationLocal(val);
                        }}
                        style={styles.picker}>
                        <Picker.Item label="Select Designation" value="" />
                        <Picker.Item label="RM" value="RM" />
                        <Picker.Item label="ASM" value="ASM" />
                    </Picker>
                </View>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>User Name</Text>
                <TextInput
                    style={styles.input}
                    value={userName}
                    onChangeText={val => {
                        // console.log('[SignIn] Username changed:', val);
                        setUserName(val);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="Enter username"
                    placeholderTextColor="#aaa"
                />
            </View>

            {/* Password with show/hide toggle */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordRow}>
                    <TextInput
                        style={[styles.input, styles.passwordInput]}
                        value={password}
                        onChangeText={val => {
                            // console.log('[SignIn] Password changed (length):', val.length);
                            setPassword(val);
                        }}
                        secureTextEntry={!passwordVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Enter password"
                        placeholderTextColor="#aaa"
                    />
                    <TouchableOpacity
                        style={styles.eyeBtn}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                    >
                        <Ionicons
                            name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                            size={20}
                            color="#000"
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
                style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
                onPress={handleLogin}
                disabled={isLoading}>
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.loginBtnText}>Login</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    logo: {
        width: '100%',
        height: 120,
        marginBottom: 8,
        alignSelf: 'center',
    },
    versionText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 12,
        marginBottom: 28,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        color: '#555',
        marginBottom: 4,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        fontSize: 15,
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
    picker: {
        color: '#222',
    },
    passwordRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },
    eyeBtn: {
        borderWidth: 1,
        borderLeftWidth: 0,
        borderColor: '#ddd',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 12 : 10,
        backgroundColor: '#fafafa',
    },
    eyeText: {
        fontSize: 18,
    },
    loginBtn: {
        backgroundColor: '#3880ff',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 8,
    },
    loginBtnDisabled: {
        opacity: 0.6,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default SignInScreen;
