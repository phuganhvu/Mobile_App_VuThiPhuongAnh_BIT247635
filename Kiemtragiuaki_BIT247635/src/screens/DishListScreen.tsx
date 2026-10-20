import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, ListRenderItem, ScrollView,
  RefreshControl
} from 'react-native';
import axios, { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ENDPOINTS } from '../constants/api';
import { LanguageContext } from '../context/LanguageContext';
import { Dish, DishCategory, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DishList'>;

export default function DishListScreen({ navigation }: Props) {
  const { t, lang, toggleLanguage } = useContext(LanguageContext);
  
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchText, setSearchText] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  const fetchData = useCallback(async (connected?: boolean | null) => {
    setLoading(true);
    setLoadError(null);
    try {
      const isConnected = connected === undefined
        ? (await NetInfo.fetch()).isConnected
        : connected;
      if (isConnected) {
        const [resCat, resDish] = await Promise.all([
          axios.get<DishCategory[]>(ENDPOINTS.CATEGORIES),
          axios.get<Dish[]>(ENDPOINTS.DISHES)
        ]);
        if (!Array.isArray(resDish.data)) {
          throw new Error(t('dishApiError'));
        }
        if (!Array.isArray(resCat.data)) {
          throw new Error(t('categoryApiError'));
        }
        const categoryData = Array.isArray(resCat.data) ? resCat.data : [];
        const dishData = Array.isArray(resDish.data) ? resDish.data : [];
        setCategories(categoryData);
        setDishes(dishData);
        await AsyncStorage.setItem('cached_dishes', JSON.stringify(dishData));
        await AsyncStorage.setItem('cached_categories', JSON.stringify(categoryData));
      } else {
        const cached = await AsyncStorage.getItem('cached_dishes');
        const cachedCat = await AsyncStorage.getItem('cached_categories');
        if (cached) setDishes(JSON.parse(cached));
        if (cachedCat) setCategories(JSON.parse(cachedCat));
      }
    } catch (error) {
      const message = isAxiosError(error) && error.response
        ? `${t('serverError')} (${error.response.status})`
        : error instanceof Error && (error.message === t('dishApiError') || error.message === t('categoryApiError'))
          ? error.message
          : t('loadError');
      setLoadError(message);
      try {
        const [cached, cachedCat] = await Promise.all([
          AsyncStorage.getItem('cached_dishes'),
          AsyncStorage.getItem('cached_categories'),
        ]);
        if (cached) setDishes(JSON.parse(cached) as Dish[]);
        if (cachedCat) setCategories(JSON.parse(cachedCat) as DishCategory[]);
      } catch (cacheError) {
        console.error('Could not read cached menu data:', cacheError);
      }
    } finally {
      setLoading(false);
    }
  }, [t]);

  const syncOfflineData = useCallback(async () => {
    try {
      const queue = await AsyncStorage.getItem('offline_queue');
      if (queue) {
        const actions = JSON.parse(queue);
        for (const act of actions) {
          if (act.type === 'ADD') {
            await axios.post(ENDPOINTS.DISHES, act.data);
          } else if (act.type === 'EDIT') {
            await axios.put(`${ENDPOINTS.DISHES}/${act.id}`, act.data);
          } else if (act.type === 'DELETE') {
            await axios.delete(`${ENDPOINTS.DISHES}/${act.id}`);
          }
        }
        await AsyncStorage.removeItem('offline_queue');
        await fetchData();
      }
    } catch (err) {
      console.log('Sync error:', err);
    }
  }, [fetchData]);

  useEffect(() => {
    void NetInfo.fetch().then(
      state => fetchData(state.isConnected),
      () => fetchData()
    );
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        void syncOfflineData();
      }
    });
    return () => unsubscribe();
  }, [fetchData, syncOfflineData]);

  const filteredDishes = dishes.filter(item => {
    const matchesName = (item.BIT247635_Name || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesCat = selectedCategory ? item.BIT247635_DishCategoryId === selectedCategory : true;
    const matchesAvailable = onlyAvailable ? item.BIT247635_IsAvailable === true : true;
    
    const price = Number(item.BIT247635_Price);
    const minP = minPrice !== '' ? Number(minPrice) : 0;
    const maxP = maxPrice !== '' ? Number(maxPrice) : Infinity;
    const matchesPrice = price >= minP && price <= maxP;

    return matchesName && matchesCat && matchesAvailable && matchesPrice;
  }).sort((a, b) => {
    if (sortBy === 'priceAsc') return a.BIT247635_Price - b.BIT247635_Price;
    if (sortBy === 'priceDesc') return b.BIT247635_Price - a.BIT247635_Price;
    if (sortBy === 'timeAsc') return a.BIT247635_PreparationTime - b.BIT247635_PreparationTime;
    return 0;
  });

  const renderDishItem: ListRenderItem<Dish> = ({ item }) => {
    const thumbImg = item.BIT247635_DishImage?.find(img => img.IsThumbnail)?.ImageUrl 
      || item.BIT247635_DishImage?.[0]?.ImageUrl 
      || '';

    const isQuick = item.BIT247635_PreparationTime <= 15;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.card}
        onPress={() => navigation.navigate('DishDetail', { dishId: item.id, refresh: fetchData })}
      >
        {thumbImg ? (
          <Image source={{ uri: thumbImg }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}><Text style={styles.thumbEmoji}>🍽️</Text></View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.dishName}>{item.BIT247635_Name}</Text>
          <Text style={styles.price}>{Number(item.BIT247635_Price).toLocaleString()} ₫</Text>
          <View style={styles.badgeRow}>
            <Text style={[styles.badge, isQuick ? styles.quick : styles.regular]}>
              {isQuick ? t('quickPrep') : t('regularPrep')} ({item.BIT247635_PreparationTime} {t('minuteShort')})
            </Text>
            {!item.BIT247635_IsAvailable && (
              <Text style={[styles.badge, styles.unavailable]}>{t('stopSelling')}</Text>
            )}
          </View>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>BIT247635</Text>
          <Text style={styles.headerTitle}>{t('appTitle')}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage} accessibilityRole="button">
          <Text style={styles.langText}>{lang === 'en' ? 'VI' : 'EN'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#8C938B"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryRow}>
        <TouchableOpacity
          style={[styles.categoryChip, selectedCategory === '' && styles.categoryChipActive]}
          onPress={() => setSelectedCategory('')}
        >
          <Text style={[styles.categoryText, selectedCategory === '' && styles.categoryTextActive]}>{t('allCategories')}</Text>
        </TouchableOpacity>
        {categories.map(category => {
          const categoryId = category.BIT247635_Id || category.id;
          const selected = selectedCategory === categoryId;
          return (
            <TouchableOpacity
              key={categoryId}
              style={[styles.categoryChip, selected && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(selected ? '' : categoryId)}
            >
              <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{category.BIT247635_Name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.filterPanel}>
        <View style={styles.filterRow}>
          <TextInput
            style={styles.priceInput}
            placeholder={t('priceMin')}
            placeholderTextColor="#8C938B"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
          />
          <TextInput
            style={styles.priceInput}
            placeholder={t('priceMax')}
            placeholderTextColor="#8C938B"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
          <TouchableOpacity
            style={[styles.sortBtn, onlyAvailable && styles.activeSort]}
            onPress={() => setOnlyAvailable(!onlyAvailable)}
          >
            <Text style={[styles.sortBtnText, onlyAvailable && styles.activeSortText]}>● {t('availableOnly')}</Text>
          </TouchableOpacity>
          {(['priceAsc', 'priceDesc', 'timeAsc'] as const).map(sort => (
            <TouchableOpacity
              key={sort}
              style={[styles.sortBtn, sortBy === sort && styles.activeSort]}
              onPress={() => setSortBy(sortBy === sort ? '' : sort)}
            >
              <Text style={[styles.sortBtnText, sortBy === sort && styles.activeSortText]}>
                {sort === 'timeAsc' ? t('prepTimeAsc') : t(sort)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>{t('menu')}</Text>
        <Text style={styles.resultsCount}>{filteredDishes.length} {t('results')}</Text>
      </View>

      {loading && dishes.length === 0 ? (
        <View style={styles.stateCard}>
          <ActivityIndicator size="large" color="#245B43" />
          <Text style={styles.stateText}>{t('loading')}</Text>
        </View>
      ) : loadError && dishes.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateEmoji}>☁️</Text>
          <Text style={styles.stateTitle}>{t('loadError')}</Text>
          <Text style={styles.errorDetail}>{loadError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void fetchData()}>
            <Text style={styles.retryText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listWrapper}>
          {loadError && dishes.length > 0 && (
            <Text style={styles.cachedNotice}>{t('loadError')} · {loadError}</Text>
          )}
          <FlatList
            data={filteredDishes}
            keyExtractor={(item) => item.id?.toString() || item.BIT247635_Id}
            renderItem={renderDishItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void fetchData()} tintColor="#245B43" />}
            ListEmptyComponent={
              <View style={styles.stateCard}>
                <Text style={styles.stateEmoji}>🍃</Text>
                <Text style={styles.stateTitle}>{t('noData')}</Text>
                <Text style={styles.stateText}>{loadError || t('emptyHint')}</Text>
              </View>
            }
          />
        </View>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('DishForm', { categories, refresh: fetchData })}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F5EF', paddingTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 18 },
  eyebrow: { color: '#788477', fontSize: 10, fontWeight: '800', letterSpacing: 1.7, marginBottom: 5 },
  headerTitle: { color: '#173B2C', fontSize: 24, fontWeight: '800', maxWidth: 290 },
  langBtn: { backgroundColor: '#E3E9DF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  langText: { color: '#245B43', fontWeight: '800', fontSize: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 14, height: 52, borderWidth: 1, borderColor: '#ECEDE7' },
  searchIcon: { color: '#245B43', fontSize: 26, marginRight: 9 },
  searchInput: { flex: 1, color: '#23352C', fontSize: 15, paddingVertical: 8 },
  categoryScroll: { maxHeight: 48, marginTop: 16, marginBottom: 10 },
  categoryRow: { paddingHorizontal: 20, alignItems: 'center', gap: 8 },
  categoryChip: { backgroundColor: '#ECEDE7', borderRadius: 18, paddingHorizontal: 15, paddingVertical: 10 },
  categoryChipActive: { backgroundColor: '#245B43' },
  categoryText: { color: '#58655B', fontSize: 12, fontWeight: '700' },
  categoryTextActive: { color: '#fff' },
  filterPanel: { backgroundColor: '#fff', marginHorizontal: 20, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: '#ECEDE7' },
  filterRow: { flexDirection: 'row', gap: 10 },
  priceInput: { flex: 1, backgroundColor: '#F6F5EF', borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, color: '#23352C', fontSize: 12 },
  sortRow: { flexDirection: 'row', gap: 8, paddingTop: 10 },
  sortBtn: { paddingHorizontal: 11, paddingVertical: 8, backgroundColor: '#F2F3EF', borderRadius: 12 },
  activeSort: { backgroundColor: '#245B43' },
  sortBtnText: { color: '#58655B', fontSize: 11, fontWeight: '700' },
  activeSortText: { color: '#fff' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 22, marginTop: 20, marginBottom: 10 },
  sectionTitle: { color: '#173B2C', fontSize: 18, fontWeight: '800' },
  resultsCount: { color: '#788477', fontSize: 12, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 },
  listWrapper: { flex: 1 },
  cachedNotice: { color: '#9A5B43', fontSize: 11, paddingHorizontal: 22, paddingBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 11, borderRadius: 20, marginBottom: 12, borderWidth: 1, borderColor: '#ECEDE7', shadowColor: '#21372A', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  thumb: { width: 82, height: 82, borderRadius: 15, marginRight: 13, backgroundColor: '#EEF0E9' },
  thumbPlaceholder: { width: 82, height: 82, borderRadius: 15, marginRight: 13, backgroundColor: '#EEF0E9', alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 30 },
  cardContent: { flex: 1, justifyContent: 'center', gap: 5 },
  dishName: { color: '#20392B', fontSize: 15, fontWeight: '800' },
  price: { color: '#C46A3B', fontSize: 14, fontWeight: '800' },
  badgeRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  badge: { overflow: 'hidden', fontSize: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, color: '#fff', fontWeight: '700' },
  quick: { backgroundColor: '#54866A' },
  regular: { backgroundColor: '#B8814F' },
  unavailable: { backgroundColor: '#8B9189' },
  cardArrow: { color: '#9AA398', fontSize: 26, paddingHorizontal: 4 },
  stateCard: { margin: 20, padding: 28, minHeight: 190, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderRadius: 22, borderWidth: 1, borderColor: '#ECEDE7' },
  stateEmoji: { fontSize: 34, marginBottom: 10 },
  stateTitle: { color: '#20392B', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  stateText: { color: '#788477', fontSize: 13, marginTop: 10, textAlign: 'center' },
  errorDetail: { color: '#9A5B43', fontSize: 11, marginTop: 7, textAlign: 'center' },
  retryButton: { backgroundColor: '#245B43', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 13, marginTop: 16 },
  retryText: { color: '#fff', fontWeight: '800' },
  fab: { position: 'absolute', right: 22, bottom: 24, backgroundColor: '#C46A3B', minWidth: 62, height: 62, paddingHorizontal: 18, borderRadius: 31, flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', elevation: 7, shadowColor: '#6A3926', shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  fabText: { color: '#fff', fontSize: 26, fontWeight: '500' }
});