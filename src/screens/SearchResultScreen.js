import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchArtTools } from '../services/api';
import { addToFavorites, removeFromFavorites, isFavorite } from '../utils/storage';
import { COLORS } from '../constants/colors';
import { formatData } from '../utils/helper';

export default function SearchResultScreen({ route, navigation }) {
  const { brand: initialBrand } = route.params || {};
  
  const [artTools, setArtTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState({});
  
  // Filter states
  const [selectedBrand, setSelectedBrand] = useState(initialBrand || 'All');
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Sort state
  const [sortBy, setSortBy] = useState('default'); // default, price-asc, price-desc, reviews
  const [showSortModal, setShowSortModal] = useState(false);

  useEffect(() => {
    loadArtTools();
  }, []);

  useEffect(() => {
    if (initialBrand) {
      setSelectedBrand(initialBrand);
    }
  }, [initialBrand]);

  useEffect(() => {
    filterAndSortTools();
  }, [searchQuery, selectedBrand, showOnSaleOnly, priceRange, sortBy, artTools]);

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

  const filterAndSortTools = () => {
    let filtered = [...artTools];

    // Filter by brand
    if (selectedBrand !== 'All') {
      filtered = filtered.filter(item => item.brand === selectedBrand);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.artName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by on sale
    if (showOnSaleOnly) {
      filtered = filtered.filter(item => item.limitedTimeDeal > 0);
    }

    // Filter by price range
    filtered = filtered.filter(item => 
      item.price >= priceRange.min && item.price <= priceRange.max
    );

    // Sort
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'reviews':
        // Sort by number of feedbacks (if available)
        filtered.sort((a, b) => {
          const aReviews = a.feedbacks?.length || 0;
          const bReviews = b.feedbacks?.length || 0;
          return bReviews - aReviews;
        });
        break;
      default:
        // Keep original order
        break;
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

  const resetFilters = () => {
    setSelectedBrand('All');
    setShowOnSaleOnly(false);
    setPriceRange({ min: 0, max: 1000 });
    setShowFilterModal(false);
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior='padding'
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Brand Filter */}
            <Text style={styles.filterLabel}>Brand</Text>
            <View style={styles.brandFilters}>
              {getBrands().map(brand => (
                <TouchableOpacity
                  key={brand}
                  style={[
                    styles.brandFilterChip,
                    selectedBrand === brand && styles.brandFilterChipActive
                  ]}
                  onPress={() => setSelectedBrand(brand)}
                >
                  <Text
                    style={[
                      styles.brandFilterText,
                      selectedBrand === brand && styles.brandFilterTextActive
                    ]}
                  >
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range */}
            <Text style={styles.filterLabel}>Price Range: ${priceRange.min} - ${priceRange.max}</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                keyboardType="numeric"
                value={priceRange.min.toString()}
                onChangeText={(text) => setPriceRange({...priceRange, min: parseInt(text) || 0})}
              />
              <Text style={styles.priceSeparator}>-</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                keyboardType="numeric"
                value={priceRange.max.toString()}
                onChangeText={(text) => setPriceRange({...priceRange, max: parseInt(text) || 1000})}
              />
            </View>

            {/* On Sale Toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setShowOnSaleOnly(!showOnSaleOnly)}
            >
              <Text style={styles.toggleText}>Show On Sale Items Only</Text>
              <Ionicons
                name={showOnSaleOnly ? 'checkbox' : 'square-outline'}
                size={24}
                color={showOnSaleOnly ? COLORS.primary : '#999'}
              />
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  const renderSortModal = () => (
    <Modal
      visible={showSortModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowSortModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sortModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortModal(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {[
            { value: 'default', label: 'Default' },
            { value: 'price-asc', label: 'Price: Low to High' },
            { value: 'price-desc', label: 'Price: High to Low' },
            { value: 'reviews', label: 'Most Reviews' },
          ].map(option => (
            <TouchableOpacity
              key={option.value}
              style={styles.sortOption}
              onPress={() => {
                setSortBy(option.value);
                setShowSortModal(false);
              }}
            >
              <Text style={styles.sortOptionText}>{option.label}</Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

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
        {item.limitedTimeDeal > 0 && (
          <View style={styles.dealBadgeCard}>
            <Text style={styles.dealText}>{Math.round(item.limitedTimeDeal * 100)}% OFF</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.title} numberOfLines={1}>{item.artName}</Text>
              <Text style={styles.brand}>{item.brand}</Text>
            </View>
            <TouchableOpacity
              onPress={() => toggleFavorite(item)}
              style={styles.favoriteButton}
            >
              <Ionicons
                name={favorites[item.id] ? 'heart' : 'heart-outline'}
                size={24}
                color={favorites[item.id] ? COLORS.primary : COLORS.gray}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.price}>${item.price}</Text>
          {item.feedbacks && item.feedbacks.length > 0 && (
            <Text style={styles.reviews}>
              {item.feedbacks.length} {item.feedbacks.length === 1 ? 'review' : 'reviews'}
            </Text>
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
      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={24} color={COLORS.primary} />
          {showOnSaleOnly && <View style={styles.filterDot} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => setShowSortModal(true)}
        >
          <Ionicons name="swap-vertical" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>
          {filteredTools.length} {filteredTools.length === 1 ? 'result' : 'results'}
        </Text>
        {selectedBrand !== 'All' && (
          <TouchableOpacity onPress={() => setSelectedBrand('All')}>
            <Text style={styles.clearFilter}>Clear brand filter ×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Products Grid */}
      <FlatList
        data={formatData(filteredTools, 2)}
        renderItem={renderItem}
        keyExtractor={(item) => item.id?.toString() || item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No products found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        }
      />

      {renderFilterModal()}
      {renderSortModal()}
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
    padding: 15,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    position: 'relative',
  },
  filterDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B6B',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  clearFilter: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardInvisible: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  image: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  dealBadgeCard: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  dealText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardInfo: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: '#666',
  },
  favoriteButton: {
    padding: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  reviews: {
    fontSize: 12,
    color: '#999',
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  sortModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  brandFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  brandFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  brandFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  brandFilterText: {
    color: '#666',
    fontSize: 14,
  },
  brandFilterTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  priceInput: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  priceSeparator: {
    fontSize: 18,
    color: '#666',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  toggleText: {
    fontSize: 16,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  resetButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
  },
  resetButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
});
