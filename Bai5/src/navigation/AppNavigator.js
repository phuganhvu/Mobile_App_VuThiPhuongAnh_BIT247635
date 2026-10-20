import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, font } from '../theme/colors';

import CourseListScreen from '../screens/CourseListScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import CourseFormScreen from '../screens/CourseFormScreen';
import CategoryManagementScreen from '../screens/CategoryManagementScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bgCard },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { fontWeight: '700', fontSize: font.lg },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'slide_from_right',
};

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="CourseList" screenOptions={screenOptions}>
        <Stack.Screen
          name="CourseList"
          component={CourseListScreen}
          options={{ title: '📚 Khóa Học', headerShown: false }}
        />
        <Stack.Screen
          name="CourseDetail"
          component={CourseDetailScreen}
          options={{ title: 'Chi Tiết Khóa Học', headerTransparent: true, headerTitle: '' }}
        />
        <Stack.Screen
          name="CourseForm"
          component={CourseFormScreen}
          options={({ route }) => ({
            title: route.params?.course ? 'Chỉnh sửa khóa học' : 'Thêm khóa học',
          })}
        />
        <Stack.Screen
          name="CategoryManagement"
          component={CategoryManagementScreen}
          options={{ title: '📂 Quản lý danh mục' }}
        />
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayerScreen}
          options={{ title: 'Xem Trailer', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
