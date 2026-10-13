import * as ImagePicker from 'expo-image-picker';
import { useLocales } from 'expo-localization';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getTranslations } from '../constants/translations';
import { readStudents, type Student, writeStudents } from '../utils/studentStorage';

export default function StudentDetailScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: string }>();
  const locales = useLocales();
  const text = getTranslations(locales[0]?.languageCode);
  const studentId = params.id;
  const isCreate = params.mode === 'create';

  const [student, setStudent] = useState<Student | null>(null);
  const [hoTen, setHoTen] = useState('');
  const [maSinhVien, setMaSinhVien] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [editing, setEditing] = useState(isCreate);
  const [loading, setLoading] = useState(!isCreate);

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      globalThis.alert(`${title}\n\n${message}`);
      return;
    }

    Alert.alert(title, message);
  };

  useEffect(() => {
    if (isCreate) {
      return;
    }

    let active = true;

    readStudents()
      .then((students) => {
        if (!active) {
          return;
        }

        const found = students.find((item) => item.id === studentId);
        if (found) {
          setStudent(found);
          setHoTen(found.hoTen);
          setMaSinhVien(found.maSinhVien);
          setEmail(found.email);
          setAvatar(found.avatar);
        }
      })
      .catch((error: unknown) => {
        console.error('Failed to load student details:', error);
        if (active) {
          showMessage(text.appName, text.loadError);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isCreate, studentId, text.appName, text.loadError]);

  const validate = () => {
    if (!hoTen.trim() || !maSinhVien.trim() || !email.trim()) {
      showMessage(text.appName, text.required);
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showMessage(text.appName, text.invalidEmail);
      return false;
    }

    return true;
  };

  const persistStudent = async () => {
    try {
      const students = await readStudents();
      const normalizedStudentId = maSinhVien.trim().toLocaleLowerCase();
      const hasDuplicateId = students.some(
        (item) =>
          item.id !== studentId &&
          item.maSinhVien.trim().toLocaleLowerCase() === normalizedStudentId,
      );

      if (hasDuplicateId) {
        showMessage(text.appName, text.duplicateStudentId);
        return;
      }

      if (isCreate) {
        students.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          hoTen: hoTen.trim(),
          maSinhVien: maSinhVien.trim(),
          email: email.trim(),
          avatar: avatar.trim(),
        });
      } else {
        const index = students.findIndex((item) => item.id === studentId);
        if (index === -1) {
          showMessage(text.appName, text.notFound);
          return;
        }

        students[index] = {
          id: students[index].id,
          hoTen: hoTen.trim(),
          maSinhVien: maSinhVien.trim(),
          email: email.trim(),
          avatar: avatar.trim(),
        };
      }

      await writeStudents(students);
      if (Platform.OS === 'web') {
        router.replace('/');
        return;
      }

      Alert.alert(text.confirmation, text.saved, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to save student:', error);
      showMessage(text.appName, text.saveError);
    }
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    if (isCreate) {
      void persistStudent();
      return;
    }

    if (Platform.OS === 'web') {
      if (globalThis.confirm(text.editQuestion)) {
        void persistStudent();
      }
      return;
    }

    Alert.alert(text.confirmation, text.editQuestion, [
      { text: text.no, style: 'cancel' },
      { text: text.yes, onPress: () => void persistStudent() },
    ]);
  };

  const deleteStudent = async () => {
    try {
      const students = await readStudents();
      const remainingStudents = students.filter((item) => item.id !== studentId);

      if (remainingStudents.length === students.length) {
        showMessage(text.appName, text.notFound);
        return;
      }

      await writeStudents(remainingStudents);
      if (Platform.OS === 'web') {
        router.replace('/');
        return;
      }

      Alert.alert(text.confirmation, text.deleted, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to delete student:', error);
      showMessage(text.appName, text.deleteError);
    }
  };

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm(text.deleteQuestion)) {
        void deleteStudent();
      }
      return;
    }

    Alert.alert(text.confirmation, text.deleteQuestion, [
      { text: text.no, style: 'cancel' },
      { text: text.yes, style: 'destructive', onPress: () => void deleteStudent() },
    ]);
  };

  const chooseAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(text.appName, text.imagePermission);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Failed to choose a student avatar:', error);
      Alert.alert(text.appName, text.imageError);
    }
  };

  const cancelEditing = () => {
    if (student) {
      setHoTen(student.hoTen);
      setMaSinhVien(student.maSinhVien);
      setEmail(student.email);
      setAvatar(student.avatar);
      setEditing(false);
      return;
    }

    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{text.details}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isCreate && !student) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{text.notFound}</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>← {text.back}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← {text.back}</Text>
          </Pressable>

          <Text style={styles.title}>
            {isCreate ? text.addTitle : text.details}
          </Text>

          <View style={styles.avatarContainer}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarDefault}>
                <Text style={styles.avatarLetter}>
                  {hoTen.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            {editing && (
              <Pressable style={styles.chooseImageButton} onPress={() => void chooseAvatar()}>
                <Text style={styles.chooseImageText}>{text.chooseImage}</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.label}>{text.fullName}</Text>
          <TextInput
            style={styles.input}
            value={hoTen}
            onChangeText={setHoTen}
            editable={editing}
            placeholder={text.fullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>{text.studentId}</Text>
          <TextInput
            style={styles.input}
            value={maSinhVien}
            onChangeText={setMaSinhVien}
            editable={editing}
            placeholder={text.studentId}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>{text.email}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            editable={editing}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder={text.email}
          />

          <Text style={styles.label}>{text.avatarUrl}</Text>
          <TextInput
            style={styles.input}
            value={avatar}
            onChangeText={setAvatar}
            editable={editing}
            keyboardType="url"
            autoCapitalize="none"
            placeholder="https://..."
          />

          {isCreate ? (
            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.buttonText}>{text.cancel}</Text>
              </Pressable>
              <Pressable style={styles.saveButtonSmall} onPress={handleSave}>
                <Text style={styles.buttonText}>{text.save}</Text>
              </Pressable>
            </View>
          ) : !editing ? (
            <View style={styles.buttonRow}>
              <Pressable style={styles.editButton} onPress={() => setEditing(true)}>
                <Text style={styles.buttonText}>{text.edit}</Text>
              </Pressable>
              <Pressable style={styles.deleteButton} onPress={handleDelete}>
                <Text style={styles.buttonText}>{text.delete}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.buttonRow}>
              <Pressable style={styles.cancelButton} onPress={cancelEditing}>
                <Text style={styles.buttonText}>{text.cancel}</Text>
              </Pressable>
              <Pressable style={styles.saveButtonSmall} onPress={handleSave}>
                <Text style={styles.buttonText}>{text.save}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
  },
  title: {
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
    marginTop: 8,
    marginBottom: 25,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
  },
  avatarDefault: {
    width: 125,
    height: 125,
    borderRadius: 62.5,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 45,
    color: '#2563EB',
    fontWeight: '700',
  },
  chooseImageButton: {
    marginTop: 12,
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: '#DBEAFE',
  },
  chooseImageText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 7,
    marginTop: 10,
  },
  input: {
    width: '100%',
    minHeight: 50,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 25,
  },
  editButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#6B7280',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonSmall: {
    flex: 1,
    minHeight: 52,
    backgroundColor: '#16A34A',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageText: {
    color: '#374151',
    fontSize: 16,
    textAlign: 'center',
  },
});
