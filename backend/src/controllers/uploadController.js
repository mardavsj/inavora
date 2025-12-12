const cloudinaryService = require('../services/cloudinaryService');
const Image = require('../models/Image');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');

/**
 * Upload image to Cloudinary
 * @route POST /api/upload/image
 * @access Private
 * @param {string} req.body.image - Base64 encoded image data
 * @returns {Object} Uploaded image URL and public ID
 */
const uploadImage = asyncHandler(async (req, res, next) => {
  const { image } = req.body;
  const userId = req.userId;

  if (!image) {
    throw new AppError('Image data is required', 400, 'VALIDATION_ERROR');
  }

  if (!image.startsWith('data:image/')) {
    throw new AppError('Invalid image format. Must be base64 encoded image.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (image.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  if (sizeInMB > 10) {
    throw new AppError(`Image too large (${sizeInMB.toFixed(1)}MB). Maximum size is 10MB.`, 400, 'VALIDATION_ERROR');
  }

  const result = await cloudinaryService.uploadImage(image);

  const imageRecord = new Image({
    userId,
    imageUrl: result.url,
    publicId: result.publicId
  });
  await imageRecord.save();

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      imageUrl: result.url,
      publicId: result.publicId
    }
  });
});

/**
 * Delete image from Cloudinary
 * @route DELETE /api/upload/image
 * @access Private
 * @param {string} req.body.publicId - Cloudinary public ID
 * @returns {Object} Success message
 */
const deleteImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.body;
  const userId = req.userId;

  if (!publicId) {
    throw new AppError('Public ID is required', 400, 'VALIDATION_ERROR');
  }

  const imageRecord = await Image.findOne({ publicId });

  if (!imageRecord) {
    throw new AppError('Image not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (imageRecord.userId.toString() !== userId.toString()) {
    throw new AppError('You do not have permission to delete this image', 403, 'FORBIDDEN');
  }

  await cloudinaryService.deleteImage(publicId);
  await Image.deleteOne({ publicId });

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully'
  });
});

/**
 * Get user's uploaded images
 * @route GET /api/upload/images
 * @access Private
 * @returns {Object} Array of user's uploaded images
 */
const getUserImages = asyncHandler(async (req, res, next) => {
  const userId = req.userId;

  const images = await Image.find({ userId })
    .sort({ uploadedAt: -1 })
    .select('imageUrl publicId uploadedAt')
    .lean();

  res.status(200).json({
    success: true,
    data: images
  });
});

/**
 * Upload video to Cloudinary
 * @route POST /api/upload/video
 * @access Private
 * @param {string} req.body.video - Base64 encoded video data
 * @returns {Object} Uploaded video URL and public ID
 */
const uploadVideo = asyncHandler(async (req, res, next) => {
  const { video } = req.body;
  const userId = req.userId;

  if (!video) {
    throw new AppError('Video data is required', 400, 'VALIDATION_ERROR');
  }

  if (!video.startsWith('data:video/')) {
    throw new AppError('Invalid video format. Must be base64 encoded video.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (video.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Allow larger files for videos (100MB max)
  if (sizeInMB > 100) {
    throw new AppError(`Video too large (${sizeInMB.toFixed(1)}MB). Maximum size is 100MB.`, 400, 'VALIDATION_ERROR');
  }

  const result = await cloudinaryService.uploadVideo(video);

  // Store video reference in Image model (we can create a separate Video model later if needed)
  const videoRecord = new Image({
    userId,
    imageUrl: result.url, // Reusing imageUrl field for video URL
    publicId: result.publicId
  });
  await videoRecord.save();

  res.status(200).json({
    success: true,
    message: 'Video uploaded successfully',
    data: {
      videoUrl: result.url,
      publicId: result.publicId
    }
  });
});

/**
 * Delete video from Cloudinary
 * @route DELETE /api/upload/video
 * @access Private
 * @param {string} req.body.publicId - Cloudinary public ID
 * @returns {Object} Success message
 */
const deleteVideo = asyncHandler(async (req, res, next) => {
  const { publicId } = req.body;
  const userId = req.userId;

  if (!publicId) {
    throw new AppError('Public ID is required', 400, 'VALIDATION_ERROR');
  }

  const videoRecord = await Image.findOne({ publicId });

  if (!videoRecord) {
    throw new AppError('Video not found', 404, 'RESOURCE_NOT_FOUND');
  }

  if (videoRecord.userId.toString() !== userId.toString()) {
    throw new AppError('You do not have permission to delete this video', 403, 'FORBIDDEN');
  }

  await cloudinaryService.deleteVideo(publicId);
  await Image.deleteOne({ publicId });

  res.status(200).json({
    success: true,
    message: 'Video deleted successfully'
  });
});

module.exports = {
  uploadImage,
  deleteImage,
  getUserImages,
  uploadVideo,
  deleteVideo
};
