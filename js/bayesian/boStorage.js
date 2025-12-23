/**
 * Bayesian Optimization Storage
 *
 * Manages persistence of BO state to localStorage.
 * Each bean-machine combination has its own BO state.
 */
const BOStorage = (function() {
  'use strict';

  const STORAGE_KEY = 'coffee_tracker_bo_state';

  /**
   * Get all BO states from localStorage
   * @returns {Object} Map of "beanId_machineId" -> BO state
   */
  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('BOStorage: Failed to parse BO state', e);
      return {};
    }
  }

  /**
   * Get BO state for a specific bean-machine combination
   * @param {string} key - Format: "beanId_machineId"
   * @returns {Object|null} BO state or null if not found
   */
  function get(key) {
    const allStates = getAll();
    return allStates[key] || null;
  }

  /**
   * Save BO state for a specific bean-machine combination
   * @param {string} key - Format: "beanId_machineId"
   * @param {Object} state - BO state object
   */
  function set(key, state) {
    try {
      const allStates = getAll();
      allStates[key] = state;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
    } catch (e) {
      console.error('BOStorage: Failed to save BO state', e);
      throw new Error('Failed to save Bayesian Optimization state');
    }
  }

  /**
   * Delete BO state for a specific bean-machine combination
   * @param {string} key - Format: "beanId_machineId"
   */
  function remove(key) {
    const allStates = getAll();
    delete allStates[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
  }

  /**
   * Clear all BO states
   */
  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Get all keys (bean-machine combinations with BO state)
   * @returns {string[]} Array of keys
   */
  function keys() {
    const allStates = getAll();
    return Object.keys(allStates);
  }

  return {
    get,
    set,
    remove,
    clear,
    keys,
    getAll
  };
})();
