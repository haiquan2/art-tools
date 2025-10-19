import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../config/cloudinary';

/**
 * Request camera permissions
 */
export const requestCameraPermissions = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Camera permission denied');
  }
  return true;
};

/**
 * Request media library permissions
 */
export const requestMediaLibraryPermissions = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission denied');
  }
  return true;
};

/**
 * Take a photo using camera
 */
export const takePhoto = async () => {
  try {
    await requestCameraPermissions();
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error taking photo:', error);
    throw error;
  }
};

/**
 * Pick image from gallery
 */
export const pickImage = async () => {
  try {
    await requestMediaLibraryPermissions();
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Upload image to Cloudinary and return URL
 */
export const captureAndUploadImage = async (imageUri) => {
  try {
    const cloudinaryUrl = await uploadImageToCloudinary(imageUri);
    return cloudinaryUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

/**
 * Show image picker options
 */
export const showImagePickerOptions = () => {
  return new Promise((resolve, reject) => {
    // This will be handled by the UI component
    resolve('show_options');
  });
};
