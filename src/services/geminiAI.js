import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from '@env';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || 'your_api_key_here');

/**
 * Get AI suggestions for similar art tools based on favorites
 * @param {Array} favorites - Array of favorite art tools
 * @returns {Promise<string>} - AI generated suggestions
 */
export async function getAISuggestions(favorites) {
  try {
    if (!favorites || favorites.length === 0) {
      return "Add some favorites first to get AI recommendations!";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const favoriteNames = favorites.map(item => item.name || item.title).join(', ');
    
    const prompt = `Based on these art tools that a user likes: ${favoriteNames}.
    
    Please suggest 2 similar art tools that the user might be interested in. 
    For each suggestion, provide:
    1. Name of the art tool
    2. Brief description (1-2 sentences)
    3. Why it's similar to the user's favorites
    
    Format the response in a clear, easy-to-read manner with bullet points.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error getting AI suggestions:', error);
    return "Unable to get AI recommendations at this time. Please try again later.";
  }
}

/**
 * Get AI suggestions with detailed product information
 * @param {Array} favorites - Array of favorite art tools with full details
 * @returns {Promise<string>} - AI generated suggestions
 */
export async function getDetailedAISuggestions(favorites) {
  try {
    if (!favorites || favorites.length === 0) {
      return "Add some favorites first to get AI recommendations!";
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const favoritesInfo = favorites.map(item => ({
      name: item.artName,
      brand: item.brand,
      category: item.category,
      price: item.price
    }));
    
    const prompt = `Based on these art tools that a user has favorited:
${JSON.stringify(favoritesInfo, null, 2)}

Please analyze their preferences and suggest 2 new art tools they might like.
For each suggestion:
1. Product name
2. Category/Type
3. Estimated price range
4. Key features
5. Why it matches their taste

Keep each suggestion concise and practical.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error getting detailed AI suggestions:', error);
    return "Unable to get AI recommendations at this time. Please try again later.";
  }
}

/**
 * Analyze product image and find similar products
 * @param {string} imageUrl - URL of the image to analyze
 * @param {Array} products - Array of all products from database
 * @returns {Promise<Object>} - AI analysis result
 */
export async function analyzeProductImage(imageUrl, products) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const productList = products.map(p => ({
      id: p.id,
      name: p.artName,
      brand: p.brand,
      category: p.category || 'art-tool',
      price: p.price
    }));
    
    const prompt = `You are an AI expert in art supplies and tools. Analyze this image: ${imageUrl}

Available products in our database:
${JSON.stringify(productList, null, 2)}

Based on the image, find the 3 most similar products from our database. Consider:
- Visual appearance (colors, shape, materials)
- Product type and category
- Brand similarity
- Function and use case

Return ONLY a JSON object in this exact format:
{
  "productName": "Detected product name",
  "brand": "Detected brand", 
  "category": "Product category",
  "features": ["feature1", "feature2"],
  "similarProducts": [
    {"id": "1", "similarity": 0.9, "reason": "similar colors and materials"},
    {"id": "2", "similarity": 0.8, "reason": "same product type"},
    {"id": "3", "similarity": 0.7, "reason": "complementary art supply"}
  ],
  "visualTags": ["paint", "brush", "colorful"],
  "confidence": 0.85
}

IMPORTANT: Only return JSON, no other text.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI Response:', text);
    
    // Try to parse JSON response
    try {
      const parsed = JSON.parse(text);
      console.log('Parsed AI Response:', parsed);
      return parsed;
    } catch (parseError) {
      console.log('JSON Parse Error:', parseError);
      // If JSON parsing fails, return structured text
      return {
        productName: "Unknown Product",
        brand: "Unknown Brand",
        category: "art-tool",
        features: ["art supply"],
        similarProducts: [],
        visualTags: ["art", "creative"],
        confidence: 0.5,
        rawResponse: text
      };
    }
  } catch (error) {
    console.error('Error analyzing product image:', error);
    return {
      productName: "Analysis Failed",
      brand: "Unknown",
      category: "art-tool",
      features: [],
      similarProducts: [],
      visualTags: [],
      confidence: 0,
      error: error.message
    };
  }
}

/**
 * Get visual similarity recommendations
 * @param {string} imageUrl - URL of the reference image
 * @param {Array} products - Array of all products
 * @returns {Promise<Array>} - Array of similar products
 */
export async function getVisualSimilarity(imageUrl, products) {
  try {
    const analysis = await analyzeProductImage(imageUrl, products);
    return analysis.similarProducts || [];
  } catch (error) {
    console.error('Error getting visual similarity:', error);
    return [];
  }
}

/**
 * Enhanced AI suggestions with image analysis
 * @param {Array} favorites - User's favorite products
 * @param {string} imageUrl - Optional image for visual analysis
 * @returns {Promise<string>} - Enhanced AI suggestions
 */
export async function getEnhancedAISuggestions(favorites, imageUrl = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    let prompt = `Based on these art tools that a user likes: ${JSON.stringify(favorites.map(f => ({
      name: f.artName,
      brand: f.brand,
      category: f.category || 'art-tool'
    })))}
    
    Please suggest 3 new art tools they might like.
    For each suggestion:
    1. Product name and category
    2. Key features
    3. Why it matches their taste
    4. Estimated price range
    
    Keep suggestions practical and relevant.`;
    
    if (imageUrl) {
      prompt += `\n\nAlso consider this reference image: ${imageUrl}`;
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text;
  } catch (error) {
    console.error('Error getting enhanced AI suggestions:', error);
    return "Unable to get AI recommendations at this time. Please try again later.";
  }
}

export default {
  getAISuggestions,
  getDetailedAISuggestions,
  analyzeProductImage,
  getVisualSimilarity,
  getEnhancedAISuggestions
};
