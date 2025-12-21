/**
 * Main Application Entry Point
 * Initializes the app and sets up observers
 */

(function() {
  'use strict';

  /**
   * Initialize the application
   */
  function init() {
    console.log('Coffee Tracker v' + Config.APP_VERSION);

    // Initialize app state
    AppState.init();

    // Initialize router
    Router.init();

    // Subscribe to state changes
    AppState.subscribe(handleStateChange);

    // Initial render
    render();
  }

  /**
   * Handle state changes
   * @param {object} newState - New state
   * @param {object} prevState - Previous state
   */
  function handleStateChange(newState, prevState) {
    // Re-render if view or data changed
    if (
      newState.currentView !== prevState.currentView ||
      newState.machines !== prevState.machines ||
      newState.beans !== prevState.beans ||
      newState.runs !== prevState.runs ||
      newState.error !== prevState.error ||
      newState.success !== prevState.success
    ) {
      render();
    }
  }

  /**
   * Main render function
   */
  function render() {
    const state = AppState.getState();

    // Render messages
    renderMessages();

    // Render loading overlay
    if (state.loading) {
      showLoadingOverlay();
    } else {
      hideLoadingOverlay();
    }

    // Render current view
    renderView(state.currentView);
  }

  /**
   * Render the current view
   * @param {string} view - View name
   */
  function renderView(view) {
    switch (view) {
      case 'home':
        Views.renderHome();
        break;

      case 'machines':
        Views.renderMachines();
        break;

      case 'machineForm':
        Views.renderMachineForm();
        break;

      case 'beans':
        Views.renderBeans();
        break;

      case 'beanForm':
        Views.renderBeanForm();
        break;

      case 'beanDetail':
        Views.renderBeanDetail();
        break;

      case 'runList':
        Views.renderRunList();
        break;

      case 'runForm':
        Views.renderRunForm();
        break;

      default:
        console.error('Unknown view:', view);
        Views.renderHome();
    }
  }

  /**
   * Render success/error messages
   */
  function renderMessages() {
    const state = AppState.getState();
    const messagesContainer = document.getElementById('messages');

    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    if (state.error) {
      const errorAlert = Components.alert(state.error, 'error');
      messagesContainer.appendChild(errorAlert);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        AppState.clearMessages();
      }, 5000);
    }

    if (state.success) {
      const successAlert = Components.alert(state.success, 'success');
      messagesContainer.appendChild(successAlert);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        AppState.clearMessages();
      }, 3000);
    }
  }

  /**
   * Show loading overlay
   */
  function showLoadingOverlay() {
    let overlay = document.getElementById('loading-overlay');

    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay';

      const spinner = document.createElement('div');
      spinner.className = 'loading-spinner';
      overlay.appendChild(spinner);

      document.body.appendChild(overlay);
    }
  }

  /**
   * Hide loading overlay
   */
  function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // Start the app when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
