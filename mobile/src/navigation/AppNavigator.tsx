// src/navigation/AppNavigator.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'

// Import màn hình
import HomeScreen from '../screens/HomeScreen'
import CartScreen from '../screens/CartScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import { RootStackParamList } from '../types'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<RootStackParamList>()

// 1. Tạo Tab Bar (Home + Cart)
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
    </Tab.Navigator>
  )
}

// 2. Tạo Stack chính (Chứa Tab Bar + Các trang chi tiết)
const AppNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Màn hình chính là Tab Bar */}
      <Stack.Screen name="Main" component={BottomTabs} />

      {/* Màn hình chi tiết nằm đè lên Tab Bar */}
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ headerShown: true, title: 'Chi tiết sản phẩm' }}
      />
    </Stack.Navigator>
  )
}

export default AppNavigator
