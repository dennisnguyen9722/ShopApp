// App.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AppNavigator from './src/navigation/AppNavigator'

// Tạo Client cho React Query (Quản lý cache, fetching...)
const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
