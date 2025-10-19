import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 10000,
});

export const fetchArtTools = async () => {
  try {
    const response = await api.get('/art-tools');
    return response.data;
  } catch (error) {
    console.error('Error fetching art tools:', error);
    throw error;
  }
};

export const fetchArtToolById = async (id) => {
  try {
    const response = await api.get(`/art-tools/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching art tool:', error);
    throw error;
  }
};

export const countFeedbacks = async (id) => {
  try {
    const response = await api.get(`/art-tools/${id}`);
    return response.data.feedbacks.length;
  } catch (error) {
    console.error('Error counting feedbacks:', error);
    throw error;
  }
};

// average rating for an art tool
export const averageRating = async (id) => {
  try {
    const response = await api.get(`/art-tools/${id}`);
    const feedbacks = response.data.feedbacks;
    if (feedbacks.length === 0) return 0;
    const total = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    return total / feedbacks.length;
  } catch (error) {
    console.error('Error calculating average rating:', error);
    throw error;
  }
}

export default api;
