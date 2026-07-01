/**
 * MIGRATION NOTE:
 * Angular: sldashboard.page.html — 5 ion-cards with routerLink + queryParams
 * React Native: TouchableOpacity cards. queryParams replaced with navigation params.
 *
 * { param1: 'T' } queryParam on slrec-by-rm → navigation.navigate('SLRecByRM', {param1:'T'})
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

const SLDashboardScreen = () => {
    const navigation = useNavigation<any>();

    const cards = [
        {
            image: require('../../assets/imgs/SL_Pending.jpg'),
            title: 'SL request pending.',
            screen: 'PendingSalesLetter',
            params: undefined,
        },
        {
            image: require('../../assets/imgs/SL_update.jpg'),
            title: 'Sale letter Update.',
            screen: 'SLCurrentUpdates',
            params: undefined,
        },
        {
            image: require('../../assets/imgs/SL_Rec.jpg'),
            title: 'Receive SL.',
            screen: 'SLRecByRM',
            params: { param1: 'T' },
        },
        {
            image: require('../../assets/imgs/servicebookstatus.jpg'),
            title: 'Service book status.',
            screen: 'ServiceBookStatus',
            params: { param1: 'T' },
        },
        {
            image: require('../../assets/imgs/HSRPRecVehicleNumberPlate.jpg'),
            title: 'HSRP pending.',
            screen: 'HSRPNumberPending',
            params: undefined,
        },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {cards.map((card, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.card}
                    onPress={() => {
                        console.log('[SLDashboard] Card pressed → screen:', card.screen, '| params:', card.params);
                        navigation.navigate(card.screen, card.params);
                    }}
                    activeOpacity={0.85}>
                    <Image source={card.image} style={styles.cardImage} resizeMode="cover" />
                    <View style={styles.cardContent}>
                        <Text style={styles.cardTitle}>{card.title}</Text>
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
});

export default SLDashboardScreen;
