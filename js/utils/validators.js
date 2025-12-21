/**
 * Form Validation Utilities
 * Client-side validation helpers
 */

const Validators = (function() {
  'use strict';

  /**
   * Validate a required field
   * @param {*} value - Value to validate
   * @returns {string|null} Error message or null if valid
   */
  function required(value) {
    if (Helpers.isEmpty(value)) {
      return Config.ERRORS.REQUIRED_FIELD;
    }
    return null;
  }

  /**
   * Validate string length
   * @param {string} value - String to validate
   * @param {number} min - Minimum length
   * @param {number} max - Maximum length
   * @returns {string|null} Error message or null if valid
   */
  function stringLength(value, min, max) {
    if (typeof value !== 'string') {
      return 'Value must be a string';
    }

    const trimmed = value.trim();

    if (min !== undefined && trimmed.length < min) {
      return `Must be at least ${min} characters`;
    }

    if (max !== undefined && trimmed.length > max) {
      return `Must be no more than ${max} characters`;
    }

    return null;
  }

  /**
   * Validate a date
   * @param {string} value - Date string
   * @returns {string|null} Error message or null if valid
   */
  function date(value) {
    if (!value) {
      return Config.ERRORS.REQUIRED_FIELD;
    }

    const d = new Date(value);
    if (isNaN(d.getTime())) {
      return Config.ERRORS.INVALID_DATE;
    }

    return null;
  }

  /**
   * Validate a number within range
   * @param {*} value - Value to validate
   * @param {number} min - Minimum value (optional)
   * @param {number} max - Maximum value (optional)
   * @returns {string|null} Error message or null if valid
   */
  function number(value, min, max) {
    const num = Number(value);

    if (isNaN(num)) {
      return Config.ERRORS.INVALID_NUMBER;
    }

    if (min !== undefined && num < min) {
      return `Must be at least ${min}`;
    }

    if (max !== undefined && num > max) {
      return `Must be no more than ${max}`;
    }

    return null;
  }

  /**
   * Validate a rating (1-10)
   * @param {*} value - Rating value
   * @returns {string|null} Error message or null if valid
   */
  function rating(value) {
    return number(
      value,
      Config.VALIDATION.RATING_MIN,
      Config.VALIDATION.RATING_MAX
    ) || null;
  }

  /**
   * Validate slider range configuration
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {string|null} Error message or null if valid
   */
  function sliderRange(min, max) {
    if (typeof min !== 'number' || typeof max !== 'number') {
      return 'Min and max must be numbers';
    }

    if (min >= max) {
      return Config.ERRORS.INVALID_SLIDER_RANGE;
    }

    return null;
  }

  /**
   * Validate form data for creating/editing a machine
   * @param {FormData|object} formData - Form data
   * @returns {object} Object with isValid boolean and errors object
   */
  function validateMachineForm(formData) {
    const errors = {};

    // Convert FormData to plain object if needed
    const data = formData instanceof FormData
      ? Object.fromEntries(formData)
      : formData;

    // Validate name
    const nameError = required(data.name) ||
      stringLength(
        data.name,
        Config.VALIDATION.MACHINE_NAME_MIN_LENGTH,
        Config.VALIDATION.MACHINE_NAME_MAX_LENGTH
      );

    if (nameError) {
      errors.name = nameError;
    }

    // Validate parameters (if provided as array)
    if (data.parameters && Array.isArray(data.parameters)) {
      data.parameters.forEach((param, index) => {
        const paramErrors = {};

        const paramNameError = required(param.name) ||
          stringLength(
            param.name,
            Config.VALIDATION.PARAMETER_NAME_MIN_LENGTH,
            Config.VALIDATION.PARAMETER_NAME_MAX_LENGTH
          );

        if (paramNameError) {
          paramErrors.name = paramNameError;
        }

        // Type-specific validation
        if (param.type === Config.PARAMETER_TYPES.SLIDER) {
          const rangeError = sliderRange(param.config.min, param.config.max);
          if (rangeError) {
            paramErrors.range = rangeError;
          }
        }

        if (param.type === Config.PARAMETER_TYPES.DROPDOWN) {
          if (!param.config.options || param.config.options.length === 0) {
            paramErrors.options = 'Dropdown must have at least one option';
          }
        }

        if (Object.keys(paramErrors).length > 0) {
          errors[`parameter_${index}`] = paramErrors;
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate form data for creating/editing a bean
   * @param {FormData|object} formData - Form data
   * @returns {object} Object with isValid boolean and errors object
   */
  function validateBeanForm(formData) {
    const errors = {};

    const data = formData instanceof FormData
      ? Object.fromEntries(formData)
      : formData;

    // Validate name
    const nameError = required(data.name) ||
      stringLength(
        data.name,
        Config.VALIDATION.BEAN_NAME_MIN_LENGTH,
        Config.VALIDATION.BEAN_NAME_MAX_LENGTH
      );

    if (nameError) {
      errors.name = nameError;
    }

    // Validate purchase date
    const dateError = date(data.purchaseDate);
    if (dateError) {
      errors.purchaseDate = dateError;
    }

    // Validate notes (optional)
    if (data.notes) {
      const notesError = stringLength(
        data.notes,
        undefined,
        Config.VALIDATION.NOTES_MAX_LENGTH
      );

      if (notesError) {
        errors.notes = notesError;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Validate form data for creating/editing a run
   * @param {FormData|object} formData - Form data
   * @param {object} machine - Machine object for parameter validation
   * @returns {object} Object with isValid boolean and errors object
   */
  function validateRunForm(formData, machine) {
    const errors = {};

    const data = formData instanceof FormData
      ? Object.fromEntries(formData)
      : formData;

    // Validate rating (optional)
    if (data.rating !== undefined && data.rating !== null && data.rating !== '') {
      const ratingError = rating(data.rating);
      if (ratingError) {
        errors.rating = ratingError;
      }
    }

    // Validate notes (optional)
    if (data.notes) {
      const notesError = stringLength(
        data.notes,
        undefined,
        Config.VALIDATION.NOTES_MAX_LENGTH
      );

      if (notesError) {
        errors.notes = notesError;
      }
    }

    // Validate parameter values against machine parameters
    if (machine && machine.parameters) {
      machine.parameters.forEach(param => {
        const value = data.parameterValues ?
          data.parameterValues[param.id] :
          data[`param_${param.id}`];

        // Check required
        if (value === undefined || value === null || value === '') {
          errors[`param_${param.id}`] = `${param.name} is required`;
          return;
        }

        // Type-specific validation
        switch (param.type) {
          case Config.PARAMETER_TYPES.NUMBER:
          case Config.PARAMETER_TYPES.SLIDER:
            const numError = number(value);
            if (numError) {
              errors[`param_${param.id}`] = numError;
            }

            // Additional slider range validation
            if (param.type === Config.PARAMETER_TYPES.SLIDER) {
              const rangeError = number(
                value,
                param.config.min,
                param.config.max
              );

              if (rangeError) {
                errors[`param_${param.id}`] = rangeError;
              }
            }
            break;

          case Config.PARAMETER_TYPES.DROPDOWN:
            if (!param.config.options.includes(value)) {
              errors[`param_${param.id}`] =
                `Must be one of: ${param.config.options.join(', ')}`;
            }
            break;

          case Config.PARAMETER_TYPES.TEXT:
            // Text is always valid if present
            break;
        }
      });
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Display validation errors on a form
   * @param {object} errors - Errors object from validation
   * @param {HTMLElement} form - Form element
   */
  function displayFormErrors(errors, form) {
    // Clear existing errors
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.form-input, .form-select, .form-textarea')
      .forEach(el => el.classList.remove('has-error'));

    // Display new errors
    Object.keys(errors).forEach(fieldName => {
      const field = form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        // Add error class
        field.classList.add('has-error');

        // Create error message element
        const errorEl = document.createElement('span');
        errorEl.className = 'form-error';
        errorEl.textContent = errors[fieldName];

        // Insert after field
        field.parentNode.insertBefore(errorEl, field.nextSibling);
      }
    });

    // Scroll to first error
    const firstError = form.querySelector('.has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError.focus();
    }
  }

  // Public API
  return {
    required,
    stringLength,
    date,
    number,
    rating,
    sliderRange,
    validateMachineForm,
    validateBeanForm,
    validateRunForm,
    displayFormErrors
  };
})();
