import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentLocation, findNearbyStores, calculateDistance } from '../services/mapsService';
import { fetchArtTools } from '../services/api';
import { COLORS } from '../constants/colors';

export default function MapsScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const products = await fetchArtTools();
      setAllProducts(products);
      
      // Try to get user location first
      let currentLocation = null;
      try {
        currentLocation = await getCurrentLocation();
        setUserLocation(currentLocation);
      } catch (locationError) {
        // Use default center (Lê Văn Việt, Thủ Đức, HCM)
        currentLocation = {
          latitude: 10.8444,
          longitude: 106.7639
        };
        setUserLocation(currentLocation);
      }
      
      // Try to get stores from art-tools data first, fallback to mock data
      let stores = [];
      try {
        // Check if products have store information
        const storesFromProducts = products
          .filter(product => product.stores && product.stores.length > 0)
          .flatMap(product => product.stores)
          .filter((store, index, self) => 
            index === self.findIndex(s => s.id === store.id)
          )
          .filter(store => store.location && store.location.lat && store.location.lng); // Only stores with valid location
        
        if (storesFromProducts.length > 0) {
          stores = storesFromProducts;
        } else {
          stores = getMockStores();
        }
      } catch (error) {
        stores = getMockStores();
      }
      
      // Calculate distances if we have user location
      const storesWithDistance = stores.map(store => ({
        ...store,
        distance: (currentLocation && store.location && store.location.lat && store.location.lng) 
          ? calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              store.location.lat,
              store.location.lng
            ) 
          : null
      }));
      
      setNearbyStores(storesWithDistance);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMockStores = () => {
    return [
      {
        id: 'store1',
        name: 'Art Supply Central',
        address: '78. Đ Quoc Lo 13 cu, Hiep Binh Phuoc, Thu Duc, Ho Chi Minh',
        phone: '+84-28-1234-5678',
        location: { lat: 10.8444, lng: 106.7639 }, 
        products: ['1', '2', '4', '7'],
        rating: 4.5
      },
      {
        id: 'store2',
        name: 'Creative Arts Store',
        address: '123 Nguyễn Văn Linh, Hải Châu, Đà Nẵng',
        phone: '+84-236-123-456',
        location: { lat: 16.0544, lng: 108.2022 },
        products: ['1', '3', '5', '8'],
        rating: 4.2
      },
      {
        id: 'store3',
        name: 'Artists Paradise',
        address: '456 Lê Duẩn, Hai Bà Trưng, Hà Nội',
        phone: '+84-24-1234-5678',
        location: { lat: 21.0285, lng: 105.8542 },
        products: ['2', '6', '9', '10'],
        rating: 4.8
      },
      {
        id: 'store4',
        name: 'Hue Art Supplies',
        address: '789 Lê Lợi, Phú Hội, Huế',
        phone: '+84-234-123-456',
        location: { lat: 16.4637, lng: 107.5909 },
        products: ['3', '4', '5'],
        rating: 4.3
      }
    ];
  };

  const renderStoreItem = ({ item: store }) => {
    
    return (
      <TouchableOpacity
        style={styles.storeCard}
        onPress={() => {
          Alert.alert(
            store.name,
            `${store.address}\n${store.phone}`,
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={styles.storeHeader}>
          <View style={styles.storeInfo}>
            <Text style={styles.storeName}>{store.name}</Text>
            <Text style={styles.storeAddress}>{store.address}</Text>
            <Text style={styles.storePhone}>{store.phone}</Text>
          </View>
          <View style={styles.storeStats}>
            <Text style={styles.distance}>
              {store.distance !== null && store.distance !== undefined 
                ? `${Number(store.distance).toFixed(1)} km` 
                : 'Distance unknown'}
            </Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{store.rating}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding nearby stores...</Text>
      </View>
    );
  }

  const renderMapView = () => {
    if (!showMap) return null;

    const initialRegion = userLocation ? {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    } : {
      latitude: 10.8444, 
      longitude: 106.7639,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };


    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
          onMapReady={() => {}}
          onError={(error) => {}}
        >
          {nearbyStores
            .filter(store => store.location && store.location.lat && store.location.lng)
            .map((store) => {
            return (
              <Marker
                key={store.id}
                coordinate={{
                  latitude: store.location.lat,
                  longitude: store.location.lng,
                }}
                title={store.name}
                description={store.address}
                onPress={() => {
                  setSelectedStore(store);
                }}
              >
                <View style={styles.markerContainer}>
                  <Ionicons name="storefront" size={24} color="#fff" />
                </View>
              </Marker>
            );
          })}
        </MapView>
        
        {selectedStore && (
          <View style={styles.selectedStoreInfo}>
            <Text style={styles.selectedStoreName}>{selectedStore.name}</Text>
            <Text style={styles.selectedStoreAddress}>{selectedStore.address}</Text>
            <Text style={styles.selectedStorePhone}>{selectedStore.phone}</Text>
            <TouchableOpacity
              style={styles.closeStoreInfo}
              onPress={() => setSelectedStore(null)}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Art Supply Stores</Text>
        <Text style={styles.subtitle}>
          {nearbyStores.length} stores available
        </Text>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowMap(!showMap)}
        >
          <Ionicons 
            name={showMap ? "list" : "map"} 
            size={20} 
            color="#fff" 
          />
          <Text style={styles.toggleButtonText}>
            {showMap ? "List View" : "Map View"}
          </Text>
        </TouchableOpacity>
      </View>

      {showMap ? (
        <View style={styles.mapContainer}>
          {nearbyStores.length > 0 ? (
            renderMapView()
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={64} color="#ddd" />
              <Text style={styles.mapFallbackText}>Map Loading...</Text>
              <Text style={styles.mapFallbackSubtext}>
                {nearbyStores.length} stores will be shown on map
              </Text>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={nearbyStores}
          renderItem={renderStoreItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="storefront-outline" size={64} color="#ddd" />
              <Text style={styles.emptyText}>No stores available</Text>
              <Text style={styles.emptySubtext}>Check back later for new stores</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  list: {
    padding: 15,
  },
  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 15,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  storeAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  storePhone: {
    fontSize: 14,
    color: '#666',
  },
  storeStats: {
    alignItems: 'flex-end',
  },
  distance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#666',
    marginLeft: 3,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
  // Map Styles
  toggleButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedStoreInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectedStoreName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  selectedStoreAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  selectedStorePhone: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  closeStoreInfo: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapFallbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  mapFallbackSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },
});
