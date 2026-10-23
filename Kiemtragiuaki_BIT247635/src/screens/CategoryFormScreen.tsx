import React, { useContext, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import axios, { isAxiosError } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENDPOINTS } from '../constants/api';
import { LanguageContext } from '../context/LanguageContext';
import { saveCategoryOffline, replaceCachedCategory, removePendingCategory } from '../services/offlineCategories';
import { DishCategory, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryForm'>;

export default function CategoryFormScreen({ navigation, route }: Props) {
  const { t } = useContext(LanguageContext);
  const { category: editCategory } = route.params;
  const [name, setName] = useState(editCategory?.BIT247635_Name || '');
  const [description, setDescription] = useState(editCategory?.BIT247635_Description || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: editCategory ? t('editCategory') : t('addCategory') });
  }, [editCategory, navigation, t]);

  const handleSave = async () => {
    setSaveError(null);
    if (!name.trim()) {
      Alert.alert(t('error'), t('valCategoryNameEmpty'));
      return;
    }

    const category: DishCategory = {
      id: editCategory?.id || `local-category-${Date.now()}`,
      BIT247635_Id: editCategory?.BIT247635_Id || `CATEGORY_${Date.now()}`,
      BIT247635_Name: name.trim(),
      BIT247635_Description: description.trim(),
    };

    try {
      setSaving(true);
      const isLocalDraft = Boolean(editCategory?.id.startsWith('local-category-'));
      await saveCategoryOffline(category, !editCategory || isLocalDraft);
      let online = false;
      try {
        const connection = await NetInfo.fetch();
        online = Boolean(connection.isConnected && connection.isInternetReachable !== false);
      } catch {
        online = false;
      }

      if (online) {
        try {
          let savedCategory: DishCategory;
          if (editCategory && !isLocalDraft) {
            const response = await axios.put<DishCategory>(
              `${ENDPOINTS.CATEGORIES}/${editCategory.id}`,
              {
                BIT247635_Id: category.BIT247635_Id,
                BIT247635_Name: category.BIT247635_Name,
                BIT247635_Description: category.BIT247635_Description,
              }
            );
            savedCategory = response.data;
          } else {
            const existing = await axios.get<DishCategory[]>(ENDPOINTS.CATEGORIES);
            const match = existing.data.find(item => item.BIT247635_Id === category.BIT247635_Id);
            savedCategory = match || (await axios.post<DishCategory>(ENDPOINTS.CATEGORIES, {
              BIT247635_Id: category.BIT247635_Id,
              BIT247635_Name: category.BIT247635_Name,
              BIT247635_Description: category.BIT247635_Description,
            })).data;
          }
          await replaceCachedCategory(category.id, savedCategory);
          await removePendingCategory(category.id);
        } catch (error) {
          const details = isAxiosError(error) && error.response
            ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
            : error instanceof Error
              ? error.message
              : t('saveError');
          console.error('Category saved locally; remote sync is pending:', details);
        }
      }

      navigation.goBack();
      void route.params.refresh().catch(error => {
        console.error('Could not refresh categories after saving:', error);
      });
    } catch (error) {
      const details = isAxiosError(error) && error.response
        ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error instanceof Error
          ? error.message
          : t('saveError');
      setSaveError(`${t('categorySaveError')} ${details}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>BIT247635</Text>
        <Text style={styles.title}>{editCategory ? t('editCategory') : t('addCategory')}</Text>
        <Text style={styles.subtitle}>{t('categoryFormHint')}</Text>
      </View>
      <View style={styles.formCard}>
        <Text style={styles.label}>{t('categoryName')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={t('categoryNamePlaceholder')}
          placeholderTextColor="#98A096"
          maxLength={60}
        />
        <Text style={styles.label}>{t('description')}</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('categoryDescriptionPlaceholder')}
          placeholderTextColor="#98A096"
          multiline
          maxLength={250}
        />
        {saveError && <Text accessibilityRole="alert" style={styles.errorText}>{saveError}</Text>}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={() => void handleSave()}
          disabled={saving}
          accessibilityRole="button"
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveButtonText}>{t('save')}</Text>}
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
  errorText: { color: '#A23D32', fontSize: 13, lineHeight: 19, marginTop: 10 },
  saveButton: { backgroundColor: '#245B43', padding: 15, borderRadius: 14, alignItems: 'center', marginTop: 20, minHeight: 52, justifyContent: 'center' },
  disabledButton: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
