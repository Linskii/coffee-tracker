/**
 * Storage Layer
 * Abstraction over localStorage with error handling and validation
 */

const Storage = (function() {
  'use strict';

  /**
   * Custom storage error class
   */
  class StorageError extends Error {
    constructor(message, originalError) {
      super(message);
      this.name = 'StorageError';
      this.originalError = originalError;
    }
  }

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available
   */
  function isAvailable() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get storage usage information
   * @returns {object} Object with used and estimated total bytes
   */
  function getUsage() {
    if (!isAvailable()) {
      return { used: 0, total: 0, percentage: 0 };
    }

    let used = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += key.length + localStorage[key].length;
      }
    }

    // Most browsers have 5-10MB limit, we'll estimate 5MB
    const estimatedTotal = 5 * 1024 * 1024;
    const percentage = (used / estimatedTotal) * 100;

    return {
      used,
      total: estimatedTotal,
      percentage: Math.min(percentage, 100),
      usedKB: (used / 1024).toFixed(2),
      totalMB: (estimatedTotal / 1024 / 1024).toFixed(2)
    };
  }

  /**
   * Get item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} Parsed value or default value
   */
  function get(key, defaultValue = null) {
    if (!isAvailable()) {
      console.warn('localStorage is not available');
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);

      if (item === null) {
        return defaultValue;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch (parseError) {
        // If parse fails, return raw string
        console.warn(`Failed to parse JSON for key "${key}":`, parseError);
        return item;
      }
    } catch (error) {
      console.error(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set item in localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} True if successful
   * @throws {StorageError} If storage fails
   */
  function set(key, value) {
    if (!isAvailable()) {
      throw new StorageError('localStorage is not available');
    }

    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      // Check if it's a quota exceeded error
      if (
        error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.code === 1014
      ) {
        const usage = getUsage();
        throw new StorageError(
          `Storage quota exceeded. Used: ${usage.usedKB}KB of ${usage.totalMB}MB`,
          error
        );
      }

      // Other error (e.g., circular reference in JSON)
      throw new StorageError(
        `Failed to save data for key "${key}": ${error.message}`,
        error
      );
    }
  }

  /**
   * Remove item from localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if successful
   */
  function remove(key) {
    if (!isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing key "${key}" from localStorage:`, error);
      return false;
    }
  }

  /**
   * Clear all items from localStorage
   * WARNING: This clears everything, not just app data
   * @returns {boolean} True if successful
   */
  function clear() {
    if (!isAvailable()) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  /**
   * Clear only app-specific keys (keys starting with prefix)
   * @param {string} prefix - Key prefix to match (e.g., 'coffee_tracker_')
   * @returns {number} Number of keys removed
   */
  function clearAppData(prefix) {
    if (!isAvailable()) {
      console.warn('localStorage is not available');
      return 0;
    }

    let count = 0;
    const keysToRemove = [];

    // Collect keys to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    // Remove collected keys
    keysToRemove.forEach(key => {
      if (remove(key)) {
        count++;
      }
    });

    return count;
  }

  /**
   * Check if a key exists in localStorage
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   */
  function has(key) {
    if (!isAvailable()) {
      return false;
    }

    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys with a specific prefix
   * @param {string} prefix - Key prefix to match
   * @returns {Array<string>} Array of matching keys
   */
  function getKeys(prefix = '') {
    if (!isAvailable()) {
      return [];
    }

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Backup all app data to JSON string
   * @param {string} prefix - Key prefix for app data
   * @returns {string} JSON string of all app data
   */
  function backup(prefix) {
    if (!isAvailable()) {
      return '{}';
    }

    const data = {};
    const keys = getKeys(prefix);

    keys.forEach(key => {
      data[key] = get(key);
    });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Restore data from backup JSON string
   * @param {string} jsonString - JSON string to restore
   * @param {boolean} clearExisting - Clear existing data before restore
   * @returns {object} Result with success status and count of restored keys
   */
  function restore(jsonString, clearExisting = false) {
    if (!isAvailable()) {
      throw new StorageError('localStorage is not available');
    }

    try {
      const data = JSON.parse(jsonString);

      if (clearExisting) {
        // Get prefix from first key
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const prefix = firstKey.split('_').slice(0, 2).join('_') + '_';
          clearAppData(prefix);
        }
      }

      let count = 0;
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          set(key, data[key]);
          count++;
        }
      }

      return { success: true, count };
    } catch (error) {
      throw new StorageError('Failed to restore backup: ' + error.message, error);
    }
  }

  // Public API
  return {
    isAvailable,
    getUsage,
    get,
    set,
    remove,
    clear,
    clearAppData,
    has,
    getKeys,
    backup,
    restore,
    StorageError
  };
})();
