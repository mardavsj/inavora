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

  // Validate userId
  if (!userId) {
    Logger.error('Video upload attempted without userId');
    throw new AppError('Authentication required', 401, 'UNAUTHORIZED');
  }

  if (!video) {
    throw new AppError('Video data is required', 400, 'VALIDATION_ERROR');
  }

  if (!video.startsWith('data:video/')) {
    throw new AppError('Invalid video format. Must be base64 encoded video.', 400, 'VALIDATION_ERROR');
  }

  // Validate base64 data is not empty
  const base64Data = video.split(',')[1];
  if (!base64Data || base64Data.length === 0) {
    throw new AppError('Video data is empty or invalid', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (video.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Maximum file size is 100MB
  if (sizeInMB > 100) {
    throw new AppError(`Video too large (${sizeInMB.toFixed(1)}MB). Maximum supported size is 100MB.`, 400, 'VALIDATION_ERROR');
  }

  Logger.info(`Attempting to upload video for user ${userId}, size: ${sizeInMB.toFixed(2)}MB`);

  try {
    const result = await cloudinaryService.uploadVideo(video);

    // Store video reference in Image model (we can create a separate Video model later if needed)
    try {
      const videoRecord = new Image({
        userId,
        imageUrl: result.url, // Reusing imageUrl field for video URL
        publicId: result.publicId
      });
      await videoRecord.save();
      Logger.info(`Video record saved to database for user ${userId}, publicId: ${result.publicId}`);
    } catch (dbError) {
      Logger.error('Error saving video record to database', {
        userId,
        publicId: result.publicId,
        error: dbError.message,
        stack: dbError.stack
      });
      // Even if database save fails, the video is already uploaded to Cloudinary
      // We'll still return success but log the database error
      // In production, you might want to handle this differently (e.g., delete from Cloudinary)
    }

    Logger.info(`Video uploaded successfully for user ${userId}, publicId: ${result.publicId}`);

    res.status(200).json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        videoUrl: result.url,
        publicId: result.publicId
      }
    });
  } catch (error) {
    Logger.error('Error in uploadVideo controller', {
      userId,
      error: error.message,
      http_code: error.http_code,
      name: error.name,
      stack: error.stack
    });
    
    // Re-throw as AppError with appropriate status code
    if (error.message.includes('authentication') || error.message.includes('credentials') || error.message.includes('not properly configured')) {
      throw new AppError(error.message, 500, 'CLOUDINARY_CONFIG_ERROR');
    } else if (error.message.includes('timeout')) {
      throw new AppError(error.message, 408, 'UPLOAD_TIMEOUT');
    } else if (error.message.includes('too large') || error.http_code === 413) {
      throw new AppError(error.message, 413, 'FILE_TOO_LARGE');
    } else if (error.http_code === 400) {
      throw new AppError(error.message || 'Invalid video file', 400, 'VALIDATION_ERROR');
    } else {
      throw new AppError(error.message || 'Failed to upload video', 500, 'UPLOAD_ERROR');
    }
  }
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

/**
 * Upload PowerPoint file to Cloudinary
 * @route POST /api/upload/powerpoint
 * @access Private
 * @param {string} req.body.powerpoint - Base64 encoded PowerPoint file
 * @returns {Object} Uploaded PowerPoint URL and public ID
 */
const uploadPowerPoint = asyncHandler(async (req, res, next) => {
  const { powerpoint } = req.body;
  const userId = req.userId;

  if (!powerpoint) {
    throw new AppError('PowerPoint file data is required', 400, 'VALIDATION_ERROR');
  }

  // Check if it's a valid PowerPoint file (base64 encoded)
  // FileReader.readAsDataURL may produce different MIME types, so we check for both the MIME type and file extension
  const isValidPowerPointMime = powerpoint.startsWith('data:application/vnd.ms-powerpoint') || 
                                 powerpoint.startsWith('data:application/vnd.openxmlformats-officedocument.presentationml.presentation') ||
                                 powerpoint.startsWith('data:application/octet-stream') ||
                                 powerpoint.startsWith('data:application/zip'); // .pptx files are ZIP archives
  
  if (!isValidPowerPointMime && !powerpoint.startsWith('data:')) {
    throw new AppError('Invalid PowerPoint format. Must be .ppt or .pptx file.', 400, 'VALIDATION_ERROR');
  }

  const sizeInBytes = (powerpoint.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  
  // Allow up to 100MB for PowerPoint files
  if (sizeInMB > 100) {
    throw new AppError(`PowerPoint file too large (${sizeInMB.toFixed(1)}MB). Maximum size is 100MB.`, 400, 'VALIDATION_ERROR');
  }

  Logger.info(`Attempting to upload PowerPoint for user ${userId}, size: ${sizeInMB.toFixed(2)}MB`);

  try {
    const result = await cloudinaryService.uploadPowerPoint(powerpoint);

    // Store PowerPoint reference in Image model (we can create a separate Document model later if needed)
    try {
      const powerpointRecord = new Image({
        userId,
        imageUrl: result.url, // Reusing imageUrl field for PowerPoint URL
        publicId: result.publicId
      });
      await powerpointRecord.save();
      Logger.info(`PowerPoint record saved to database for user ${userId}, publicId: ${result.publicId}`);
    } catch (dbError) {
      Logger.error('Error saving PowerPoint record to database', {
        userId,
        publicId: result.publicId,
        error: dbError.message
      });
    }

    Logger.info(`PowerPoint uploaded successfully for user ${userId}, publicId: ${result.publicId}`);

    res.status(200).json({
      success: true,
      message: 'PowerPoint file uploaded successfully',
      data: {
        powerpointUrl: result.url,
        publicId: result.publicId
      }
    });
  } catch (error) {
    Logger.error('Error in uploadPowerPoint controller', {
      userId,
      error: error.message
    });
    
    throw new AppError(error.message || 'Failed to upload PowerPoint file', 500, 'UPLOAD_ERROR');
  }
});

module.exports = {
  uploadImage,
  deleteImage,
  getUserImages,
  uploadVideo,
  deleteVideo,
  uploadPowerPoint
};
