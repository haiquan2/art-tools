import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { analyzeProductImage, getVisualSimilarity } from '../services/geminiAI';
import { fetchArtTools } from '../services/api';
import { COLORS } from '../constants/colors';

export default function SimilarProductsScreen({ route, navigation }) {
  const { productImage, productId } = route.params;
  const [loading, setLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    loadSimilarProducts();
  }, []);

  const loadSimilarProducts = async () => {
    try {
      setLoading(true);
      
      // Load all products
      const products = await fetchArtTools();
      setAllProducts(products);
      
      // Try to analyze the product image
      try {
        const analysis = await analyzeProductImage(productImage, products);
        setAnalysisResult(analysis);
        
        // Get similar products based on AI analysis
        const similarIds = analysis.similarProducts?.map(p => p.id) || [];
        const similar = products.filter(product => 
          similarIds.includes(product.id) && product.id !== productId
        );
        
        setSimilarProducts(similar);
      } catch (aiError) {
        console.log('AI analysis failed, showing random products:', aiError.message);
        // Show random products if AI fails
        const randomProducts = products
          .filter(product => product.id !== productId)
          .slice(0, 6);
        setSimilarProducts(randomProducts);
        
        setAnalysisResult({
          productName: "Art Supply Product",
          brand: "Various Brands",
          category: "art-tool",
          confidence: 0.5,
          visualTags: ["art", "creative", "supplies"],
          error: null
        });
      }
      
    } catch (error) {
      console.error('Error loading similar products:', error);
      Alert.alert('Error', 'Failed to find similar products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderSimilarProduct = ({ item: product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('Detail', { itemId: product.id })}
    >
      <Image
        source={{ uri: product.image }}
        style={styles.productImage}
        resizeMode="cover"
      />
      {product.limitedTimeDeal > 0 && (
        <View style={styles.dealBadge}>
          <Text style={styles.dealText}>{Math.round(product.limitedTimeDeal * 100)}% OFF</Text>
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.artName}
        </Text>
        <Text style={styles.productBrand}>{product.brand}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>
            ${Math.round(product.price * (1 - product.limitedTimeDeal))}
          </Text>
          {product.limitedTimeDeal > 0 && (
            <Text style={styles.originalPrice}>${product.price}</Text>
          )}
        </View>
        {product.glassSurface && (
          <View style={styles.featureBadge}>
            <Ionicons name="shield-checkmark" size={12} color={COLORS.primary} />
            <Text style={styles.featureText}>Glass Safe</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderAnalysisInfo = () => {
    if (!analysisResult) return null;

    return (
      <View style={styles.analysisContainer}>
        <Text style={styles.analysisTitle}>AI Analysis</Text>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisValue}>{analysisResult.productName}</Text>
        </View>
        <View style={styles.analysisItem}>
          <Text style={styles.analysisLabel}>Brand:</Text>
          <Text style={styles.analysisValue}>{analysisResult.brand}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analyzing product image...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Similar Products</Text>
        <View style={styles.placeholder} />
      </View>

      {renderAnalysisInfo()}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          Found {similarProducts.length} similar products
        </Text>
      </View>

      <FlatList
        data={similarProducts}
        renderItem={renderSimilarProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color="#ddd" />
            <Text style={styles.emptyText}>No similar products found</Text>
            <Text style={styles.emptySubtext}>
              Try with a different product image
            </Text>
          </View>
        }
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  analysisContainer: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  analysisItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  analysisLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  analysisValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  tagsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  tagsLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  resultsHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  list: {
    padding: 10,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 5,
    elevation: 2,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  dealBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    minHeight: 36,
  },
  productBrand: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
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
});
