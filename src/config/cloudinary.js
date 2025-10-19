export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dwcs9l7bj',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'art-tools',
  apiKey: process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY || '378413987322978'
};

export const uploadImageToCloudinary = async (imageUri) => {
  try {
    const formData = new FormData();
    
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename || '');
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', {
      uri: imageUri,
      type: type,
      name: filename || 'photo.jpg',
    });
    
    const uploadPreset = CLOUDINARY_CONFIG.uploadPreset;
    const cloudName = CLOUDINARY_CONFIG.cloudName;
    if (!uploadPreset) throw new Error('Missing Cloudinary upload preset');
    if (!cloudName) throw new Error('Missing Cloudinary cloud name');

    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const uploadMultipleImages = async (imageUris) => {
  try {
    const uploadPromises = imageUris.map(uri => uploadImageToCloudinary(uri));
    const urls = await Promise.all(uploadPromises);
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};
