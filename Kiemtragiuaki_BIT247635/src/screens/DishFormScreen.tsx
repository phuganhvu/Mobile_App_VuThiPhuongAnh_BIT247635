import React, { useState, useContext, useLayoutEffect } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import axios, { isAxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENDPOINTS } from '../constants/api';
import { LanguageContext } from '../context/LanguageContext';
import { Dish, DishImage, RootStackParamList } from '../types';
import {
  removeOfflineAction,
  replaceCachedDish,
  saveDishOffline,
} from '../services/offlineDishes';

type Props = NativeStackScreenProps<RootStackParamList, 'DishForm'>;

export default function DishFormScreen({ route, navigation }: Props) {
  const { editDish, categories, refresh } = route.params || {};
  const { t } = useContext(LanguageContext);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editDish ? t('editDish') : t('addDish') });
  }, [editDish, navigation, t]);

  const [name, setName] = useState<string>(editDish?.BIT247635_Name || '');
  const [price, setPrice] = useState<string>(editDish?.BIT247635_Price?.toString() || '');
  const [prepTime, setPrepTime] = useState<string>(editDish?.BIT247635_PreparationTime?.toString() || '');
  const [isAvailable, setIsAvailable] = useState<boolean>(editDish ? editDish.BIT247635_IsAvailable : true);
  const [description, setDescription] = useState<string>(editDish?.BIT247635_Description || '');
  const [catId, setCatId] = useState<string>(editDish?.BIT247635_DishCategoryId || categories?.[0]?.BIT247635_Id || categories?.[0]?.id || '');
  const [imageUrls, setImageUrls] = useState<string>(
    editDish?.BIT247635_DishImage?.map(img => img.ImageUrl).join(', ') || ''
  );
  const [saving, setSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaveError(null);
    if (!name.trim()) return Alert.alert(t('error'), t('valNameEmpty'));
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) return Alert.alert(t('error'), t('valPriceInvalid'));
    if (!Number.isFinite(Number(prepTime)) || Number(prepTime) <= 0) return Alert.alert(t('error'), t('valPrepTimeInvalid'));
    if (!catId || !categories?.some(category => (category.BIT247635_Id || category.id) === catId)) {
      return Alert.alert(t('error'), t('valCategoryInvalid'));
    }

    const imagesArray: DishImage[] = imageUrls.split(',').map(url => url.trim()).filter(Boolean).map((url, idx) => ({
      ImageUrl: url,
      IsThumbnail: idx === 0
    }));

    const payload = {
      BIT247635_Id: editDish?.BIT247635_Id || `DISH_${Date.now()}`,
      BIT247635_Name: name,
      BIT247635_Price: Number(price),
      BIT247635_PreparationTime: Number(prepTime),
      BIT247635_IsAvailable: isAvailable,
      BIT247635_Description: description,
      BIT247635_DishCategoryId: catId,
      BIT247635_DishImage: imagesArray
    };

    try {
      setSaving(true);
      const isLocalDraft = Boolean(editDish?.id.startsWith('local-'));
      let isOnline = false;
      let syncError: string | null = null;
      const localDish: Dish = {
        ...payload,
        id: editDish?.id || `local-${Date.now()}`,
      };

      await saveDishOffline(localDish, !editDish || isLocalDraft);

      if (!isLocalDraft) {
        try {
          const connection = await NetInfo.fetch();
          isOnline = Boolean(connection.isConnected && connection.isInternetReachable !== false);
        } catch {
          isOnline = false;
        }
      }

      if (isOnline) {
        try {
          if (editDish) {
            await axios.put(`${ENDPOINTS.DISHES}/${editDish.id}`, payload);
            const savedDish = await axios.get<Dish>(`${ENDPOINTS.DISHES}/${editDish.id}`);
            if (savedDish.data.BIT247635_IsAvailable !== isAvailable) {
              throw new Error(t('statusNotSaved'));
            }
            await removeOfflineAction(editDish.id);
          } else {
            const created = await axios.post<Dish>(ENDPOINTS.DISHES, payload);
            await replaceCachedDish(localDish.id, created.data);
            await removeOfflineAction(localDish.id);
          }
        } catch (error) {
          syncError = isAxiosError(error) && error.response
            ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
            : error instanceof Error
              ? error.message
              : t('saveError');
          isOnline = false;
        }
      }
      navigation.goBack();
      void refresh().catch(error => {
        console.error('Could not refresh the dish list after saving:', error);
      });
      if (syncError) console.error('Dish saved locally; remote sync is pending:', syncError);
    } catch (error) {
      const details = isAxiosError(error) && error.response
        ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error instanceof Error
          ? error.message
          : t('saveError');
      setSaveError(`${t('saveError')} ${details}`);
      Alert.alert(t('error'), `${t('saveError')}\n${details}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>BIT247635</Text>
        <Text style={styles.title}>{editDish ? t('editDish') : t('addDish')}</Text>
        <Text style={styles.subtitle}>{editDish ? t('editDish') : t('addDish')}</Text>
      </View>
      <View style={styles.formCard}>
      <Text style={styles.label}>{t('name')}</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('name')} placeholderTextColor="#98A096" />

      <Text style={styles.label}>{t('price')}</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} placeholder="0" placeholderTextColor="#98A096" />

      <Text style={styles.label}>{t('prepTime')}</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={prepTime} onChangeText={setPrepTime} placeholder="15" placeholderTextColor="#98A096" />

      <Text style={styles.label}>{t('category')}</Text>
      <View style={styles.categoryRow}>
        {categories?.map(category => {
          const categoryId = category.BIT247635_Id || category.id;
          const selected = categoryId === catId;
          return (
            <TouchableOpacity
              key={categoryId}
              style={[styles.categoryChip, selected && styles.categoryChipSelected]}
              onPress={() => setCatId(categoryId)}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{category.BIT247635_Name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.label}>{t('description')}</Text>
      <TextInput style={[styles.input, styles.multiline]} value={description} onChangeText={setDescription} multiline />

      <Text style={styles.label}>{t('images')}</Text>
      <TextInput style={styles.input} value={imageUrls} onChangeText={setImageUrls} placeholder="https://image1.jpg, https://image2.jpg" placeholderTextColor="#98A096" autoCapitalize="none" />

      <View style={styles.switchRow}>
        <View>
          <Text style={styles.switchTitle}>{t('available')}</Text>
          <Text style={styles.switchHint}>{isAvailable ? t('availableOnly') : t('stopSelling')}</Text>
        </View>
        <Switch value={isAvailable} onValueChange={setIsAvailable} />
      </View>

      {saveError && <Text accessibilityRole="alert" style={styles.errorText}>{saveError}</Text>}

      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('save')}</Text>}
      </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5EF' },
  content: { padding: 20, paddingBottom: 36 },
  intro: { marginBottom: 18 },
  eyebrow: { color: '#788477', fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 6 },
  title: { color: '#173B2C', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#788477', fontSize: 13, marginTop: 5 },
  formCard: { backgroundColor: '#fff', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#ECEDE7' },
  label: { color: '#34473A', fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: '#E7EAE3', borderRadius: 13, paddingHorizontal: 13, paddingVertical: 12, backgroundColor: '#FAFAF7', color: '#23352C', fontSize: 14 },
  multiline: { minHeight: 86, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { backgroundColor: '#F2F3EF', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 9 },
  categoryChipSelected: { backgroundColor: '#245B43' },
  categoryText: { color: '#58655B', fontSize: 12, fontWeight: '700' },
  categoryTextSelected: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 18, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F0F1EC' },
  switchTitle: { color: '#34473A', fontSize: 13, fontWeight: '800' },
  switchHint: { color: '#788477', fontSize: 11, marginTop: 3 },
  saveBtn: { backgroundColor: '#245B43', padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 8, minHeight: 52, justifyContent: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  errorText: { color: '#A23D32', fontSize: 13, lineHeight: 19, marginTop: 10 }
});