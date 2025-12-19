import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Dimensions,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'

import { homeApi } from '../api/homeApi'
import ProductItem from '../components/ProductItem'

const { width } = Dimensions.get('window')

/* ==================== BASIC THEME (DỄ CUSTOM) ==================== */
const COLORS = {
  primary: '#5B5EF7',
  bg: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textLight: '#64748B',
  border: '#E5E7EB'
}

export default function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [p, b, c] = await Promise.all([
        homeApi.getProducts(),
        homeApi.getBanners(),
        homeApi.getCategories()
      ])

      setProducts(p.data.products || p.data || [])
      setBanners(b.data || [])
      setCategories(c.data || [])
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  /* ==================== BANNER (NO AUTOSLIDE – NO BG) ==================== */
  const Banner = () => {
    if (!banners.length) return null

    return (
      <View style={styles.bannerWrap}>
        <FlatList
          data={banners}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.bannerItem}>
              <Image
                source={{ uri: item.image }}
                style={styles.bannerImage}
                contentFit="contain"
              />
            </View>
          )}
        />
      </View>
    )
  }

  /* ==================== CATEGORIES ==================== */
  const Categories = () => (
    <View style={styles.categoryWrap}>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryItem}>
            <View style={styles.categoryIcon}>
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  style={styles.categoryImage}
                  contentFit="contain"
                />
              ) : (
                <Ionicons
                  name="grid-outline"
                  size={26}
                  color={COLORS.primary}
                />
              )}
            </View>
            <Text style={styles.categoryText} numberOfLines={2}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )

  const ListHeader = () => (
    <>
      <Banner />
      <Categories />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
      </View>
    </>
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <LinearGradient colors={['#5B5EF7', '#7C7FFF']} style={styles.header}>
        <Text style={styles.logo}>Supermall</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.textLight} />
          <TextInput
            placeholder="Tìm kiếm sản phẩm..."
            placeholderTextColor={COLORS.textLight}
            style={styles.searchInput}
          />
        </View>
      </LinearGradient>

      {/* BODY */}
      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 80 }}
          size="large"
          color={COLORS.primary}
        />
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item._id}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <ProductItem
              product={item}
              onPress={() =>
                navigation.navigate('ProductDetail', { id: item._id })
              }
            />
          )}
          ListHeaderComponent={ListHeader}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetchData()
              }}
            />
          }
        />
      )}
    </View>
  )
}

/* ==================== STYLES ==================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg
  },

  /* HEADER */
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  logo: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12
  },
  searchBox: {
    backgroundColor: '#FFF',
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text
  },

  /* BANNER */
  bannerWrap: {
    marginTop: 12
  },
  bannerItem: {
    width,
    height: 140, // 👈 gọn
    paddingHorizontal: 16
  },
  bannerImage: {
    width: '100%',
    height: '100%'
  },

  /* CATEGORY */
  categoryWrap: {
    marginTop: 16,
    paddingLeft: 16
  },
  categoryItem: {
    width: 72,
    marginRight: 12,
    alignItems: 'center'
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  categoryImage: {
    width: 40,
    height: 40
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center'
  },

  /* SECTION */
  sectionHeader: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text
  },

  /* PRODUCT */
  productRow: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 16
  }
})
