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
 * Upload PowerPoint file to Cloudinary
 * @param {string} base64PowerPoint - Base64 encoded PowerPoint file
 * @param {string} folder - Cloudinary folder path
 * @returns {Object} Upload result with URL and public ID
 */
async function uploadPowerPoint(base64PowerPoint, folder = 'inavora/powerpoint') {
  try {
    // For raw uploads, Cloudinary doesn't validate file formats
    // We'll upload as raw resource and let Cloudinary handle it
    const result = await cloudinary.uploader.upload(base64PowerPoint, {
      folder: folder,
      resource_type: 'raw', // PowerPoint files are raw resources
      use_filename: true,
      unique_filename: true,
      overwrite: false
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    Logger.error('Cloudinary PowerPoint upload error', error);
    // Log the full error for debugging
    if (error.http_code) {
      Logger.error(`Cloudinary error details: http_code=${error.http_code}, message=${error.message}`);
    }
    throw new Error(error.message || 'Failed to upload PowerPoint to Cloudinary');
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
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      Logger.error('Cloudinary configuration missing');
      throw new Error('Cloudinary is not properly configured. Please check environment variables.');
    }

    // Validate base64 video format
    if (!base64Video || typeof base64Video !== 'string') {
      Logger.error('Invalid base64 video data provided');
      throw new Error('Invalid video data provided');
    }

    if (!base64Video.startsWith('data:video/')) {
      Logger.error('Base64 video does not start with data:video/');
      throw new Error('Invalid video format. Expected base64 encoded video.');
    }

    Logger.info(`Uploading video to Cloudinary (folder: ${folder})`);
    
    // Upload video without transformations
    const result = await cloudinary.uploader.upload(base64Video, {
      folder: folder,
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
      chunk_size: 6000000, // 6MB chunks for large files
      timeout: 600000 // 10 minute timeout
    });

    Logger.info(`Video uploaded successfully: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    // Log detailed error information
    Logger.error('Cloudinary video upload error', {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
      stack: error.stack,
      response: error.response
    });

    // Provide more specific error messages
    if (error.message && error.message.includes('eager_async')) {
      throw new Error('Video is too large. Please use a smaller file or contact support.');
    } else if (error.http_code === 400) {
      throw new Error(`Invalid video file: ${error.message || 'Please check the video format and size'}`);
    } else if (error.http_code === 401) {
      throw new Error('Cloudinary authentication failed. Please check API credentials.');
    } else if (error.http_code === 413) {
      throw new Error('Video file is too large for Cloudinary upload.');
    } else if (error.message && error.message.includes('timeout')) {
      throw new Error('Upload timeout. The video file may be too large. Please try a smaller file.');
    } else if (error.message) {
      throw new Error(`Failed to upload video: ${error.message}`);
    } else {
      throw new Error('Failed to upload video to Cloudinary. Please try again.');
    }
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
  uploadPowerPoint,
  uploadDocument,
  uploadVideo,
  deleteVideo
};
