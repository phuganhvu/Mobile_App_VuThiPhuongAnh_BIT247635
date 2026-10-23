import React, { useCallback, useContext, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import axios, { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENDPOINTS } from '../constants/api';
import { LanguageContext } from '../context/LanguageContext';
import {
  deleteCategoryOffline,
  mergePendingCategories,
  readPendingCategories,
  removePendingCategory,
} from '../services/offlineCategories';
import { Dish, DishCategory, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryManagement'>;

export default function CategoryManagementScreen({ navigation, route }: Props) {
  const { t } = useContext(LanguageContext);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DishCategory | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const connection = await NetInfo.fetch();
      if (connection.isConnected && connection.isInternetReachable !== false) {
        const [categoryResponse, dishResponse] = await Promise.all([
          axios.get<DishCategory[]>(ENDPOINTS.CATEGORIES),
          axios.get<Dish[]>(ENDPOINTS.DISHES),
        ]);
        if (!Array.isArray(categoryResponse.data) || !Array.isArray(dishResponse.data)) {
          throw new Error(t('categoryApiError'));
        }
        const pending = await readPendingCategories();
        const merged = mergePendingCategories(categoryResponse.data, pending);
        setCategories(merged);
        setDishes(dishResponse.data);
        await Promise.all([
          AsyncStorage.setItem('cached_categories', JSON.stringify(merged)),
          AsyncStorage.setItem('cached_dishes', JSON.stringify(dishResponse.data)),
        ]);
      } else {
        const [categoryValue, dishValue, pending] = await Promise.all([
          AsyncStorage.getItem('cached_categories'),
          AsyncStorage.getItem('cached_dishes'),
          readPendingCategories(),
        ]);
        if (categoryValue) {
          setCategories(mergePendingCategories(JSON.parse(categoryValue) as DishCategory[], pending));
        } else {
          setCategories(mergePendingCategories([], pending));
        }
        if (dishValue) setDishes(JSON.parse(dishValue) as Dish[]);
      }
    } catch (error) {
      const message = isAxiosError(error) && error.response
        ? `${t('serverError')} (${error.response.status})`
        : error instanceof Error && error.message === t('categoryApiError')
          ? error.message
          : t('loadError');
      setLoadError(message);
      try {
        const [categoryValue, dishValue, pending] = await Promise.all([
          AsyncStorage.getItem('cached_categories'),
          AsyncStorage.getItem('cached_dishes'),
          readPendingCategories(),
        ]);
        if (categoryValue) {
          setCategories(mergePendingCategories(JSON.parse(categoryValue) as DishCategory[], pending));
        } else {
          setCategories(mergePendingCategories([], pending));
        }
        if (dishValue) setDishes(JSON.parse(dishValue) as Dish[]);
      } catch (cacheError) {
        console.error('Could not load cached categories:', cacheError);
        setLoadError(t('categoryLoadError'));
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(useCallback(() => {
    void loadCategories();
    void route.params.refresh().catch((error: unknown) => {
      console.error('Could not refresh the menu after returning to category management:', error);
    });
  }, [loadCategories, route.params]));

  const openForm = (category?: DishCategory) => {
    navigation.navigate('CategoryForm', { category, refresh: loadCategories });
  };

  const confirmDeleteCategory = async () => {
    if (!deleteTarget || deleting) return;
    const category = deleteTarget;
    setDeleting(true);
    setDeleteError(null);
    setDeleteNotice(null);
    try {
      const connection = await NetInfo.fetch();
      const online = Boolean(connection.isConnected && connection.isInternetReachable !== false);
      let canCheckServer = false;
      let dishesToCheck = dishes;
      if (online) {
        try {
          const response = await axios.get<Dish[]>(ENDPOINTS.DISHES);
          dishesToCheck = response.data;
          canCheckServer = true;
        } catch (error) {
          if (isAxiosError(error) && !error.response) {
            console.warn('Could not reach the dish API; checking cached dishes before queuing deletion.');
          } else {
            throw error;
          }
        }
      }
      const inUse = dishesToCheck.some(dish =>
        dish.BIT247635_DishCategoryId === category.BIT247635_Id
      );
      if (inUse) {
        setDeleteError(t('categoryInUse'));
        return;
      }

      await deleteCategoryOffline(category);
      if (canCheckServer && !category.id.startsWith('local-category-')) {
        try {
          await axios.delete(`${ENDPOINTS.CATEGORIES}/${category.id}`);
          await removePendingCategory(category.id);
        } catch (error) {
          if (isAxiosError(error) && !error.response) {
            canCheckServer = false;
            console.warn('Category deleted locally; remote deletion is queued for retry.');
          } else {
            throw error;
          }
        }
      }
      setDeleteTarget(null);
      if (!canCheckServer) setDeleteNotice(t('categoryDeletedOffline'));
      await loadCategories();
      void route.params.refresh().catch((error: unknown) => {
        console.error('Could not refresh the dish list after category deletion:', error);
      });
    } catch (error) {
      const details = isAxiosError(error) && error.response
        ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
        : error instanceof Error
          ? error.message
          : t('deleteError');
      setDeleteError(`${t('categoryDeleteError')} ${details}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.eyebrow}>BIT247635</Text>
        <Text style={styles.title}>{t('categories')}</Text>
        <Text style={styles.subtitle}>{t('categoryManagementHint')}</Text>
      </View>

      {loadError && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{loadError}</Text>
        </View>
      )}
      {deleteNotice && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>{deleteNotice}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openForm()}
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>+ {t('addCategory')}</Text>
      </TouchableOpacity>

      {loading && categories.length === 0 ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#245B43" />
          <Text style={styles.emptyText}>{t('loadingCategories')}</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={item => item.id || item.BIT247635_Id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void loadCategories()} tintColor="#245B43" />
          }
          renderItem={({ item }) => {
            const dishCount = dishes.filter(dish =>
              dish.BIT247635_DishCategoryId === item.BIT247635_Id
            ).length;
            return (
              <View style={styles.card}>
                <View style={styles.cardCopy}>
                  <Text style={styles.categoryName}>{item.BIT247635_Name}</Text>
                  <Text style={styles.description}>
                    {item.BIT247635_Description || t('noCategoryDescription')}
                  </Text>
                  <Text style={styles.count}>
                    {dishCount} {dishCount === 1 ? t('categoryDishSingular') : t('categoryDishPlural')}
                  </Text>
                  {dishCount > 0 && (
                    <Text style={styles.inUseHint}>{t('categoryInUseShort')}</Text>
                  )}
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openForm(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('editCategory')}: ${item.BIT247635_Name}`}
                  >
                    <Text style={styles.editText}>{t('edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, dishCount > 0 && styles.disabledButton]}
                    onPress={() => {
                      setDeleteError(null);
                      setDeleteTarget(item);
                    }}
                    disabled={dishCount > 0 || deleting}
                    accessibilityRole="button"
                    accessibilityLabel={`${t('deleteCategory')}: ${item.BIT247635_Name}`}
                  >
                    <Text style={styles.deleteText}>{t('delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('noCategories')}</Text>
            </View>
          }
        />
      )}

      {deleteTarget && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>{t('deleteCategory')}</Text>
            <Text style={styles.confirmMessage}>
              {t('confirmDeleteCategory')} {'\n'}
              <Text style={styles.confirmCategory}>{deleteTarget.BIT247635_Name}</Text>
            </Text>
            {deleteError && <Text accessibilityRole="alert" style={styles.confirmError}>{deleteError}</Text>}
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteTarget(null)}
                disabled={deleting}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteButton, deleting && styles.disabledButton]}
                onPress={() => void confirmDeleteCategory()}
                disabled={deleting}
                accessibilityRole="button"
              >
                {deleting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.confirmDeleteText}>{t('delete')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5EF', padding: 20 },
  intro: { marginBottom: 18 },
  eyebrow: { color: '#788477', fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 6 },
  title: { color: '#173B2C', fontSize: 26, fontWeight: '800' },
  subtitle: { color: '#788477', fontSize: 13, marginTop: 5 },
  notice: { backgroundColor: '#FFF0D7', padding: 12, borderRadius: 12, marginBottom: 12 },
  noticeText: { color: '#75521D', fontSize: 12, fontWeight: '600' },
  addButton: { backgroundColor: '#245B43', borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 14 },
  addButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  listContent: { paddingBottom: 24, flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 15, marginBottom: 11, borderWidth: 1, borderColor: '#ECEDE7', flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardCopy: { flex: 1 },
  categoryName: { color: '#20392B', fontSize: 16, fontWeight: '800' },
  description: { color: '#788477', fontSize: 12, marginTop: 5 },
  count: { color: '#245B43', fontSize: 11, fontWeight: '700', marginTop: 8 },
  inUseHint: { color: '#9A5B43', fontSize: 10, fontWeight: '600', marginTop: 4 },
  actions: { gap: 7 },
  editButton: { backgroundColor: '#E3E9DF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  editText: { color: '#245B43', fontSize: 12, fontWeight: '800' },
  deleteButton: { backgroundColor: '#F9E8E4', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  deleteText: { color: '#A23D32', fontSize: 12, fontWeight: '800' },
  disabledButton: { opacity: 0.45 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyText: { color: '#788477', fontSize: 14, marginTop: 10, textAlign: 'center' },
  confirmOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10, backgroundColor: 'rgba(15, 28, 20, 0.42)', justifyContent: 'center', padding: 20 },
  confirmCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#ECEDE7' },
  confirmTitle: { color: '#173B2C', fontSize: 18, fontWeight: '800' },
  confirmMessage: { color: '#58655B', fontSize: 14, lineHeight: 21, marginTop: 10 },
  confirmCategory: { color: '#20392B', fontWeight: '800' },
  confirmError: { color: '#A23D32', fontSize: 13, lineHeight: 19, marginTop: 12 },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  cancelButton: { backgroundColor: '#ECEDE7', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 11 },
  cancelText: { color: '#34473A', fontWeight: '800' },
  confirmDeleteButton: { backgroundColor: '#A23D32', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 11, minWidth: 78, alignItems: 'center' },
  confirmDeleteText: { color: '#fff', fontWeight: '800' },
});
