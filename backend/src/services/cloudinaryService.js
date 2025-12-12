const cloudinary = require('cloudinary').v2;
const Logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload image to Cloudinary
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} folder - Cloudinary folder name (default: 'inavora/pin-images')
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadImage(base64Image, folder = 'inavora/pin-images') {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' }, // Limit max dimensions
        { quality: 'auto:good' }, // Auto optimize quality
        { fetch_format: 'auto' } // Auto format (WebP when supported)
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    Logger.error('Cloudinary upload error', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
async function deleteImage(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    Logger.error('Cloudinary delete error', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Upload document (PDF, DOC, etc.) to Cloudinary
 * @param {string} base64Document - Base64 encoded document string
 * @param {string} folder - Cloudinary folder name (default: 'inavora/documents')
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadDocument(base64Document, folder = 'inavora/documents') {
  try {
    const result = await cloudinary.uploader.upload(base64Document, {
      folder: folder,
      resource_type: 'raw', // For PDFs and other documents
      allowed_formats: ['pdf', 'doc', 'docx']
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    Logger.error('Cloudinary document upload error', error);
    throw new Error('Failed to upload document to Cloudinary');
  }
}

/**
 * Upload video to Cloudinary
 * @param {string} base64Video - Base64 encoded video string
 * @param {string} folder - Cloudinary folder name (default: 'inavora/videos')
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadVideo(base64Video, folder = 'inavora/videos') {
  try {
    const result = await cloudinary.uploader.upload(base64Video, {
      folder: folder,
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
      transformation: [
        { quality: 'auto:good' }, // Auto optimize quality
        { fetch_format: 'auto' } // Auto format
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    Logger.error('Cloudinary video upload error', error);
    throw new Error('Failed to upload video to Cloudinary');
  }
}

/**
 * Delete video from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
async function deleteVideo(publicId) {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
  } catch (error) {
    Logger.error('Cloudinary video delete error', error);
    throw new Error('Failed to delete video from Cloudinary');
  }
}

module.exports = {
  uploadImage,
  deleteImage,
  uploadDocument,
  uploadVideo,
  deleteVideo
};
