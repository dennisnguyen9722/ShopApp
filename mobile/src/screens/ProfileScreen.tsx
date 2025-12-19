import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native' // Hook để reload khi quay lại màn hình này

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<any>(null)

  // Hàm kiểm tra xem có user trong máy không
  const checkUser = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user')
      if (userStr) {
        setUser(JSON.parse(userStr))
      } else {
        setUser(null)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Mỗi khi màn hình này được focus (mở ra), thì check lại user
  useFocusEffect(
    useCallback(() => {
      checkUser()
    }, [])
  )

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          await AsyncStorage.removeItem('token')
          await AsyncStorage.removeItem('user')
          setUser(null) // Reset về trạng thái chưa đăng nhập
        }
      }
    ])
  }

  // --- GIAO DIỆN CHƯA ĐĂNG NHẬP ---
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tài khoản</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.welcomeText}>Chào mừng đến SuperMall 👋</Text>
          <Text style={styles.subText}>
            Đăng nhập để xem đơn hàng và ưu đãi
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')} // Chuyển sang màn hình Login
          >
            <Text style={styles.loginButtonText}>Đăng nhập / Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  // --- GIAO DIỆN ĐÃ ĐĂNG NHẬP ---
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tài khoản</Text>
      </View>

      <View style={styles.userInfo}>
        <Image
          source={{
            uri: user.user?.avatar || 'https://via.placeholder.com/150'
          }}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.name}>{user.user?.name || 'Khách hàng'}</Text>
          <Text style={styles.email}>{user.user?.email}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>📦 Đơn mua</Text>
        </TouchableOpacity>
        {/* Thêm các menu khác ở đây */}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },

  // Style cho Guest
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  welcomeText: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  subText: { color: '#666', marginBottom: 24 },
  loginButton: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8
  },
  loginButtonText: { color: '#fff', fontWeight: 'bold' },

  // Style cho User
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12
  },
  avatar: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  name: { fontSize: 18, fontWeight: 'bold' },
  email: { color: '#666' },

  menu: { marginTop: 12 },
  menuItem: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  menuText: { fontSize: 16 },

  logoutButton: {
    margin: 20,
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold' }
})
