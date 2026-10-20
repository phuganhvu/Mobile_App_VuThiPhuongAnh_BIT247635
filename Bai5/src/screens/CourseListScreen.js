import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, RefreshControl,
  StatusBar, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCourses, getCategories } from '../services/api';
import { colors, spacing, radius, font } from '../theme/colors';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export default function CourseListScreen({ navigation }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [cats, crs] = await Promise.all([getCategories(), getCourses()]);
      setCategories(cats);
      setCourses(crs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, loadData]);

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : 'Không xác định';
  };

  const filtered = courses.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat ? c.categoryId === selectedCat : true;
    return matchSearch && matchCat;
  });

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải khóa học...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Chào mừng 👋</Text>
          <Text style={styles.headerTitle}>Khóa học của bạn</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('CategoryManagement')}
          >
            <Text style={styles.iconBtnText}>📂</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.addBtn]}
            onPress={() => navigation.navigate('CourseForm', { course: null })}
          >
            <Text style={styles.iconBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm khóa học..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter chips */}
      <View style={styles.chipContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          <TouchableOpacity
            style={[styles.chip, !selectedCat && styles.chipActive]}
            onPress={() => setSelectedCat(null)}
          >
            <Text style={[styles.chipText, !selectedCat && styles.chipTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.chip, selectedCat === cat.id && styles.chipActive]}
              onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            >
              <Text style={[styles.chipText, selectedCat === cat.id && styles.chipTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>
          {filtered.length} khóa học{selectedCat || search ? ' (đã lọc)' : ''}
        </Text>
      </View>

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Không có khóa học</Text>
          <Text style={styles.emptyText}>
            {search || selectedCat ? 'Thử thay đổi bộ lọc' : 'Nhấn + để thêm khóa học mới'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
              activeOpacity={0.85}
            >
              {/* Thumbnail */}
              <Image
                source={item.thumbnail ? { uri: item.thumbnail } : null}
                style={styles.thumbnail}
                onError={(e) => {}}
              />

              {/* Duration badge */}
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>⏱ {item.duration}h</Text>
              </View>

              {/* Info */}
              <View style={styles.cardBody}>
                {/* Category tag */}
                <View style={styles.catTag}>
                  <Text style={styles.catTagText}>{getCategoryName(item.categoryId)}</Text>
                </View>

                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.cardInstructor}>👤 {item.instructor}</Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.cardPrice}>{formatPrice(item.price)}</Text>
                  <View style={styles.detailBtn}>
                    <Text style={styles.detailBtnText}>Chi tiết →</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingText: { color: colors.textSecondary, marginTop: spacing.md, fontSize: font.md },
  errorIcon: { fontSize: 48, marginBottom: spacing.md },
  errorText: { color: colors.danger, fontSize: font.md, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  retryText: { color: '#fff', fontWeight: '700', fontSize: font.md },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md,
  },
  headerSub: { color: colors.textMuted, fontSize: font.sm },
  headerTitle: { color: colors.textPrimary, fontSize: font.xxl, fontWeight: '800' },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 44, height: 44, borderRadius: radius.full,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  addBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  iconBtnText: { fontSize: font.lg },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bgCard, marginHorizontal: spacing.md,
    borderRadius: radius.lg, paddingHorizontal: spacing.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm,
  },
  searchIcon: { fontSize: 16, marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: font.md, paddingVertical: 12 },
  clearIcon: { color: colors.textMuted, fontSize: font.md, paddingLeft: spacing.sm },

  chipContainer: { marginBottom: spacing.xs },
  chipScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  statsRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  statsText: { color: colors.textMuted, fontSize: font.sm },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, fontSize: font.md, textAlign: 'center' },

  list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    marginBottom: spacing.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
    elevation: 4, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
  },
  thumbnail: { width: '100%', height: 180, backgroundColor: colors.bgAccent },
  durationBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: radius.full,
  },
  durationText: { color: '#fff', fontSize: font.xs, fontWeight: '600' },

  cardBody: { padding: spacing.md },
  catTag: {
    alignSelf: 'flex-start', backgroundColor: `${colors.primary}30`,
    paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, marginBottom: spacing.sm,
  },
  catTagText: { color: colors.primary, fontSize: font.xs, fontWeight: '700' },
  cardTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.xs },
  cardInstructor: { color: colors.textSecondary, fontSize: font.sm, marginBottom: spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { color: colors.success, fontSize: font.lg, fontWeight: '800' },
  detailBtn: {
    backgroundColor: `${colors.primary}20`, paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1, borderColor: `${colors.primary}50`,
  },
  detailBtnText: { color: colors.primary, fontSize: font.sm, fontWeight: '700' },
});
