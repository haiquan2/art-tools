import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchArtToolById } from '../services/api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/storage';
import { COLORS } from '../constants/colors';

export default function DetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    loadItemDetail();
  }, [itemId]);

  const loadItemDetail = async () => {
    try {
      setLoading(true);
      const data = await fetchArtToolById(itemId);
      setItem(data);
      
      const favStatus = await isFavorite(itemId);
      setIsFav(favStatus);
    } catch (error) {
      console.error('Error loading item detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (isFav) {
      await removeFromFavorites(itemId);
      setIsFav(false);
    } else {
      await addToFavorites(item);
      setIsFav(true);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Product Image */}
      <Image
        source={{ uri: item.image || 'https://via.placeholder.com/400' }}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Favorite Button */}
      <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
        <Ionicons
          name={isFav ? 'heart' : 'heart-outline'}
          size={32}
          color={isFav ? COLORS.primary : '#fff'}
        />
      </TouchableOpacity>

      {/* Product Details */}
      <View style={styles.detailsContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{item.artName}</Text>
            <Text style={styles.brand}>{item.brand}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${item.price}</Text>
            {item.limitedTimeDeal > 0 && (
              <View style={styles.dealBadge}>
                <Text style={styles.dealText}>{Math.round(item.limitedTimeDeal * 100)}% OFF</Text>
              </View>
            )}
          </View>
        </View>

        {/* Glass Surface Badge */}
        {item.glassSurface && (
          <View style={styles.featureBadge}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.primary} />
            <Text style={styles.featureBadgeText}>Compatible with Glass Surfaces</Text>
          </View>
        )}

        {/* Rating */}
        {item.rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.ratingStars}>
              {[...Array(5)].map((_, index) => (
                <Ionicons
                  key={index}
                  name={index < Math.floor(item.rating) ? 'star' : 'star-outline'}
                  size={20}
                  color="#FFD700"
                />
              ))}
            </View>
            <Text style={styles.ratingText}>{item.rating} / 5.0</Text>
          </View>
        )}

        {/* Category */}
        {item.category && (
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryLabel}>Category:</Text>
            <Text style={styles.categoryValue}>{item.category}</Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {item.description || 'No description available for this product.'}
          </Text>
        </View>

        {/* Features */}
        {item.features && Array.isArray(item.features) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            {item.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        {/* User Feedback */}
        {item.feedbacks && Array.isArray(item.feedbacks) && item.feedbacks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Feedbacks ({item.feedbacks.length})</Text>
            {item.feedbacks.map((feedback, index) => (
              <View key={index} style={styles.feedbackContainer}>
                <View style={styles.feedbackHeader}>
                  <Text style={styles.feedbackAuthor}>{feedback.author}</Text>
                  <View style={styles.feedbackRating}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < feedback.rating ? 'star' : 'star-outline'}
                        size={14}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                </View>
                <Text style={styles.feedbackText}>{feedback.comment}</Text>
                <Text style={styles.feedbackDate}>
                  {new Date(feedback.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        {/* Single Feedback (fallback) */}
        {item.feedback && !item.feedbacks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Feedback</Text>
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>{item.feedback}</Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, isFav && styles.actionButtonActive]}
          onPress={toggleFavorite}
        >
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={24}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {isFav ? 'Remove from Favorites' : 'Add to Favorites'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 400,
    backgroundColor: '#f0f0f0',
  },
  favoriteButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  brand: {
    fontSize: 16,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dealBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 5,
  },
  dealText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  featureBadgeText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  ratingStars: {
    flexDirection: 'row',
    marginRight: 10,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 14,
    color: '#999',
    marginRight: 8,
  },
  categoryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  feedbackContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 10,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackAuthor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  feedbackRating: {
    flexDirection: 'row',
    gap: 2,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 8,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  actionButtonActive: {
    backgroundColor: '#999',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
});
