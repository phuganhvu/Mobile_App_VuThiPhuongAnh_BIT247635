import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>

      {/* Hàng 1: Ô 1 và 2 */}
      <View style={styles.row}>
        <View style={[styles.box, styles.box1]}>
          <Text style={styles.numberWhite}>1</Text>
        </View>

        <View style={[styles.box, styles.box2]}>
          <Text style={styles.numberWhite}>2</Text>
        </View>
      </View>

      {/* Hàng 2: Ô 3, 4 và 5 */}
      <View style={styles.row}>
        <View style={[styles.box, styles.box3]}>
          <Text style={styles.numberBlack}>3</Text>
        </View>

        <View style={[styles.box, styles.box4]}>
          <Text style={styles.numberWhite}>4</Text>
        </View>

        <View style={[styles.box, styles.box5]}>
          <Text style={styles.numberWhite}>5</Text>
        </View>
      </View>

      {/* Hàng 3: Ô 6 */}
      <View style={styles.row}>
        <View style={[styles.box, styles.box6]}>
          <Text style={styles.numberWhite}>6</Text>
        </View>
      </View>

      {/* Họ tên - MSSV */}
      <View style={styles.studentContainer}>
        <Text style={styles.studentText}>
          Vũ Thị Phương Anh - BIT247635
        </Text>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',

    // Tạo khoảng cách với thanh giờ của Android
    paddingTop: 55,

    // Khoảng cách 2 bên giống ảnh mẫu
    paddingHorizontal: 14,
  },

  row: {
    flexDirection: 'row',

    // Khoảng cách giữa các ô
    gap: 4,

    // Khoảng cách giữa các hàng
    marginBottom: 4,
  },

  box: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // =========================
  // HÀNG 1
  // =========================

  box1: {
    flex: 1,
    height: 180,
    backgroundColor: '#1976F3',
  },

  box2: {
    flex: 1,
    height: 180,
    backgroundColor: '#F44336',
  },

  // =========================
  // HÀNG 2
  // =========================

  box3: {
    flex: 0.5,
    height: 180,
    backgroundColor: '#FFD719',
  },

  box4: {
    flex: 0.5,
    height: 180,
    backgroundColor: '#2EAD61',
  },

  box5: {
    flex: 1,
    height: 180,
    backgroundColor: '#7935D8',
  },

  // =========================
  // Ô 6
  // =========================

  box6: {
    flex: 1,
    height: 168,
    backgroundColor: '#FF7900',
  },

  // =========================
  // SỐ
  // =========================

  numberWhite: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  numberBlack: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },

  // =========================
  // HỌ TÊN - MSSV
  // =========================

  studentContainer: {
    flex: 1,

    justifyContent: 'flex-end',
    alignItems: 'center',

    paddingBottom: 38,
  },

  studentText: {
    fontSize: 12,
    color: '#555555',
  },
});