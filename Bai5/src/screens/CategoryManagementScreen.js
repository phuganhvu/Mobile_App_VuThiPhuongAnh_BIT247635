import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories, createCategory, updateCategory, deleteCategory, getCourses } from '../services/api';
import { colors, spacing, radius, font } from '../theme/colors';

function CategoryModal({ visible, onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setName(initial?.name || '');
    setDescription(initial?.description || '');
    setErrors({});
  }, [initial, visible]);

  const handleSave = async () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Tên danh mục không được trống';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    try {
      setLoading(true);
      await onSave({ name: name.trim(), description: description.trim() });
      onClose();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>{initial ? '✏️ Sửa danh mục' : '📁 Thêm danh mục'}</Text>

          <Text style={styles.fieldLabel}>Tên danh mục <Text style={{ color: colors.danger }}>*</Text></Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            placeholder="Nhập tên danh mục..."
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: null })); }}
          />
          {errors.name && <Text style={styles.errorMsg}>{errors.name}</Text>}

          <Text style={styles.fieldLabel}>Mô tả</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả danh mục..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>{initial ? 'Lưu thay đổi' : 'Thêm mới'}</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function CategoryManagementScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

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
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const getCourseCount = (catId) => courses.filter((c) => c.categoryId === catId).length;

  const handleAdd = () => {
    setEditTarget(null);
    setModalVisible(true);
  };

  const handleEdit = (cat) => {
    setEditTarget(cat);
    setModalVisible(true);
  };

  const handleSave = async (data) => {
    if (editTarget) {
      await updateCategory(editTarget.id, data);
    } else {
      await createCategory(data);
    }
    await loadData();
  };

  const handleDelete = (cat) => {
    const count = getCourseCount(cat.id);
    if (count > 0) {
      Alert.alert(
        '⚠️ Không thể xóa',
        `Danh mục "${cat.name}" đang có ${count} khóa học.\nVui lòng xóa hoặc chuyển các khóa học trước.`,
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      'Xác nhận xóa',
      `Xóa danh mục "${cat.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              await loadData();
            } catch (e) {
              Alert.alert('Lỗi', e.message);
            }
          },
        },
      ]
    );
  };

  const CATEGORY_COLORS = [
    colors.primary, colors.secondary, colors.info, colors.success, colors.warning,
  ];

  const getCatColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải danh mục...</Text>
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Summary banner */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{categories.length}</Text>
          <Text style={styles.summaryLabel}>Danh mục</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{courses.length}</Text>
          <Text style={styles.summaryLabel}>Khóa học</Text>
        </View>
      </View>

      {/* List */}
      {categories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyTitle}>Chưa có danh mục nào</Text>
          <Text style={styles.emptyText}>Nhấn nút + để thêm danh mục mới</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const count = getCourseCount(item.id);
            const catColor = getCatColor(index);
            return (
              <View style={styles.catCard}>
                {/* Color accent bar */}
                <View style={[styles.accentBar, { backgroundColor: catColor }]} />

                <View style={styles.catCardContent}>
                  <View style={styles.catHeader}>
                    <View style={[styles.catIconCircle, { backgroundColor: `${catColor}25` }]}>
                      <Text style={styles.catIconText}>📁</Text>
                    </View>
                    <View style={styles.catInfo}>
                      <Text style={styles.catName}>{item.name}</Text>
                      <Text style={styles.catDesc} numberOfLines={2}>{item.description || 'Không có mô tả'}</Text>
                    </View>
                    <View style={[styles.courseCountBadge, { backgroundColor: `${catColor}25` }]}>
                      <Text style={[styles.courseCountText, { color: catColor }]}>{count}</Text>
                      <Text style={[styles.courseCountLabel, { color: catColor }]}>khóa học</Text>
                    </View>
                  </View>

                  <View style={styles.catActions}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editActionBtn]}
                      onPress={() => handleEdit(item)}
                    >
                      <Text style={styles.actionBtnText}>✏️ Sửa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteActionBtn, count > 0 && styles.actionBtnDisabled]}
                      onPress={() => handleDelete(item)}
                    >
                      <Text style={[styles.actionBtnText, { color: count > 0 ? colors.textMuted : colors.danger }]}>
                        🗑️ Xóa
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAdd}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <CategoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
        initial={editTarget}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  loadingText: { color: colors.textSecondary, marginTop: spacing.md },
  errorIcon: { fontSize: 48, marginBottom: spacing.md },
  errorText: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.full },
  retryText: { color: '#fff', fontWeight: '700' },

  summaryBanner: {
    flexDirection: 'row', backgroundColor: colors.bgCard, margin: spacing.md,
    borderRadius: radius.xl, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryNum: { color: colors.primary, fontSize: font.xxxl, fontWeight: '900' },
  summaryLabel: { color: colors.textSecondary, fontSize: font.sm, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { fontSize: 64, marginBottom: spacing.md },
  emptyTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700', marginBottom: spacing.sm },
  emptyText: { color: colors.textSecondary, textAlign: 'center' },

  list: { padding: spacing.md, paddingBottom: 100 },
  catCard: {
    flexDirection: 'row', backgroundColor: colors.bgCard, borderRadius: radius.xl,
    marginBottom: spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
  },
  accentBar: { width: 4 },
  catCardContent: { flex: 1, padding: spacing.md },
  catHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  catIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  catIconText: { fontSize: 20 },
  catInfo: { flex: 1 },
  catName: { color: colors.textPrimary, fontSize: font.lg, fontWeight: '700', marginBottom: 4 },
  catDesc: { color: colors.textSecondary, fontSize: font.sm, lineHeight: 18 },
  courseCountBadge: { borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', minWidth: 56 },
  courseCountText: { fontSize: font.xl, fontWeight: '900', lineHeight: 24 },
  courseCountLabel: { fontSize: font.xs, fontWeight: '600' },
  catActions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center', borderWidth: 1 },
  editActionBtn: { borderColor: `${colors.primary}50`, backgroundColor: `${colors.primary}15` },
  deleteActionBtn: { borderColor: `${colors.danger}50`, backgroundColor: `${colors.danger}15` },
  actionBtnDisabled: { borderColor: colors.border, backgroundColor: 'transparent', opacity: 0.5 },
  actionBtnText: { fontSize: font.sm, fontWeight: '700', color: colors.primary },

  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.lg,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: colors.primary, shadowOpacity: 0.5, shadowRadius: 12,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 32 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: colors.bgCard, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: spacing.lg, paddingBottom: spacing.xxl,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: colors.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md,
  },
  modalTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800', marginBottom: spacing.md, textAlign: 'center' },
  fieldLabel: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600', marginBottom: 6, marginTop: spacing.sm },
  input: {
    backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    color: colors.textPrimary, fontSize: font.md,
  },
  inputError: { borderColor: colors.danger },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorMsg: { color: colors.danger, fontSize: font.xs, marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelBtnText: { color: colors.textSecondary, fontSize: font.md, fontWeight: '700' },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: radius.xl, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: font.md, fontWeight: '800' },
});
