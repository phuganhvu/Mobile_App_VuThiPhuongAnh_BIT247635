import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { getCategories, createCourse, updateCourse } from '../services/api';
import { colors, spacing, radius, font } from '../theme/colors';

const DEFAULT_FORM = {
  title: '',
  description: '',
  categoryId: '',
  instructor: '',
  price: '',
  duration: '',
  thumbnail: '',
  trailerUrl: '',
  createdAt: new Date().toISOString().split('T')[0],
};

function FieldLabel({ label, required }) {
  return (
    <Text style={styles.label}>
      {label}{required && <Text style={styles.required}> *</Text>}
    </Text>
  );
}

export default function CourseFormScreen({ route, navigation }) {
  const { course } = route.params || {};
  const isEdit = !!course;

  const [form, setForm] = useState(isEdit ? {
    title: course.title || '',
    description: course.description || '',
    categoryId: course.categoryId || '',
    instructor: course.instructor || '',
    price: String(course.price ?? ''),
    duration: String(course.duration ?? ''),
    thumbnail: course.thumbnail || '',
    trailerUrl: course.trailerUrl || '',
    createdAt: course.createdAt || DEFAULT_FORM.createdAt,
  } : DEFAULT_FORM);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [thumbnailPreview, setThumbnailPreview] = useState(isEdit ? course.thumbnail : '');

  useEffect(() => {
    (async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
        if (!isEdit && cats.length > 0 && !form.categoryId) {
          setForm((f) => ({ ...f, categoryId: cats[0].id }));
        }
      } catch (e) {
        Alert.alert('Lỗi', e.message);
      } finally {
        setCatLoading(false);
      }
    })();
  }, []);

  const setField = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
    if (key === 'thumbnail') setThumbnailPreview(value);
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Tên khóa học không được trống';
    if (!form.instructor.trim()) errs.instructor = 'Tên giảng viên không được trống';
    if (!form.categoryId) errs.categoryId = 'Vui lòng chọn danh mục';
    if (!form.price) {
      errs.price = 'Học phí không được trống';
    } else if (isNaN(Number(form.price)) || Number(form.price) < 0) {
      errs.price = 'Học phí phải là số không âm';
    }
    if (!form.duration) {
      errs.duration = 'Thời lượng không được trống';
    } else if (isNaN(Number(form.duration)) || Number(form.duration) <= 0) {
      errs.duration = 'Thời lượng phải là số dương';
    }
    if (!form.thumbnail.trim()) errs.thumbnail = 'URL ảnh bìa không được trống';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Alert.alert('Kiểm tra lại', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Check categoryId exists
    const catExists = categories.find((c) => c.id === form.categoryId);
    if (!catExists) {
      setErrors({ categoryId: 'Danh mục không tồn tại' });
      return;
    }

    const payload = {
      ...form,
      price: Number(form.price),
      duration: Number(form.duration),
    };

    try {
      setLoading(true);
      if (isEdit) {
        await updateCourse(course.id, payload);
        Alert.alert('Thành công', 'Cập nhật khóa học thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await createCourse(payload);
        Alert.alert('Thành công', 'Thêm khóa học thành công', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

          {/* Header Banner */}
          <View style={styles.banner}>
            <Text style={styles.bannerIcon}>{isEdit ? '✏️' : '📚'}</Text>
            <Text style={styles.bannerTitle}>{isEdit ? 'Chỉnh sửa khóa học' : 'Thêm khóa học mới'}</Text>
            <Text style={styles.bannerSub}>
              {isEdit ? 'Cập nhật thông tin khóa học' : 'Điền đầy đủ thông tin để thêm khóa học'}
            </Text>
          </View>

          {/* Form fields */}

          {/* Title */}
          <FieldLabel label="Tên khóa học" required />
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            placeholder="Nhập tên khóa học..."
            placeholderTextColor={colors.textMuted}
            value={form.title}
            onChangeText={(v) => setField('title', v)}
          />
          {errors.title && <Text style={styles.errorMsg}>{errors.title}</Text>}

          {/* Description */}
          <FieldLabel label="Mô tả" />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Nhập mô tả khóa học..."
            placeholderTextColor={colors.textMuted}
            value={form.description}
            onChangeText={(v) => setField('description', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Instructor */}
          <FieldLabel label="Giảng viên" required />
          <TextInput
            style={[styles.input, errors.instructor && styles.inputError]}
            placeholder="Tên giảng viên..."
            placeholderTextColor={colors.textMuted}
            value={form.instructor}
            onChangeText={(v) => setField('instructor', v)}
          />
          {errors.instructor && <Text style={styles.errorMsg}>{errors.instructor}</Text>}

          {/* Category */}
          <FieldLabel label="Danh mục" required />
          {catLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.sm }} />
          ) : (
            <View style={[styles.pickerContainer, errors.categoryId && styles.inputError]}>
              <Picker
                selectedValue={form.categoryId}
                onValueChange={(v) => setField('categoryId', v)}
                style={styles.picker}
                dropdownIconColor={colors.textSecondary}
              >
                <Picker.Item label="-- Chọn danh mục --" value="" color={colors.textMuted} />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={cat.id} color={colors.textPrimary} />
                ))}
              </Picker>
            </View>
          )}
          {errors.categoryId && <Text style={styles.errorMsg}>{errors.categoryId}</Text>}

          {/* Price & Duration */}
          <View style={styles.row}>
            <View style={styles.half}>
              <FieldLabel label="Học phí (VNĐ)" required />
              <TextInput
                style={[styles.input, errors.price && styles.inputError]}
                placeholder="500000"
                placeholderTextColor={colors.textMuted}
                value={form.price}
                onChangeText={(v) => setField('price', v)}
                keyboardType="numeric"
              />
              {errors.price && <Text style={styles.errorMsg}>{errors.price}</Text>}
            </View>
            <View style={styles.half}>
              <FieldLabel label="Thời lượng (giờ)" required />
              <TextInput
                style={[styles.input, errors.duration && styles.inputError]}
                placeholder="30"
                placeholderTextColor={colors.textMuted}
                value={form.duration}
                onChangeText={(v) => setField('duration', v)}
                keyboardType="numeric"
              />
              {errors.duration && <Text style={styles.errorMsg}>{errors.duration}</Text>}
            </View>
          </View>

          {/* Thumbnail */}
          <FieldLabel label="URL ảnh bìa" required />
          <TextInput
            style={[styles.input, errors.thumbnail && styles.inputError]}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={colors.textMuted}
            value={form.thumbnail}
            onChangeText={(v) => setField('thumbnail', v)}
            autoCapitalize="none"
            keyboardType="url"
          />
          {errors.thumbnail && <Text style={styles.errorMsg}>{errors.thumbnail}</Text>}

          {/* Thumbnail preview */}
          {thumbnailPreview ? (
            <View style={styles.previewContainer}>
              <Text style={styles.previewLabel}>Xem trước ảnh bìa:</Text>
              <Image
                source={{ uri: thumbnailPreview }}
                style={styles.previewImage}
                onError={() => setThumbnailPreview('')}
              />
            </View>
          ) : null}

          {/* Trailer URL */}
          <FieldLabel label="URL Trailer (MP4)" />
          <TextInput
            style={styles.input}
            placeholder="https://example.com/trailer.mp4"
            placeholderTextColor={colors.textMuted}
            value={form.trailerUrl}
            onChangeText={(v) => setField('trailerUrl', v)}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* Created date */}
          <FieldLabel label="Ngày tạo" />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={form.createdAt}
            onChangeText={(v) => setField('createdAt', v)}
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>{isEdit ? '💾 Lưu thay đổi' : '➕ Thêm khóa học'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl },

  banner: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.lg,
    marginBottom: spacing.lg, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  bannerIcon: { fontSize: 40, marginBottom: spacing.sm },
  bannerTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800', marginBottom: 4 },
  bannerSub: { color: colors.textSecondary, fontSize: font.sm, textAlign: 'center' },

  label: { color: colors.textSecondary, fontSize: font.sm, fontWeight: '600', marginBottom: 6, marginTop: spacing.md },
  required: { color: colors.danger },

  input: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12,
    color: colors.textPrimary, fontSize: font.md,
  },
  inputError: { borderColor: colors.danger },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  errorMsg: { color: colors.danger, fontSize: font.xs, marginTop: 4 },

  pickerContainer: {
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, overflow: 'hidden',
  },
  picker: { color: colors.textPrimary, height: 50 },

  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },

  previewContainer: { marginTop: spacing.sm, marginBottom: spacing.sm },
  previewLabel: { color: colors.textMuted, fontSize: font.xs, marginBottom: spacing.xs },
  previewImage: {
    width: '100%', height: 180, borderRadius: radius.md,
    backgroundColor: colors.bgAccent,
  },

  submitBtn: {
    backgroundColor: colors.primary, borderRadius: radius.xl,
    paddingVertical: spacing.md, alignItems: 'center', justifyContent: 'center',
    marginTop: spacing.lg,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: font.lg, fontWeight: '800' },

  cancelBtn: {
    paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  cancelBtnText: { color: colors.textMuted, fontSize: font.md },
});
