import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = '@favorites';

/**
 * Get all favorites from AsyncStorage
 * @returns {Promise<Array>} Array of favorite items
 */
export const getFavorites = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(FAVORITES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (error) {
    console.error('Error loading favorites:', error);
    return [];
  }
};

/**
 * Save favorites to AsyncStorage
 * @param {Array} favorites - Array of favorite items to save
 */
export const saveFavorites = async (favorites) => {
  try {
    const jsonValue = JSON.stringify(favorites);
    await AsyncStorage.setItem(FAVORITES_KEY, jsonValue);
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
};

/**
 * Add an item to favorites
 * @param {Object} item - Item to add to favorites
 * @returns {Promise<Array>} Updated favorites array
 */
export const addToFavorites = async (item) => {
  try {
    const favorites = await getFavorites();
    const isAlreadyFavorite = favorites.some(fav => fav.id === item.id);
    
    if (!isAlreadyFavorite) {
      const updatedFavorites = [...favorites, item];
      await saveFavorites(updatedFavorites);
      return updatedFavorites;
    }
    
    return favorites;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return [];
  }
};

/**
 * Remove an item from favorites
 * @param {string|number} itemId - ID of item to remove
 * @returns {Promise<Array>} Updated favorites array
 */
export const removeFromFavorites = async (itemId) => {
  try {
    const favorites = await getFavorites();
    const updatedFavorites = favorites.filter(fav => fav.id !== itemId);
    await saveFavorites(updatedFavorites);
    return updatedFavorites;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return [];
  }
};

/**
 * Check if an item is in favorites
 * @param {string|number} itemId - ID of item to check
 * @returns {Promise<boolean>} True if item is favorited
 */
export const isFavorite = async (itemId) => {
  try {
    const favorites = await getFavorites();
    return favorites.some(fav => fav.id === itemId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

/**
 * Clear all favorites
 * @returns {Promise<void>}
 */
export const clearAllFavorites = async () => {
  try {
    await AsyncStorage.removeItem(FAVORITES_KEY);
  } catch (error) {
    console.error('Error clearing favorites:', error);
  }
};

export default {
  getFavorites,
  saveFavorites,
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  clearAllFavorites
};
