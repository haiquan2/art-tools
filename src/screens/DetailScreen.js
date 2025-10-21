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
import { fetchArtToolById, countFeedbacks, averageRating, fetchArtTools } from '../services/api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/storage';
import { analyzeProductImage } from '../services/geminiAI';
import { COLORS } from '../constants/colors';

export default function DetailScreen({ route, navigation }) {
  const { itemId } = route.params;
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [sameBrandItems, setSameBrandItems] = useState([]);
  const [showHeader, setShowHeader] = useState(false);

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

  const handleFindSimilar = async () => {
    if (!item || !item.image) {
      Alert.alert('Error', 'No product image available for analysis');
      return;
    }

    navigation.navigate('SimilarProducts', {
      productImage: item.image,
      productId: item.id
    });
  };

  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowHeader(scrollY > 120);
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
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.fixedHeader}>
          <TouchableOpacity 
            style={styles.headerBackButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{item?.artName}</Text>
          <TouchableOpacity style={styles.headerFavoriteButton} onPress={toggleFavorite}>
            <Ionicons
              name={isFav ? 'heart' : 'heart-outline'}
              size={24}
              color={isFav ? COLORS.primary : '#333'}
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image || 'https://via.placeholder.com/400' }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Favorite Button */}
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFav ? 'heart' : 'heart-outline'}
            size={28}
            color={isFav ? COLORS.primary : '#000'}
          />
        </TouchableOpacity>

        {/* Find Similar Button */}
        <TouchableOpacity
          style={styles.findSimilarButtonOnImage}
          onPress={handleFindSimilar}
        >
          <Ionicons name="search" size={18} color="#000" />
          <Text style={styles.findSimilarButtonText}>Find similar</Text>
        </TouchableOpacity>
      </View>

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
              <Text style={styles.avgRatingText}>{avgRating.toFixed(1)}</Text>
            </View>
          </View>
        )}

        {/* User Feedback */}
        {item.feedbacks && Array.isArray(item.feedbacks) && item.feedbacks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews ({item.feedbacks.length})</Text>
            {item.feedbacks.map((feedback, index) => (
              <View key={index} style={styles.feedbackCard}>
                <View style={styles.feedbackHeader}>
                  <Text style={styles.feedbackAuthor}>{feedback.author}</Text>
                  <Text style={styles.feedbackDate}>
                    {new Date(feedback.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </Text>
                </View>
                <View style={styles.feedbackStars}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < feedback.rating ? 'star' : 'star-outline'}
                      size={13}
                      color={COLORS.primaryDark}
                    />
                  ))}
                </View>
                <Text style={styles.feedbackText}>{feedback.comment}</Text>
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
                  onPress={() => navigation.push('Detail', { itemId: product.id })}
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

      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 10,
  },
  headerFavoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
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
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findSimilarButtonOnImage: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 16,
    color: '#666',
  },
  feedbackCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feedbackAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  feedbackDate: {
    fontSize: 13,
    color: '#6c757d',
  },
  feedbackStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 13,
    lineHeight: 22,
    color: '#333',
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
  findSimilarButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});
