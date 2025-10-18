import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { fetchArtTools } from '../services/api';
import { COLORS } from '../constants/colors';
import { useScrollToTop } from '@react-navigation/native';

const BRAND_IMAGES = {
  'Arteza': require('../../assets/logo.png'),
  'Color Splash': require('../../assets/logo.png'),
  'Edding': require('../../assets/logo.png'),
  'KingArt': require('../../assets/logo.png'),
};

export default function ShopScreen({ navigation }) {
  const [artTools, setArtTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);

  const scrollRef = useRef();
  useScrollToTop(scrollRef);

  useEffect(() => {
    loadArtTools();
  }, []);

  const loadArtTools = async () => {
    try {
      setLoading(true);
      const data = await fetchArtTools();
      setArtTools(data);
      
      const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];
      setBrands(uniqueBrands);
    } catch (error) {
      console.error('Error loading art tools:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemsByBrand = (brand, limit = 4) => {
    return artTools.filter(item => item.brand === brand).slice(0, limit);
  };

  const renderBrandCard = ({ item: brand }) => (
    <TouchableOpacity
      style={styles.brandCard}
      onPress={() => navigation.navigate('SearchResult', { brand })}
    >
      <Image
        source={BRAND_IMAGES[brand] || require('../../assets/logo.png')}
        style={styles.brandImage}
        resizeMode="contain"
      />
      <Text style={styles.brandName}>{brand}</Text>
    </TouchableOpacity>
  );

  const renderProductItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('Detail', { itemId: item.id })}
    >
      <Image
        source={{ uri: item.image || 'https://placehold.co/200' }}
        style={styles.productImage}
        resizeMode="cover"
      />
      {item.limitedTimeDeal > 0 && (
        <View style={styles.dealBadge}>
          <Text style={styles.dealText}>{Math.round(item.limitedTimeDeal * 100)}% OFF</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.artName}</Text>
        <Text style={styles.productPrice}>${item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderBrandSection = (brand) => {
    const items = getItemsByBrand(brand);
    if (items.length === 0) return null;

    return (
      <View key={brand} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{brand}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('SearchResult', { brand })}
          >
            <Text style={styles.exploreMore}>Explore More →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productsRow}
        >
          {items.map(item => renderProductItem(item))}
        </ScrollView>
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
    <ScrollView
      ref={scrollRef}
      style={styles.container} 
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop by Brand</Text>
        <Text style={styles.headerSubtitle}>Discover your favorite art tool brands</Text>
      </View>

      {/* Brand List */}
      <FlatList
        horizontal
        data={brands}
        renderItem={renderBrandCard}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.brandList}
      />

      {/* Brand Sections */}
      <View style={styles.sectionsContainer}>
        {brands.map(brand => renderBrandSection(brand))}
      </View>
    </ScrollView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  brandList: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  brandCard: {
    width: 100,
    alignItems: 'center',
    marginRight: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  brandImage: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  brandName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  sectionsContainer: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  exploreMore: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  productsRow: {
    paddingHorizontal: 15,
  },
  productCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f0f0f0',
  },
  dealBadge: {
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
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    height: 40,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});
