import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

// Screens
import HomeScreen from '../screens/HomeScreen';
import DetailScreen from '../screens/DetailScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ShopScreen from '../screens/ShopScreen';
import SearchResultScreen from '../screens/SearchResultScreen';
import CameraScreen from '../screens/CameraScreen';
import MapsScreen from '../screens/MapsScreen';
import SimilarProductsScreen from '../screens/SimilarProductsScreen';
import { SafeAreaView } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
function HomeStack() {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Stack.Navigator>
        <Stack.Screen 
          name="HomeList" 
          component={HomeScreen}
          options={{ title: 'Art Tools', headerShown: false }}
        />
        <Stack.Screen 
          name="Detail" 
          component={DetailScreen}
          options={{ title: 'Product Detail', headerShown: false }}
        />
        <Stack.Screen 
          name="SimilarProducts" 
          component={SimilarProductsScreen}
          options={{ title: 'Similar Products', headerShown: false }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

// Shop Stack Navigator
function ShopStack() {
  return (
    <SafeAreaView style={{ flex: 1 } } edges={['top']}>
      <Stack.Navigator>
        <Stack.Screen 
          name="ShopList" 
          component={ShopScreen}
          options={{ title: 'Shop', headerShown: false }}
        />
        <Stack.Screen 
          name="SearchResult" 
          component={SearchResultScreen}
          options={{ title: 'Search Results', headerShown: false }}
        />
        <Stack.Screen 
          name="Detail" 
          component={DetailScreen}
          options={{ title: 'Product Detail', headerShown: false }}
        />
        <Stack.Screen 
          name="SimilarProducts" 
          component={SimilarProductsScreen}
          options={{ title: 'Similar Products', headerShown: false }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

// Main Tab Navigator
export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Shop') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera-outline';
          } else if (route.name === 'Maps') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Shop" 
        component={ShopStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{ title: 'Product Recognition' }}
      />
      <Tab.Screen 
        name="Maps" 
        component={MapsScreen}
        options={{ title: 'Find Stores' }}
      />
      <Tab.Screen 
        name="Favorites" 
        component={FavoritesScreen}
        options={{ title: 'My Favorites' }}
      />
    </Tab.Navigator>
  );
}
