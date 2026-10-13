import AsyncStorage from '@react-native-async-storage/async-storage';

export type Student = {
  id: string;
  hoTen: string;
  maSinhVien: string;
  email: string;
  avatar: string;
};

const STORAGE_KEY = 'students';

function isStudent(value: unknown): value is Student {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const student = value as Record<string, unknown>;

  return (
    typeof student.id === 'string' &&
    typeof student.hoTen === 'string' &&
    typeof student.maSinhVien === 'string' &&
    typeof student.email === 'string' &&
    typeof student.avatar === 'string'
  );
}

export async function readStudents(): Promise<Student[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (data === null) {
    return [];
  }

  const students: unknown = JSON.parse(data);

  if (!Array.isArray(students) || !students.every(isStudent)) {
    throw new Error('Stored student data has an invalid format.');
  }

  return students;
}

export async function writeStudents(students: Student[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}
