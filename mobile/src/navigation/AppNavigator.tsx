// src/navigation/AppNavigator.tsx
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import { View, StyleSheet, Platform } from 'react-native'

// Import màn hình
import HomeScreen from '../screens/HomeScreen'
import CartScreen from '../screens/CartScreen'
import ProductDetailScreen from '../screens/ProductDetailScreen'
import LoginScreen from '../screens/LoginScreen'
import ProfileScreen from '../screens/ProfileScreen'
import CheckoutScreen from '../screens/CheckoutScreen'

import { RootStackParamList } from '../types'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator<RootStackParamList>()

// MODERN COLORS
const COLORS = {
  primary: '#6366F1',
  background: '#FFFFFF',
  inactive: '#9CA3AF',
  text: '#1F2937'
}

// ==================== CUSTOM TAB BAR ====================
const BottomTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          backgroundColor: COLORS.background,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home'

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'cart' : 'cart-outline'
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline'
          }

          // Custom icon wrapper with background
          return (
            <View
              style={[styles.iconWrapper, focused && styles.iconWrapperActive]}
            >
              <Ionicons name={iconName} size={24} color={color} />
            </View>
          )
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
        options={{
          title: 'Giỏ hàng'
          // Có thể thêm badge sau này
          // tabBarBadge: 3
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ title: 'Tài khoản' }}
      />
    </Tab.Navigator>
  )
}

// ==================== MAIN STACK ====================
const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{
          headerShown: true,
          title: 'Chi tiết sản phẩm',
          headerStyle: {
            backgroundColor: COLORS.primary
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600'
          }
        }}
      />
      <Stack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{
          headerShown: true,
          title: 'Thanh toán',
          headerStyle: {
            backgroundColor: COLORS.primary
          },
          headerTintColor: '#FFF',
          headerTitleStyle: {
            fontWeight: '600'
          }
        }}
      />
    </Stack.Navigator>
  )
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  iconWrapper: {
    width: 50,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16
  },
  iconWrapperActive: {
    backgroundColor: '#EEF2FF' // Light purple background khi active
  }
})

export default AppNavigator
