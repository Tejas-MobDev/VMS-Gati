/**
 * MIGRATION NOTE:
 * Angular: salesorder-dashboard.page.html — 3 ion-cards with routerLink
 * React Native: TouchableOpacity cards with local images.
 *
 * ion-card → View with shadow styles
 * routerLink → navigation.navigate()
 * img src="../assets/..." → require('../../assets/...')
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

const SalesOrderDashboardScreen = () => {
    const navigation = useNavigation<any>();

    const cards = [
        {
            image: require('../../assets/imgs/SalesOrderPending.jpg'),
            title: 'Last 7 days pending sales order.',
            subtitle:
                'Your pending purchase order from dolphin, vehicle which are not dispatched.',
            screen: 'PendingSalesOrder',
        },
        {
            image: require('../../assets/imgs/Salesordertodays.jpg'),
            title: "Today's sales order.",
            subtitle: 'How many vendors ordered today will be displayed here.',
            screen: 'TodaySalesOrder',
        },
        {
            image: require('../../assets/imgs/NoSalesorder.jpg'),
            title: 'No sales order.',
            subtitle: "How many vendors didn't order from last 3 days.",
            screen: 'VendorsWithoutSalesOrderSO',
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {cards.map((card, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.card}
                    onPress={() => {
                        console.log('[SalesOrderDashboard] Card pressed → screen:', card.screen);
                        navigation.navigate(card.screen);
                    }}
                    activeOpacity={0.85}>
                    <Image source={card.image} style={styles.cardImage} resizeMode="cover" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
                        <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
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
        shadowColor: '#3880ff',
        shadowOpacity: 0.6,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    cardImage: { width: '100%', height: 160 },
    cardContent: { padding: 14 },
    cardTitle: { fontWeight: '700', fontSize: 15, color: '#222', marginBottom: 6 },
    cardSubtitle: { fontSize: 13, color: '#666', lineHeight: 19 },
});

export default SalesOrderDashboardScreen;