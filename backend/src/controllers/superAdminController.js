const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { AppError, asyncHandler } = require('../middleware/errorHandler');
const Logger = require('../utils/logger');
const superAdminService = require('../services/superAdminService');
const User = require('../models/User');
const Institution = require('../models/Institution');

/**
 * Login Super Admin
 * @route POST /api/super-admin/login
 * @access Public
 */
const loginSuperAdmin = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    throw new AppError('Password is required', 400, 'VALIDATION_ERROR');
  }

  const correctPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!correctPassword) {
    Logger.error('SUPER_ADMIN_PASSWORD not configured in environment variables');
    throw new AppError('Server configuration error. Please contact administrator.', 500, 'CONFIG_ERROR');
  }

  if (password !== correctPassword) {
    throw new AppError('Invalid password', 401, 'UNAUTHORIZED');
  }

  const token = jwt.sign(
    { 
      superAdmin: true,
      type: 'super_admin',
      timestamp: Date.now()
    },
    process.env.SUPER_ADMIN_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.SUPER_ADMIN_TOKEN_EXPIRES_IN || '8h' }
  );

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    expiresIn: process.env.SUPER_ADMIN_TOKEN_EXPIRES_IN || '8h'
  });
});

/**
 * Verify Super Admin Token
 * @route GET /api/super-admin/verify
 * @access Private (Super Admin)
 */
const verifyToken = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Token is valid',
    authenticated: true
  });
});

/**
 * Get Dashboard Stats
 * @route GET /api/super-admin/dashboard/stats
 * @access Private (Super Admin)
 */
const getDashboardStats = asyncHandler(async (req, res, next) => {
  const stats = await superAdminService.getPlatformStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * Get Users List
 * @route GET /api/super-admin/users
 * @access Private (Super Admin)
 */
const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, plan, status, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    plan,
    status,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getUsers(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get User Details
 * @route GET /api/super-admin/users/:id
 * @access Private (Super Admin)
 */
const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await superAdminService.getUserById(id);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Update User Plan
 * @route PUT /api/super-admin/users/:id/plan
 * @access Private (Super Admin)
 */
const updateUserPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { plan, status, endDate } = req.body;
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (plan) {
    user.subscription.plan = plan;
  }
  if (status) {
    user.subscription.status = status;
  }
  if (endDate) {
    user.subscription.endDate = new Date(endDate);
  }

  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'User plan updated successfully',
    data: user
  });
});

/**
 * Update User Status
 * @route PUT /api/super-admin/users/:id/status
 * @access Private (Super Admin)
 */
const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const user = await User.findById(id);
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  user.subscription.status = status;
  await user.save();
  
  res.status(200).json({
    success: true,
    message: 'User status updated successfully',
    data: user
  });
});

/**
 * Get Institutions List
 * @route GET /api/super-admin/institutions
 * @access Private (Super Admin)
 */
const getInstitutions = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, status, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    status,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getInstitutions(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Institution Details
 * @route GET /api/super-admin/institutions/:id
 * @access Private (Super Admin)
 */
const getInstitutionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await superAdminService.getInstitutionById(id);
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Update Institution Plan
 * @route PUT /api/super-admin/institutions/:id/plan
 * @access Private (Super Admin)
 */
const updateInstitutionPlan = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status, endDate, maxUsers } = req.body;
  
  const institution = await Institution.findById(id);
  if (!institution) {
    throw new AppError('Institution not found', 404, 'NOT_FOUND');
  }

  if (status) {
    institution.subscription.status = status;
  }
  if (endDate) {
    institution.subscription.endDate = new Date(endDate);
  }
  if (maxUsers) {
    institution.subscription.maxUsers = parseInt(maxUsers);
  }

  await institution.save();
  
  res.status(200).json({
    success: true,
    message: 'Institution plan updated successfully',
    data: institution
  });
});

/**
 * Get Payments List
 * @route GET /api/super-admin/payments
 * @access Private (Super Admin)
 */
const getPayments = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, status, plan, dateFrom, dateTo } = req.query;
  
  const filters = {
    status,
    plan,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getPayments(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Payment Statistics
 * @route GET /api/super-admin/payments/stats
 * @access Private (Super Admin)
 */
const getPaymentStats = asyncHandler(async (req, res, next) => {
  const stats = await superAdminService.getPaymentStats();
  
  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * Get Presentations List
 * @route GET /api/super-admin/presentations
 * @access Private (Super Admin)
 */
const getPresentations = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50, search, isLive, dateFrom, dateTo } = req.query;
  
  const filters = {
    search,
    isLive,
    dateFrom,
    dateTo
  };

  const result = await superAdminService.getPresentations(filters, parseInt(page), parseInt(limit));
  
  res.status(200).json({
    success: true,
    data: result
  });
});

/**
 * Get Growth Trends
 * @route GET /api/super-admin/analytics/growth
 * @access Private (Super Admin)
 */
const getGrowthTrends = asyncHandler(async (req, res, next) => {
  const { days = 30 } = req.query;
  
  const trends = await superAdminService.getGrowthTrends(parseInt(days));
  
  res.status(200).json({
    success: true,
    data: trends
  });
});

module.exports = {
  loginSuperAdmin,
  verifyToken,
  getDashboardStats,
  getUsers,
  getUserById,
  updateUserPlan,
  updateUserStatus,
  getInstitutions,
  getInstitutionById,
  updateInstitutionPlan,
  getPayments,
  getPaymentStats,
  getPresentations,
  getGrowthTrends
};

