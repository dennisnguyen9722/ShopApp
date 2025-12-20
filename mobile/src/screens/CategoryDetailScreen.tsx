import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import ProductItem from '../components/ProductItem'
import axiosClient from '../api/axiosClient'

const { width } = Dimensions.get('window')
// Tính toán chuẩn từng pixel: (Màn hình - Padding trái phải 32 - Gap giữa 12) / 2
const GAP = 12
const PADDING = 16
const ITEM_WIDTH = (width - PADDING * 2 - GAP) / 2

const COLORS = {
  primary: '#5B50F5',
  secondary: '#8C85FF',
  bg: '#F3F4F6', // Màu nền xám nhẹ dịu mắt hơn
  text: '#1F2937',
  subText: '#9CA3AF',
  white: '#FFFFFF'
}

export default function CategoryDetailScreen({ route, navigation }: any) {
  const { id, name } = route.params
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    navigation.setOptions({ headerShown: false })
    fetchProductsByCategory()
  }, [id])

  const fetchProductsByCategory = async () => {
    try {
      const res = await axiosClient.get(`/products?category=${id}&limit=20`)
      setProducts(res.data.products || [])
    } catch (error) {
      console.log('Lỗi:', error)
    } finally {
      setLoading(false)
    }
  }

  const Header = () => (
    <LinearGradient
      colors={[COLORS.primary, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerContainer}
    >
      <SafeAreaView edges={['top', 'left', 'right']}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  )

  return (
    <View style={styles.container}>
      <Header />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          {products.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="cube-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
            </View>
          ) : (
            <FlatList
              data={products}
              numColumns={2}
              keyExtractor={(item) => item._id}
              // 👇 QUAN TRỌNG: Căn khoảng cách giữa các cột
              columnWrapperStyle={{ gap: GAP }}
              contentContainerStyle={{
                padding: PADDING,
                paddingBottom: 40
              }}
              renderItem={({ item }) => (
                // 👇 Truyền thẳng width đã tính toán vào style
                <View style={{ width: ITEM_WIDTH }}>
                  <ProductItem
                    product={item}
                    horizontal={false}
                    onPress={() =>
                      navigation.navigate('ProductDetail', { id: item._id })
                    }
                    // 👇 Truyền thêm prop customWidth (nếu component hỗ trợ) hoặc để view ngoài lo
                    customWidth={ITEM_WIDTH}
                  />
                </View>
              )}
            />
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerContainer: {
    paddingBottom: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 5
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10
  },
  emptyText: { marginTop: 12, color: COLORS.subText, fontSize: 16 }
})
