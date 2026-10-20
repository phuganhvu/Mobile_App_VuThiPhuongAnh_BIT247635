import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './src/context/LanguageContext';

import DishListScreen from './src/screens/DishListScreen';
import DishDetailScreen from './src/screens/DishDetailScreen';
import DishFormScreen from './src/screens/DishFormScreen';
import { RootStackParamList } from './src/types';
import { LanguageContext } from './src/context/LanguageContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { t } = useContext(LanguageContext);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="DishList"
        screenOptions={{
          headerStyle: { backgroundColor: '#173B2C' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#F6F5EF' },
        }}
      >
        <Stack.Screen
          name="DishList"
          component={DishListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="DishDetail"
          component={DishDetailScreen}
          options={{ title: t('dishDetail') }}
        />
        <Stack.Screen
          name="DishForm"
          component={DishFormScreen}
          options={{ title: t('dishForm') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return <LanguageProvider><AppNavigator /></LanguageProvider>;
}