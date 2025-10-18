# ArtTool Favorite List App

React Native application with AI-powered recommendations for art tools.

## 📋 Features

- **FR-01**: View art tools list from mockapi.io
- **FR-02**: Filter by brand
- **FR-03**: Search products by name
- **FR-04**: View detailed product information
- **FR-05**: Add to favorites
- **FR-06**: Remove favorites (individual or all)
- **FR-07**: AI recommendations using Gemini API

## 🛠 Tech Stack

- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **Storage**: AsyncStorage
- **API**: mockapi.io
- **AI**: Google Gemini API

## 📁 Project Structure

```
ArtTool-App/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js          # Product listing with search & filter
│   │   ├── DetailScreen.js        # Product details
│   │   └── FavoritesScreen.js     # Favorites + AI suggestions
│   ├── navigation/
│   │   └── AppNavigator.js        # Navigation setup
│   ├── services/
│   │   ├── api.js                 # API calls to mockapi.io
│   │   └── geminiAI.js            # AI integration
│   └── utils/
│       └── storage.js             # AsyncStorage utilities
├── App.js                         # Entry point
├── .env                           # Environment variables
└── package.json
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Edit `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
API_BASE_URL=https://your-mockapi-id.mockapi.io/api/v1
```

**Get Gemini API Key:**
- Visit: https://makersuite.google.com/app/apikey
- Create a new API key
- Copy and paste it into `.env`

### 3. Setup MockAPI

1. Go to https://mockapi.io
2. Create a new project
3. Create an endpoint called `arttools` with these fields:
   ```json
   {
     "id": "1",
     "name": "Professional Paint Brush Set",
     "brand": "Winsor & Newton",
     "category": "Brushes",
     "price": 45.99,
     "rating": 4.8,
     "image": "https://via.placeholder.com/400",
     "description": "High-quality professional paint brushes...",
     "features": ["Synthetic bristles", "Ergonomic handle"],
     "feedback": "Excellent brushes for professional artists"
   }
   ```
4. Generate 10-20 sample products
5. Copy your API URL to `.env`

### 4. Run the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 Screens

### Home Screen
- List all art tools
- Search functionality
- Brand filter chips
- Heart icon to add/remove favorites
- Pull to refresh

### Detail Screen
- Product image
- Name, brand, price
- Rating with stars
- Description
- Features list
- Customer feedback
- Add/Remove favorite button

### Favorites Screen
- List of favorited items
- Remove individual items
- Clear all button
- **AI Suggestions button** - Get personalized recommendations
- AI section shows 3 similar products based on your favorites

## 🤖 AI Integration

The app uses Google Gemini API to provide intelligent recommendations:

```javascript
// When user clicks "Get AI Suggestions"
const suggestions = await getDetailedAISuggestions(favorites);
```

The AI analyzes:
- Product names
- Brands
- Categories
- Price ranges

And suggests 3 similar products the user might like.

## 🔐 Security

- API keys are stored in `.env` (not committed to git)
- `.gitignore` includes `.env` file
- Use environment variables for sensitive data

## 📦 Key Dependencies

```json
{
  "@react-navigation/native": "Bottom tabs + Stack navigation",
  "@react-native-async-storage/async-storage": "Local storage",
  "axios": "HTTP requests",
  "@google/generative-ai": "Gemini AI integration",
  "react-native-dotenv": "Environment variables"
}
```

## 🎯 Usage Flow

1. **Browse** art tools on Home screen
2. **Search** or **filter** by brand
3. **Tap** on product to view details
4. **Add** to favorites using ❤️ icon
5. **Navigate** to Favorites tab
6. **Click** "Get AI Suggestions"
7. **View** personalized recommendations

## 🐛 Troubleshooting

### AI not working?
- Check `.env` has valid `GEMINI_API_KEY`
- Ensure internet connection
- Check console for error messages

### Data not loading?
- Verify `API_BASE_URL` in `.env`
- Check mockapi.io endpoint is active
- Test API endpoint in browser

### App crashes?
- Run `npm install` again
- Clear cache: `expo start -c`
- Check for missing dependencies

## 📄 License

This is an educational project for FPTU MMA course.

## 👨‍💻 Developer

Created for Mobile App Development Assignment

---

**Happy Coding! 🎨✨**
# art-tools
