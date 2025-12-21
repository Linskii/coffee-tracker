/**
 * Application State Management
 * Observable state pattern for centralized state management
 */

const AppState = (function() {
  'use strict';

  // Internal state object
  let state = {
    // View state
    currentView: 'home',
    currentRoute: '',
    routeParams: {},

    // Data
    machines: [],
    beans: [],
    runs: [],

    // Selected entities
    selectedMachine: null,
    selectedBean: null,
    selectedRun: null,

    // UI state
    loading: false,
    error: null,
    success: null,

    // Data loaded flag
    dataLoaded: false
  };

  // Array of observer callback functions
  let observers = [];

  /**
   * Subscribe to state changes
   * @param {Function} callback - Function to call when state changes
   * @returns {Function} Unsubscribe function
   */
  function subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Observer must be a function');
    }

    observers.push(callback);

    // Return unsubscribe function
    return function unsubscribe() {
      observers = observers.filter(observer => observer !== callback);
    };
  }

  /**
   * Notify all observers of state change
   * @param {object} prevState - Previous state
   * @param {object} newState - New state
   */
  function notifyObservers(prevState, newState) {
    observers.forEach(observer => {
      try {
        observer(newState, prevState);
      } catch (error) {
        console.error('Error in state observer:', error);
      }
    });
  }

  /**
   * Update state with new values
   * @param {object} updates - Partial state object with updates
   */
  function setState(updates) {
    const prevState = Helpers.deepClone(state);
    state = { ...state, ...updates };
    notifyObservers(prevState, state);
  }

  /**
   * Get current state (returns a copy to prevent direct mutation)
   * @returns {object} Current state
   */
  function getState() {
    return Helpers.deepClone(state);
  }

  /**
   * Load all data from storage into state
   */
  function loadData() {
    try {
      setState({ loading: true, error: null });

      const machines = Repository.MachineRepository.getAll();
      const beans = Repository.BeanRepository.getAll();
      const runs = Repository.RunRepository.getAll();

      setState({
        machines,
        beans,
        runs,
        loading: false,
        dataLoaded: true
      });
    } catch (error) {
      console.error('Error loading data:', error);
      setState({
        loading: false,
        error: error.message || Config.ERRORS.INVALID_DATA
      });
    }
  }

  /**
   * Reload data from storage (useful after changes)
   */
  function reloadData() {
    loadData();
  }

  /**
   * Set current view and route
   * @param {string} view - View name
   * @param {object} params - Route parameters
   * @param {string} route - Route path
   */
  function setView(view, params = {}, route = '') {
    setState({
      currentView: view,
      routeParams: params,
      currentRoute: route,
      error: null,
      success: null
    });
  }

  /**
   * Select a machine
   * @param {string|null} machineId - Machine ID or null to clear
   */
  function selectMachine(machineId) {
    const machine = machineId ? Repository.MachineRepository.getById(machineId) : null;
    setState({ selectedMachine: machine });
  }

  /**
   * Select a bean
   * @param {string|null} beanId - Bean ID or null to clear
   */
  function selectBean(beanId) {
    const bean = beanId ? Repository.BeanRepository.getById(beanId) : null;
    setState({ selectedBean: bean });
  }

  /**
   * Select a run
   * @param {string|null} runId - Run ID or null to clear
   */
  function selectRun(runId) {
    const run = runId ? Repository.RunRepository.getById(runId) : null;
    setState({ selectedRun: run });
  }

  /**
   * Show an error message
   * @param {string} message - Error message
   */
  function showError(message) {
    setState({ error: message, success: null });
  }

  /**
   * Show a success message
   * @param {string} message - Success message
   */
  function showSuccess(message) {
    setState({ success: message, error: null });
  }

  /**
   * Clear messages
   */
  function clearMessages() {
    setState({ error: null, success: null });
  }

  /**
   * Set loading state
   * @param {boolean} loading - Loading state
   */
  function setLoading(loading) {
    setState({ loading });
  }

  /**
   * Create a new machine
   * @param {object} data - Machine data
   * @returns {object} Created machine
   */
  function createMachine(data) {
    try {
      setLoading(true);
      const machine = Repository.MachineRepository.create(data);
      reloadData();
      showSuccess(Config.MESSAGES.MACHINE_CREATED);
      return machine;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update a machine
   * @param {string} id - Machine ID
   * @param {object} data - Updated machine data
   * @returns {object} Updated machine
   */
  function updateMachine(id, data) {
    try {
      setLoading(true);
      const machine = Repository.MachineRepository.update(id, data);
      reloadData();
      showSuccess(Config.MESSAGES.MACHINE_UPDATED);
      return machine;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a machine
   * @param {string} id - Machine ID
   * @returns {boolean} True if deleted
   */
  function deleteMachine(id) {
    try {
      setLoading(true);
      const result = Repository.MachineRepository.delete(id);
      reloadData();
      showSuccess(Config.MESSAGES.MACHINE_DELETED);
      return result;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new bean
   * @param {object} data - Bean data
   * @returns {object} Created bean
   */
  function createBean(data) {
    try {
      setLoading(true);
      const bean = Repository.BeanRepository.create(data);
      reloadData();
      showSuccess(Config.MESSAGES.BEAN_CREATED);
      return bean;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update a bean
   * @param {string} id - Bean ID
   * @param {object} data - Updated bean data
   * @returns {object} Updated bean
   */
  function updateBean(id, data) {
    try {
      setLoading(true);
      const bean = Repository.BeanRepository.update(id, data);
      reloadData();
      showSuccess(Config.MESSAGES.BEAN_UPDATED);
      return bean;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a bean
   * @param {string} id - Bean ID
   * @returns {boolean} True if deleted
   */
  function deleteBean(id) {
    try {
      setLoading(true);
      const result = Repository.BeanRepository.delete(id);
      reloadData();
      showSuccess(Config.MESSAGES.BEAN_DELETED);
      return result;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Create a new run
   * @param {object} data - Run data
   * @returns {object} Created run
   */
  function createRun(data) {
    try {
      setLoading(true);
      const run = Repository.RunRepository.create(data);
      reloadData();
      showSuccess(Config.MESSAGES.RUN_CREATED);
      return run;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Update a run
   * @param {string} id - Run ID
   * @param {object} data - Updated run data
   * @returns {object} Updated run
   */
  function updateRun(id, data) {
    try {
      setLoading(true);
      const run = Repository.RunRepository.update(id, data);
      reloadData();
      showSuccess(Config.MESSAGES.RUN_UPDATED);
      return run;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Delete a run
   * @param {string} id - Run ID
   * @returns {boolean} True if deleted
   */
  function deleteRun(id) {
    try {
      setLoading(true);
      const result = Repository.RunRepository.delete(id);
      reloadData();
      showSuccess(Config.MESSAGES.RUN_DELETED);
      return result;
    } catch (error) {
      showError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Toggle star status for a run
   * @param {string} id - Run ID
   * @param {boolean} starred - Star status
   * @returns {object} Updated run
   */
  function toggleRunStar(id, starred) {
    try {
      const run = Repository.RunRepository.setStar(id, starred);
      reloadData();
      return run;
    } catch (error) {
      showError(error.message);
      throw error;
    }
  }

  /**
   * Initialize app state
   */
  function init() {
    // Check if localStorage is available
    if (!Storage.isAvailable()) {
      setState({
        error: Config.ERRORS.STORAGE_NOT_AVAILABLE,
        dataLoaded: true
      });
      return;
    }

    // Load initial data
    loadData();
  }

  // Public API
  return {
    // State access
    subscribe,
    getState,
    setState,

    // Data operations
    loadData,
    reloadData,
    init,

    // View management
    setView,
    selectMachine,
    selectBean,
    selectRun,

    // Messages
    showError,
    showSuccess,
    clearMessages,
    setLoading,

    // Entity operations
    createMachine,
    updateMachine,
    deleteMachine,
    createBean,
    updateBean,
    deleteBean,
    createRun,
    updateRun,
    deleteRun,
    toggleRunStar
  };
})();
