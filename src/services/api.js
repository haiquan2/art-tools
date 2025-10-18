import axios from 'axios';
import { API_BASE_URL } from '@env';

const api = axios.create({
  baseURL: API_BASE_URL || 'https://6751d12dd1983b9597b476f2.mockapi.io/api/v1',
  timeout: 10000,
});

// Fetch all art tools
export const fetchArtTools = async () => {
  try {
    const response = await api.get('/art-tools');
    return response.data;
  } catch (error) {
    console.error('Error fetching art tools:', error);
    throw error;
  }
};

// Fetch art tool by ID
export const fetchArtToolById = async (id) => {
  try {
    const response = await api.get(`/art-tools/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching art tool:', error);
    throw error;
  }
};

export default api;
