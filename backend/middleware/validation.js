const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters',
    'any.required': 'Last name is required'
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  profile: Joi.object({
    avatar: Joi.string().uri().optional(),
    bio: Joi.string().max(500).optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().optional(),
      theme: Joi.string().valid('light', 'dark').optional(),
      language: Joi.string().length(2).optional()
    }).optional()
  }).optional(),
  address: Joi.object({
    street: Joi.string().optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    zipCode: Joi.string().optional(),
    country: Joi.string().optional()
  }).optional()
});

// Device validation schemas
const registerDeviceSchema = Joi.object({
  deviceId: Joi.string().alphanum().min(3).max(50).required().messages({
    'string.alphanum': 'Device ID must contain only letters and numbers',
    'any.required': 'Device ID is required'
  }),
  name: Joi.string().min(2).max(100).required(),
  type: Joi.string().valid('thermostat', 'light', 'camera', 'lock', 'sensor', 'speaker', 'outlet', 'other').required(),
  manufacturer: Joi.string().max(50).optional(),
  model: Joi.string().max(50).optional(),
  location: Joi.object({
    room: Joi.string().max(50).optional(),
    floor: Joi.string().max(50).optional(),
    building: Joi.string().max(50).optional()
  }).optional()
});

const deviceReadingSchema = Joi.object({
  values: Joi.object({
    temperature: Joi.number().min(-50).max(100).optional(),
    humidity: Joi.number().min(0).max(100).optional(),
    power: Joi.number().min(0).optional(),
    brightness: Joi.number().min(0).max(100).optional(),
    status: Joi.string().optional()
  }).required().min(1).messages({
    'object.min': 'At least one reading value is required'
  })
});

// Service validation schemas
const searchServicesSchema = Joi.object({
  q: Joi.string().max(200).allow('').optional(),
  category: Joi.string().valid('automation', 'security', 'energy', 'entertainment', 'health', 'other').allow('').optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  maxPrice: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).default(1).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20).optional()
});

// Validation middleware factory
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  registerDeviceSchema,
  deviceReadingSchema,
  searchServicesSchema,
  validate
};
