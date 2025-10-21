import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Markdown from 'react-native-markdown-display';
import { getFavorites, removeFromFavorites, clearAllFavorites } from '../utils/storage';
import { getEnhancedAISuggestions } from '../services/geminiAI';
import { COLORS } from '../constants/colors';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleRemoveFavorite = (itemId) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this item from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeFromFavorites(itemId);
            await loadFavorites();
            setShowAI(false); 
            setAiSuggestions('');
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Favorites',
      'Are you sure you want to remove all favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllFavorites();
            await loadFavorites();
            setShowAI(false);
            setAiSuggestions('');
          },
        },
      ]
    );
  };

  const handleGetAISuggestions = async () => {
    if (favorites.length === 0) {
      Alert.alert('No Favorites', 'Please add some favorites first to get AI recommendations!');
      return;
    }

    setLoadingAI(true);
    setShowAI(true);
    
    try {
      const suggestions = await getEnhancedAISuggestions(favorites);
      setAiSuggestions(suggestions);
    } catch (error) {
      setAiSuggestions('Unable to get AI recommendations. Please try again later.');
    } finally {
      setLoadingAI(false);
    }
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('Home', {
        screen: 'Detail',
        params: { itemId: item.id }
      })}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/100' }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRemoveFavorite(item.id);
          }}
        >
          <Ionicons name="heart" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        {item.limitedTimeDeal > 0 && (
          <View style={styles.dealBadge}>
            <Text style={styles.dealText}>{Math.round(item.limitedTimeDeal * 100)}% OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.title} numberOfLines={1}>{item.artName}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>${item.price}</Text>
          {item.limitedTimeDeal > 0 && (
            <Text style={styles.originalPrice}>${Math.round(item.price * (1 - item.limitedTimeDeal))}</Text>
          )}
        </View>
        {item.glassSurface && (
          <View style={styles.featureBadge}>
            <Ionicons name="shield-checkmark" size={10} color={COLORS.primary} />
            <Text style={styles.featureText}>Glass</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAISuggestions = () => {
    if (!showAI) return null;

    return (
      <View style={styles.aiContainer}>
        <View style={styles.aiHeader}>
          <Ionicons name="sparkles" size={24} color={COLORS.primary} />
          <Text style={styles.aiTitle}>AI Recommendations</Text>
        </View>
        
        {loadingAI ? (
          <View style={styles.aiLoadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.aiLoadingText}>Getting personalized recommendations...</Text>
          </View>
        ) : (
          <View style={styles.aiContentContainer}>
            <Markdown style={markdownStyles}>{aiSuggestions}</Markdown>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {favorites.length > 0 && (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={handleGetAISuggestions}
            disabled={loadingAI}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.aiButtonText}>Get AI Suggestions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.gridContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/no_favorite.png')}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptyText}>
              Start adding art tools to your favorites!
            </Text>
          </View>
        }
        ListHeaderComponent={renderAISuggestions}
      />
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
  headerButtons: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  aiButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 15,
  },
  row: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  itemInfo: {
    padding: 12,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  brand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  dealBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dealText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  featureText: {
    color: COLORS.textLight,
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyImage: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
  },
  aiContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  aiTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  aiLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  aiLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  aiContentContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  aiContent: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
});

const markdownStyles = {
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  heading1: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 6,
    marginBottom: 6,
  },
  bullet_list: {
    marginTop: 5,
    marginBottom: 5,
  },
  ordered_list: {
    marginTop: 5,
    marginBottom: 5,
  },
  list_item: {
    marginBottom: 5,
    flexDirection: 'row',
  },
  bullet_list_icon: {
    color: COLORS.primary,
    fontSize: 16,
    marginRight: 10,
    marginLeft: 10,
  },
  ordered_list_icon: {
    color: COLORS.primary,
    fontSize: 14,
    marginRight: 10,
    marginLeft: 10,
  },
  paragraph: {
    marginTop: 5,
    marginBottom: 5,
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  strong: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  em: {
    fontStyle: 'italic',
  },
  code_inline: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 6,
    fontFamily: 'monospace',
    fontSize: 14,
    marginVertical: 10,
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#f9f9f9',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: 15,
    paddingVertical: 10,
    marginVertical: 10,
  },
  hr: {
    backgroundColor: '#e0e0e0',
    height: 1,
    marginVertical: 15,
  },
};
