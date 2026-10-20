import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors, spacing, radius, font } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen({ route, navigation }) {
  const { url, title } = route.params;
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🎬</Text>
          <Text style={styles.errorTitle}>Không thể phát video</Text>
          <Text style={styles.errorText}>URL: {url}</Text>
          <Text style={styles.errorHint}>
            Vui lòng kiểm tra URL video hoặc kết nối mạng
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtnSmall} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnSmallText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Video */}
      <View style={styles.videoWrapper}>
        <VideoView
          style={styles.video}
          player={player}
          allowsFullscreen
          allowsPictureInPicture
          contentFit="contain"
          onReadyForDisplay={() => setIsReady(true)}
          onError={(e) => setError(e)}
        />
        {!isReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải video...</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.videoTitle}>{title}</Text>
        <Text style={styles.videoUrlLabel}>🔗 Nguồn video:</Text>
        <Text style={styles.videoUrl} numberOfLines={2}>{url}</Text>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => player.play()}
          >
            <Text style={styles.controlBtnText}>▶ Phát</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlBtn, styles.controlBtnSecondary]}
            onPress={() => player.pause()}
          >
            <Text style={[styles.controlBtnText, { color: colors.textPrimary }]}>⏸ Tạm dừng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtnSmall: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center',
  },
  backBtnSmallText: { color: colors.textPrimary, fontSize: 22 },
  headerTitle: { flex: 1, color: colors.textPrimary, fontSize: font.md, fontWeight: '700', textAlign: 'center', marginHorizontal: spacing.sm },

  videoWrapper: {
    width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000',
    position: 'relative',
  },
  video: { width: '100%', height: '100%' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  loadingText: { color: '#fff', marginTop: spacing.sm, fontSize: font.md },

  infoContainer: { flex: 1, padding: spacing.md },
  videoTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '800', marginBottom: spacing.md },
  videoUrlLabel: { color: colors.textMuted, fontSize: font.xs, marginBottom: 4 },
  videoUrl: { color: colors.textSecondary, fontSize: font.xs, marginBottom: spacing.lg },

  controls: { flexDirection: 'row', gap: spacing.sm },
  controlBtn: {
    flex: 1, backgroundColor: colors.primary, borderRadius: radius.xl,
    paddingVertical: 12, alignItems: 'center',
  },
  controlBtnSecondary: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  controlBtnText: { color: '#fff', fontWeight: '700', fontSize: font.md },

  // Error state
  backBtn: { padding: spacing.md },
  backBtnText: { color: colors.primary, fontSize: font.md },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  errorIcon: { fontSize: 64, marginBottom: spacing.md },
  errorTitle: { color: colors.textPrimary, fontSize: font.xl, fontWeight: '700', marginBottom: spacing.sm },
  errorText: { color: colors.textMuted, fontSize: font.xs, textAlign: 'center', marginBottom: spacing.sm },
  errorHint: { color: colors.textSecondary, fontSize: font.md, textAlign: 'center', marginBottom: spacing.lg },
  retryBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full },
  retryText: { color: '#fff', fontWeight: '700' },
});
