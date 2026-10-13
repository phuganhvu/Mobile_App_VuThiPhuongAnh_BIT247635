import { useLocales } from 'expo-localization';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getTranslations } from '../constants/translations';
import { readStudents, type Student } from '../utils/studentStorage';

export default function HomeScreen() {
  const locales = useLocales();
  const text = getTranslations(locales[0]?.languageCode);
  const [students, setStudents] = useState<Student[]>([]);

  const loadStudents = useCallback(async () => {
    try {
      setStudents(await readStudents());
    } catch (error) {
      console.error('Failed to load students:', error);
      Alert.alert(text.appName, text.loadError);
    }
  }, [text.appName, text.loadError]);

  useFocusEffect(
    useCallback(() => {
      void loadStudents();
    }, [loadStudents]),
  );

  const openStudent = (student: Student) => {
    router.push({
      pathname: '/explore',
      params: { id: student.id },
    });
  };

  const renderStudent = ({ item }: { item: Student }) => (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.studentCard,
        pressed && styles.studentCardPressed,
      ]}
      onPress={() => openStudent(item)}
    >
      {item.avatar ? (
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarDefault}>
          <Text style={styles.avatarLetter}>
            {item.hoTen.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.studentInfo}>
        <Text style={styles.studentName} numberOfLines={1}>
          {item.hoTen}
        </Text>
        <Text style={styles.studentId}>
          {text.studentId}: {item.maSinhVien}
        </Text>
        <Text style={styles.studentEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{text.appName}</Text>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.push({ pathname: '/explore', params: { mode: 'create' } })}
        >
          <Text style={styles.addButtonText}>{text.add}</Text>
        </Pressable>

        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👨‍🎓</Text>
            <Text style={styles.emptyText}>{text.empty}</Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={(item) => item.id}
            renderItem={renderStudent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
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
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    color: '#111827',
  },
  addButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  listContent: {
    paddingBottom: 20,
  },
  studentCard: {
    width: '100%',
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  studentCardPressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 12,
  },
  avatarDefault: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 25,
    fontWeight: '700',
    color: '#2563EB',
  },
  studentInfo: {
    flex: 1,
    minWidth: 0,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 5,
  },
  studentId: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 3,
  },
  studentEmail: {
    fontSize: 13,
    color: '#6B7280',
  },
  arrow: {
    fontSize: 30,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
