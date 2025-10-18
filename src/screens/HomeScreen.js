import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchArtTools } from '../services/api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/storage';
import { COLORS } from '../constants/colors';
import { useScrollToTop } from '@react-navigation/native';

export default function HomeScreen({ navigation }) {
  const [artTools, setArtTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [favorites, setFavorites] = useState({});

  const ref = useRef(null);
  useScrollToTop(ref);

  useEffect(() => {
    loadArtTools();
  }, []);

  useEffect(() => {
    filterTools();
  }, [searchQuery, selectedBrand, artTools]);

  const loadArtTools = async () => {
    try {
      setLoading(true);
      
      const data = await fetchArtTools();
      setArtTools(data);
      
      const favStatus = {};
      for (const item of data) {
        favStatus[item.id] = await isFavorite(item.id);
      }
      setFavorites(favStatus);
    } catch (error) {
      console.error('Error loading art tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArtTools();
    setRefreshing(false);
  };

  const filterTools = () => {
    let filtered = artTools;

    if (selectedBrand !== 'All') {
      filtered = filtered.filter(item => item.brand === selectedBrand);
    }

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.artName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTools(filtered);
  };

  const toggleFavorite = async (item) => {
    const isFav = favorites[item.id];
    
    if (isFav) {
      await removeFromFavorites(item.id);
    } else {
      await addToFavorites(item);
    }
    
    setFavorites(prev => ({
      ...prev,
      [item.id]: !isFav
    }));
  };

  const getBrands = () => {
    const brands = ['All', ...new Set(artTools.map(item => item.brand).filter(Boolean))];
    return brands;
  };

  const renderItem = ({ item }) => {
    if (item.empty) {
      return <View style={[styles.card, styles.cardInvisible]} />;
    }
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Detail', { itemId: item.id })}
      >
        <Image
          source={{ uri: item.image || 'https://placehold.co/400' }}
          style={styles.image}
          resizeMode="cover"
        />
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(item);
          }}
          style={styles.favoriteButton}
        >
          <Ionicons
            name={favorites[item.id] ? 'heart' : 'heart-outline'}
            size={24}
            color={favorites[item.id] ? COLORS.primary : '#fff'}
          />
        </TouchableOpacity>
        {item.limitedTimeDeal > 0 && (
          <View style={styles.dealBadge}>
            <Text style={styles.dealText}>{Math.round(item.limitedTimeDeal * 100)}% OFF</Text>
          </View>
        )}
        
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={2}>{item.artName}</Text>
          <Text style={styles.brand}>{item.brand}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>${Math.round(item.price * (1 - item.limitedTimeDeal))}</Text>
            {item.limitedTimeDeal > 0 && (
              <Text style={styles.originalPrice}>${Math.round(item.price)}</Text>
            )}
          </View>
          {item.glassSurface && (
            <View style={styles.featureBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.textLight} />
              <Text style={styles.featureText}>Glass</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search art tools..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={getBrands()}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedBrand === item && styles.filterButtonActive
              ]}
              onPress={() => setSelectedBrand(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedBrand === item && styles.filterTextActive
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <ScrollView
        ref={ref}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredTools.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No art tools found</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            <View style={styles.column}>
              {filteredTools.filter((_, index) => index % 2 === 0).map((item) => renderItem({ item }))}
            </View>
            <View style={styles.column}>
              {filteredTools.filter((_, index) => index % 2 === 1).map((item) => renderItem({ item }))}
            </View>
          </View>
        )}
      </ScrollView>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: '#666',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 10,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  brand: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 0,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  originalPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  dealBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    position: 'absolute',
    top: -10,
    left: -3,
  },
  dealText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 10,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  featureText: {
    color: COLORS.textLight,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 5,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});
