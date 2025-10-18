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
import { fetchArtToolById, countFeedbacks, averageRating } from '../services/api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/storage';
import { COLORS } from '../constants/colors';

export default function DetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [sameBrandItems, setSameBrandItems] = useState([]);

  useEffect(() => {
    loadItemDetail();
  }, [itemId]);

  useEffect(() => {
    if (item) {
      loadRatingInfo();
      loadSameBrandItems();
    }
  }, [item]);

  const loadRatingInfo = async () => {
    try {
      const count = await countFeedbacks(itemId);
      const rating = await averageRating(itemId);
      setFeedbackCount(count);
      setAvgRating(rating);
    } catch (error) {
      // console.error('Error loading rating info:', error);
    }
  };

  const loadSameBrandItems = async () => {
    try {
      const { fetchArtTools } = require('../services/api');
      const allTools = await fetchArtTools();
      const brandItems = allTools
        .filter(tool => tool.brand === item.brand && tool.id !== item.id)
        .slice(0, 4);
      setSameBrandItems(brandItems);
    } catch (error) {
      console.error('Error loading same brand items:', error);
    }
  };

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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.price}>${Math.round(item.price * (1 - item.limitedTimeDeal))}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text style={styles.originalPrice}>${item.price} </Text>
                <Text style={styles.dealPrice}>({Math.round(item.limitedTimeDeal * 100)}% off)</Text>
              </View>
            </View>
            <Text style={styles.brand}>
              From{' '}
              <Text
                style={{ textDecorationLine: 'underline', color: COLORS.primary }}
                onPress={() => navigation.navigate('SearchResult', { brand: item.brand })}
              >
                {item.brand}
              </Text>
            </Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.description}>
            {item.description || 'No description available for this product.'}
          </Text>
        </View>

        {/* Glass Surface Badge */}
        {item.glassSurface && (
          <View style={styles.featureBadge}>
            <Ionicons name="shield-checkmark" size={18} color={COLORS.textLight} />
            <Text style={styles.featureBadgeText}>Compatible with Glass Surfaces</Text>
          </View>
        )}

        {/* Rating Section */}
        {feedbackCount >= 0 && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingsTitle}>Ratings ({feedbackCount})</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text style={styles.avgRatingText}>{avgRating.toFixed(1)} average stars</Text>
            </View>
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

        {/* Same Brand Items */}
        {sameBrandItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sameBrandHeader}>
              <Text style={styles.sectionTitle}>More from {item?.brand}</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('SearchResult', { brand: item?.brand })}
              >
                <Text style={styles.seeMoreText}>See More →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sameBrandGrid}>
              {sameBrandItems.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.sameBrandCard}
                  onPress={() => navigation.push('DetailScreen', { itemId: product.id })}
                >
                  <Image source={{ uri: product.image }} style={styles.sameBrandImage} />
                  {product.limitedTimeDeal > 0 && (
                    <View style={styles.sameBrandBadge}>
                      <Text style={styles.sameBrandBadgeText}>-{product.limitedTimeDeal}%</Text>
                    </View>
                  )}
                  <Text style={styles.sameBrandName} numberOfLines={2}>{product.artName}</Text>
                  <View style={styles.sameBrandPriceRow}>
                    {product.limitedTimeDeal > 0 ? (
                      <>
                        <Text style={styles.sameBrandPrice}>
                          ${(product.price * (1 - product.limitedTimeDeal / 100)).toFixed(2)}
                        </Text>
                        <Text style={styles.sameBrandOriginalPrice}>${product.price}</Text>
                      </>
                    ) : (
                      <Text style={styles.sameBrandPrice}>${product.price}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
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
    height: 320,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999',
    textDecorationLine: 'line-through',
    marginTop: 0,
  },
  dealPrice: {
    fontSize: 16,
    color: '#999',
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
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  ratingSection: {
    marginBottom: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  ratingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avgRatingText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
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
  sameBrandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sameBrandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sameBrandCard: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sameBrandImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  sameBrandBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  sameBrandBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sameBrandName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    padding: 10,
    paddingBottom: 5,
    minHeight: 42,
  },
  sameBrandPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    gap: 6,
  },
  sameBrandPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sameBrandOriginalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
});
