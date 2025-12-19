// src/navigation/AppNavigator.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

// Import màn hình
import HomeScreen from '../screens/HomeScreen'
import CartScreen from '../screens/CartScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import LoginScreen from '../screens/LoginScreen' // 👈 1. Import Login
import ProfileScreen from '../screens/ProfileScreen'
import { RootStackParamList } from '../types'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<RootStackParamList>()

// 1. Tạo Tab Bar (Giữ nguyên không đổi)
const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'HomeTab')
            iconName = focused ? 'home' : 'home-outline'
          else if (route.name === 'CartTab')
            iconName = focused ? 'cart' : 'cart-outline'

          return <Ionicons name={iconName} size={size} color={color} />
        }
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Trang chủ' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{ title: 'Giỏ hàng' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Tài khoản' }}
      />
    </Tab.Navigator>
  )
}

// 2. Sửa lại Stack chính
const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main" // 👈 2. Đặt Login làm màn hình đầu tiên
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Main" component={BottomTabs} />

      {/* Màn hình Login giờ chỉ là màn hình phụ, khi nào cần mới gọi ra */}
      <Stack.Screen name="Login" component={LoginScreen} />

      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: true, title: 'Chi tiết' }}
      />
    </Stack.Navigator>
  )
}

export default AppNavigator
