import * as Location from 'expo-location';

/**
 * Request location permissions
 */
export const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }
    return true;
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    throw error;
  }
};

/**
 * Get current user location
 */
export const getCurrentLocation = async () => {
  try {
    await requestLocationPermissions();
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

/**
 * Find nearby stores
 */
export const findNearbyStores = (stores, userLat, userLon, radiusKm = 10) => {
  return stores.filter(store => {
    if (!store.location || !store.location.lat || !store.location.lng) {
      return false;
    }
    
    const distance = calculateDistance(
      userLat, userLon,
      store.location.lat, store.location.lng
    );
    
    return distance <= radiusKm;
  }).map(store => ({
    ...store,
    distance: calculateDistance(
      userLat, userLon,
      store.location.lat, store.location.lng
    )
  })).sort((a, b) => a.distance - b.distance);
};

/**
 * Get stores with specific product availability
 */
export const getStoresWithProduct = (stores, productId) => {
  return stores.filter(store => 
    store.products && store.products.includes(productId)
  );
};

/**
 * Format store information for display
 */
export const formatStoreInfo = (store) => {
  return {
    id: store.id,
    name: store.name,
    address: store.address,
    phone: store.phone,
    distance: store.distance ? `${store.distance.toFixed(1)} km` : 'Unknown',
    location: store.location,
    products: store.products || []
  };
};
