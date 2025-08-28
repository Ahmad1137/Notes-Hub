// Frontend validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,2}[\s\-]?[\(]?[\d]{1,4}[\)]?[\s\-]?[\d]{1,4}[\s\-]?[\d]{1,9}$/;
  return phoneRegex.test(phone);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/\s+/g, ' ');
};

export const validateName = (name) => {
  const sanitized = sanitizeInput(name);
  return sanitized && sanitized.length >= 2 && sanitized.length <= 50;
};

export const validateAddress = (address) => {
  const sanitized = sanitizeInput(address);
  return sanitized && sanitized.length >= 5 && sanitized.length <= 200;
};

export const getPasswordStrength = (password) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };

  Object.values(checks).forEach(check => {
    if (check) score++;
  });

  return {
    score,
    checks,
    strength: score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong'
  };
};

export const validateForm = (formData, type = 'register') => {
  const errors = {};

  if (type === 'register') {
    // Name validation
    if (!formData.name || !validateName(formData.name)) {
      errors.name = 'Name must be 2-50 characters long';
    }

    // Phone validation
    if (!formData.phone_no || !validatePhone(formData.phone_no)) {
      errors.phone_no = 'Please enter a valid phone number';
    }

    // Address validation
    if (!formData.address || !validateAddress(formData.address)) {
      errors.address = 'Address must be 5-200 characters long';
    }
  }

  // Email validation (both login and register)
  if (!formData.email || !validateEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Password validation
  if (!formData.password) {
    errors.password = 'Password is required';
  } else if (type === 'register' && !validatePassword(formData.password)) {
    errors.password = 'Password must be at least 8 characters with uppercase, lowercase, number and special character';
  } else if (type === 'login' && formData.password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};