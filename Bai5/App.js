import React from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme/colors';

export default function App() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && width > 500;

  return (
    <SafeAreaProvider style={styles.provider}>
      <View style={[styles.canvas, isWeb && styles.webCanvas]}>
        <View style={[styles.appFrame, isWeb && styles.webAppFrame, isDesktopWeb && styles.desktopAppFrame]}>
          <AppNavigator />
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: { flex: 1 },
  canvas: { flex: 1, backgroundColor: colors.bg },
  webCanvas: { alignItems: 'center' },
  appFrame: { flex: 1 },
  webAppFrame: { width: '100%', maxWidth: 430 },
  desktopAppFrame: {
    marginVertical: 24,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
});
