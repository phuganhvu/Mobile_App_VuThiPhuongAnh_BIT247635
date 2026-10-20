import React, { useState, useEffect, useContext } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios, { isAxiosError } from 'axios';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENDPOINTS } from '../constants/api';
import { LanguageContext } from '../context/LanguageContext';
import { Dish, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DishDetail'>;

export default function DishDetailScreen({ route, navigation }: Props) {
  const { dishId, refresh } = route.params;
  const { t } = useContext(LanguageContext);
  const [dish, setDish] = useState<Dish | null>(null);
  const [selectedImg, setSelectedImg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    axios.get<Dish>(`${ENDPOINTS.DISHES}/${dishId}`).then(res => {
      if (!active) return;
      setLoadError(null);
      setDish(res.data);
      const thumb = res.data.BIT247635_DishImage?.find(img => img.IsThumbnail)?.ImageUrl
        || res.data.BIT247635_DishImage?.[0]?.ImageUrl;
      setSelectedImg(thumb || '');
    }).catch(error => {
      if (!active) return;
      setLoadError(isAxiosError(error) && error.response
        ? `${t('serverError')} (${error.response.status})`
        : t('loadError'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [dishId, t]);

  const handleDelete = () => {
    Alert.alert(t('delete'), t('confirmDelete'), [
      { text: t('cancel'), style: 'cancel' },
      { 
        text: t('ok'), 
        onPress: async () => {
          try {
            await axios.delete(`${ENDPOINTS.DISHES}/${dishId}`);
            refresh();
            navigation.goBack();
          } catch (error) {
            Alert.alert(t('error'), isAxiosError(error) && error.response
              ? `${t('deleteError')} (${error.response.status})`
              : t('deleteError'));
          }
        } 
      }
    ]);
  };

  if (loading) {
    return <View style={styles.state}><ActivityIndicator size="large" color="#245B43" /><Text style={styles.stateText}>{t('loading')}</Text></View>;
  }
  if (!dish) {
    return <View style={styles.state}><Text style={styles.stateEmoji}>☁️</Text><Text style={styles.stateTitle}>{loadError || t('noData')}</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.hero}>
        {selectedImg ? <Image source={{ uri: selectedImg }} style={styles.mainImage} /> : <View style={styles.imagePlaceholder}><Text style={styles.placeholderEmoji}>🍽️</Text></View>}
      </View>

      <ScrollView horizontal style={styles.imageList} showsHorizontalScrollIndicator={false}>
        {dish.BIT247635_DishImage?.map((img, idx) => (
          <TouchableOpacity key={`${img.ImageUrl}-${idx}`} onPress={() => setSelectedImg(img.ImageUrl)}>
            <Image 
              source={{ uri: img.ImageUrl }} 
              style={[styles.subImage, selectedImg === img.ImageUrl && styles.activeSubImage]} 
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.infoContainer}>
        <Text style={styles.eyebrow}>BIT247635</Text>
        <Text style={styles.title}>{dish.BIT247635_Name}</Text>
        <Text style={styles.price}>{Number(dish.BIT247635_Price).toLocaleString()} ₫</Text>
        <View style={styles.badgeRow}>
          <Text style={styles.infoBadge}>{dish.BIT247635_PreparationTime <= 15 ? t('quickPrep') : t('regularPrep')} · {dish.BIT247635_PreparationTime} {t('minuteShort')}</Text>
          <Text style={[styles.infoBadge, dish.BIT247635_IsAvailable ? styles.availableBadge : styles.unavailableBadge]}>
            {dish.BIT247635_IsAvailable ? t('availableOnly') : t('stopSelling')}
          </Text>
        </View>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionLabel}>{t('description')}</Text>
          <Text style={styles.detailText}>{dish.BIT247635_Description || '—'}</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity 
            style={[styles.btn, styles.editBtn]}
            onPress={() => navigation.navigate('DishForm', { editDish: dish, refresh })}
          >
            <Text style={styles.btnText}>{t('editDish')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={handleDelete}>
            <Text style={styles.btnText}>{t('delete')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5EF' },
  hero: { padding: 14, paddingBottom: 0 },
  mainImage: { width: '100%', height: 280, borderRadius: 24, backgroundColor: '#ECEDE7' },
  imagePlaceholder: { width: '100%', height: 240, borderRadius: 24, backgroundColor: '#ECEDE7', alignItems: 'center', justifyContent: 'center' },
  placeholderEmoji: { fontSize: 52 },
  imageList: { paddingHorizontal: 14, paddingVertical: 12, minHeight: 82 },
  subImage: { width: 62, height: 62, borderRadius: 14, marginRight: 9, backgroundColor: '#ECEDE7' },
  activeSubImage: { borderWidth: 3, borderColor: '#245B43' },
  infoContainer: { padding: 20, paddingTop: 8 },
  eyebrow: { color: '#788477', fontSize: 10, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: '#173B2C', fontSize: 27, fontWeight: '800', marginTop: 7 },
  price: { fontSize: 20, color: '#C46A3B', fontWeight: '800', marginVertical: 7 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 7 },
  infoBadge: { overflow: 'hidden', color: '#46614D', backgroundColor: '#E6ECE3', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 8, fontSize: 11, fontWeight: '700' },
  availableBadge: { color: '#245B43', backgroundColor: '#E2EEE4' },
  unavailableBadge: { color: '#6D716B', backgroundColor: '#E9EAE6' },
  descriptionCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#ECEDE7' },
  descriptionLabel: { color: '#788477', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  detailText: { color: '#34473A', fontSize: 14, lineHeight: 21, marginTop: 8 },
  btnRow: { flexDirection: 'row', marginTop: 22, gap: 10, marginBottom: 24 },
  btn: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  editBtn: { backgroundColor: '#245B43' },
  deleteBtn: { backgroundColor: '#F0E3DD' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  state: { flex: 1, backgroundColor: '#F6F5EF', alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateText: { color: '#788477', marginTop: 12 },
  stateTitle: { color: '#20392B', fontWeight: '800', textAlign: 'center', marginTop: 10 },
  stateEmoji: { fontSize: 38 }
});