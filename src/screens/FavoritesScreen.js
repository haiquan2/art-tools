import React, { useState, useEffect, useCallback } from 'react';
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
import { getDetailedAISuggestions, getEnhancedAISuggestions } from '../services/geminiAI';
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
            setShowAI(false); // Reset AI suggestions when favorites change
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
      console.error('Error getting AI suggestions:', error);
      setAiSuggestions('Unable to get AI recommendations. Please try again later.');
    } finally {
      setLoadingAI(false);
    }
  };

  const renderFavoriteItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => navigation.navigate('Home', {
          screen: 'Detail',
          params: { itemId: item.id }
        })}
      >
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/100' }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.artName}</Text>
          <Text style={styles.brand}>{item.brand}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${item.price}</Text>
            {item.limitedTimeDeal > 0 && (
              <View style={styles.dealBadge}>
                <Text style={styles.dealText}>{Math.round(item.limitedTimeDeal * 100)}% OFF</Text>
              </View>
            )}
          </View>
          {item.glassSurface && (
            <View style={styles.featureBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
              <Text style={styles.featureText}>Glass Safe</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
      >
        <Ionicons name="trash-outline" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
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
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={80} color="#ddd" />
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
    backgroundColor: '#999',
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
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  info: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  brand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dealBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  dealText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  featureText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 20,
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
