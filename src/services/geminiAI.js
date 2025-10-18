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
    
    Please suggest 3 similar art tools that the user might be interested in. 
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

Please analyze their preferences and suggest 3 new art tools they might like.
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

export default {
  getAISuggestions,
  getDetailedAISuggestions
};
