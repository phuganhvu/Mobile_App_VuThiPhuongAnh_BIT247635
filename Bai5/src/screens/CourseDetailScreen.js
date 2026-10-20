import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Image, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCourse, getCategories, deleteCourse } from '../services/api';
import { colors, spacing, radius, font } from '../theme/colors';

const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const formatDate = (str) => {
  if (!str) return '—';
  const d = new Date(str);
  return d.toLocaleDateString('vi-VN');
};

function InfoRow({ label, value, valueStyle }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueStyle]}>{value}</Text>
    </View>
  );
}

export default function CourseDetailScreen({ route, navigation }) {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setError(null);
      const [c, cats] = await Promise.all([getCourse(courseId), getCategories()]);
      setCourse(c);
      setCategories(cats);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [courseId]);

  const getCategoryName = (id) => {
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : 'Không xác định';
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn chắc chắn muốn xóa khóa học "${course?.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await deleteCourse(courseId);
              navigation.goBack();
            } catch (e) {
              Alert.alert('Lỗi', e.message);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleWatchTrailer = () => {
    if (!course?.trailerUrl) {
      Alert.alert('Thông báo', 'Khóa học này chưa có trailer');
      return;
    }
    navigation.navigate('VideoPlayer', { url: course.trailerUrl, title: course.title });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết...</Text>
      </View>
    );
  }

  if (error || !course) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error || 'Không tìm thấy khóa học'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover image */}
        <View style={styles.imageContainer}>
          <Image
            source={course.thumbnail ? { uri: course.thumbnail } : null}
            style={styles.thumbnail}
          />
          {/* Gradient overlay */}
          <View style={styles.imageOverlay} />

          {/* Back button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          {/* Action buttons top-right */}
          <View style={styles.topActions}>
            <TouchableOpacity
              style={[styles.topActionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('CourseForm', { course })}
            >
              <Text style={styles.topActionText}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.topActionBtn, styles.deleteBtn]}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.topActionText}>🗑️</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Category badge */}
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>📂 {getCategoryName(course.categoryId)}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{course.title}</Text>

          {/* Quick stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>⏱</Text>
              <Text style={styles.statValue}>{course.duration}h</Text>
              <Text style={styles.statLabel}>Thời lượng</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={[styles.statValue, { color: colors.success, fontSize: font.sm }]}>
                {formatPrice(course.price)}
              </Text>
              <Text style={styles.statLabel}>Học phí</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={[styles.statValue, { fontSize: font.sm }]}>{formatDate(course.createdAt)}</Text>
              <Text style={styles.statLabel}>Ngày tạo</Text>
            </View>
          </View>

          {/* Info section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin khóa học</Text>
            <View style={styles.infoCard}>
              <InfoRow label="👤 Giảng viên" value={course.instructor} />
              <View style={styles.divider} />
              <InfoRow label="📂 Danh mục" value={getCategoryName(course.categoryId)} />
              <View style={styles.divider} />
              <InfoRow
                label="💰 Học phí"
                value={formatPrice(course.price)}
                valueStyle={{ color: colors.success, fontWeight: '800' }}
              />
              <View style={styles.divider} />
              <InfoRow label="⏱ Thời lượng" value={`${course.duration} giờ`} />
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả khóa học</Text>
            <View style={styles.descCard}>
              <Text style={styles.descText}>{course.description || 'Chưa có mô tả'}</Text>
            </View>
          </View>

          {/* Trailer button */}
          <TouchableOpacity style={styles.trailerBtn} onPress={handleWatchTrailer}>
            <View style={styles.trailerBtnInner}>
              <Text style={styles.trailerBtnIcon}>▶</Text>
              <Text style={styles.trailerBtnText}>Xem Trailer</Text>
            </View>
          </TouchableOpacity>

          {/* Edit button */}
          <TouchableOpacity
            style={styles.editFullBtn}
            onPress={() => navigation.navigate('CourseForm', { course })}
          >
            <Text style={styles.editFullBtnText}>✏️ Chỉnh sửa khóa học</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  retryText: { color: '#fff', fontWeight: '700' },

  imageContainer: { position: 'relative', height: 300 },
  thumbnail: { width: '100%', height: 300 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,15,26,0.35)',
  },

  backBtn: {
    position: 'absolute', top: 50, left: spacing.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 20, lineHeight: 22 },

  topActions: { position: 'absolute', top: 50, right: spacing.md, flexDirection: 'row', gap: spacing.sm },
  topActionBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  editBtn: { backgroundColor: 'rgba(102,126,234,0.85)' },
  deleteBtn: { backgroundColor: 'rgba(245,87,108,0.85)' },
  topActionText: { fontSize: 16 },

  catBadge: {
    position: 'absolute', bottom: spacing.md, left: spacing.md,
    backgroundColor: `${colors.primary}dd`, paddingHorizontal: spacing.md,
    paddingVertical: 6, borderRadius: radius.full,
  },
  catBadgeText: { color: '#fff', fontSize: font.sm, fontWeight: '700' },

  content: { padding: spacing.md },
  title: { color: colors.textPrimary, fontSize: font.xxl, fontWeight: '800', marginBottom: spacing.md, lineHeight: 32 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { color: colors.textPrimary, fontSize: font.md, fontWeight: '700', textAlign: 'center' },
  statLabel: { color: colors.textMuted, fontSize: font.xs, marginTop: 2 },

  section: { marginBottom: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', marginBottom: spacing.sm },

  infoCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  infoLabel: { color: colors.textSecondary, fontSize: font.md },
  infoValue: { color: colors.textPrimary, fontSize: font.md, fontWeight: '600', flex: 1, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.border },

  descCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  descText: { color: colors.textSecondary, fontSize: font.md, lineHeight: 24 },

  trailerBtn: {
    borderRadius: radius.xl, overflow: 'hidden', marginBottom: spacing.sm,
    backgroundColor: colors.primary,
  },
  trailerBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, gap: spacing.sm },
  trailerBtnIcon: { color: '#fff', fontSize: 20 },
  trailerBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '800' },

  editFullBtn: {
    borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.primary,
    paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl,
  },
  editFullBtnText: { color: colors.primary, fontSize: font.md, fontWeight: '700' },
});
