/**
 * Utility Helper Functions
 * Core utilities used throughout the application
 */

const Helpers = (function() {
  'use strict';

  /**
   * Generate a UUID v4
   * Uses crypto.randomUUID() if available, falls back to custom implementation
   * @returns {string} UUID v4 string
   */
  function generateUUID() {
    // Modern browsers support crypto.randomUUID()
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Format a date as YYYY-MM-DD
   * @param {Date|string|number} date - Date object, ISO string, or timestamp
   * @returns {string} Formatted date string
   */
  function formatDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return '';
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Format a date for display (e.g., "Dec 21, 2025")
   * @param {Date|string|number} date - Date object, ISO string, or timestamp
   * @returns {string} Formatted date string
   */
  function formatDateDisplay(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 'Unknown date';
    }

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format a timestamp for display (e.g., "Dec 21, 2025 at 2:30 PM")
   * @param {Date|string|number} timestamp - Date object, ISO string, or timestamp
   * @returns {string} Formatted timestamp string
   */
  function formatDateTime(timestamp) {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) {
      return 'Unknown time';
    }

    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  /**
   * Calculate days since a date
   * @param {Date|string|number} date - Date object, ISO string, or timestamp
   * @returns {number} Days since the date (negative if in future)
   */
  function daysSince(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      return 0;
    }

    const now = new Date();
    const diffTime = now - d;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Deep clone an object
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
      return obj.map(item => deepClone(item));
    }

    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  /**
   * Check if a value is empty (null, undefined, empty string, empty array, empty object)
   * @param {*} value - Value to check
   * @returns {boolean} True if empty
   */
  function isEmpty(value) {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }

    if (Array.isArray(value) && value.length === 0) {
      return true;
    }

    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }

    return false;
  }

  /**
   * Truncate string to max length with ellipsis
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  function truncate(str, maxLength) {
    if (typeof str !== 'string') {
      return '';
    }

    if (str.length <= maxLength) {
      return str;
    }

    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Sort array of objects by a property
   * @param {Array} arr - Array to sort
   * @param {string} prop - Property to sort by
   * @param {boolean} ascending - Sort direction (default: true)
   * @returns {Array} Sorted array
   */
  function sortBy(arr, prop, ascending = true) {
    return arr.sort((a, b) => {
      const aVal = a[prop];
      const bVal = b[prop];

      if (aVal < bVal) {
        return ascending ? -1 : 1;
      }
      if (aVal > bVal) {
        return ascending ? 1 : -1;
      }
      return 0;
    });
  }

  // Public API
  return {
    generateUUID,
    formatDate,
    formatDateDisplay,
    formatDateTime,
    daysSince,
    escapeHTML,
    debounce,
    deepClone,
    isEmpty,
    truncate,
    sortBy
  };
})();
