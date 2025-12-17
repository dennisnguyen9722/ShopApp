import React from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { fetchProducts } from '../api/productApi'
import ProductCard from '../components/ProductCard'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { RootStackParamList } from '../types'
import { Ionicons } from '@expo/vector-icons'

// Định nghĩa kiểu cho navigation để TypeScript nhắc code
type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  // 1. Dùng React Query gọi API
  const {
    data: products,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['products'], // Key định danh để cache
    queryFn: fetchProducts // Hàm gọi API
  })

  // 2. Xử lý khi đang tải
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={{ marginTop: 10, color: '#666' }}>
          Đang tải sản phẩm...
        </Text>
      </View>
    )
  }

  // 3. Xử lý khi lỗi
  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={50} color="red" />
        <Text>Lỗi kết nối. Vui lòng thử lại!</Text>
      </View>
    )
  }

  // 4. Hiển thị danh sách
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header đơn giản */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Chào mừng trở lại 👋</Text>
          <Text style={styles.headerTitle}>Khám phá Shop</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="notifications-outline" size={24} color="#333" />
        </View>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate('ProductDetail', { product: item })
            }
          />
        )}
        numColumns={2} // Chia 2 cột
        columnWrapperStyle={styles.columnWrapper} // Style căn chỉnh khoảng cách cột
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10
  },
  headerSub: { fontSize: 14, color: '#888' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  headerIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2
  },

  listContent: { padding: 16, paddingBottom: 100 },
  columnWrapper: { justifyContent: 'space-between' } // Đẩy 2 card ra 2 bên
})

export default HomeScreen
