/**
 * MIGRATION NOTE:
 * Angular: payment-dashboard.page.html — 3 ion-cards with routerLink
 * React Native: Same card pattern as SalesOrderDashboard.
 */
import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PaymentDashboardScreen = () => {
    const navigation = useNavigation<any>();

    const cards = [
        {
            image: require('../../assets/imgs/pendingpayment.jpg'),
            title: 'Pending payment.',
            subtitle: '',
            screen: 'PendingPayment',
        },
        {
            image: require('../../assets/imgs/PaymentRec.jpg'),
            title: 'Receive payment',
            subtitle: '',
            screen: 'PaymentRecFromVendor',
        },
        {
            image: require('../../assets/imgs/PaymentRecWithoutAmt.jpg'),
            title: 'Receive blank cheque',
            subtitle: '',
            screen: 'PaymentRecWithoutAmt',
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {cards.map((card, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.card}
                    onPress={() => {
                        console.log('[PaymentDashboard] Card pressed → screen:', card.screen);
                        navigation.navigate(card.screen);
                    }}
                    activeOpacity={0.85}>
                    <Image source={card.image} style={styles.cardImage} resizeMode="cover" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        {card.subtitle ? (
                            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                        ) : null}
                    </View>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 12 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 14,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: 14 },
    cardTitle: { fontWeight: '700', fontSize: 15, color: '#222' },
    cardSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
});

export default PaymentDashboardScreen;
