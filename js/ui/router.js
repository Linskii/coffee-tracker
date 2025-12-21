/**
 * Router
 * Hash-based SPA routing for client-side navigation
 */

const Router = (function() {
  'use strict';

  // Route definitions with patterns
  const routes = [
    { pattern: '', view: 'home', name: 'home' },
    { pattern: 'machines', view: 'machines', name: 'machines' },
    { pattern: 'machines/new', view: 'machineForm', name: 'machineNew' },
    { pattern: 'machines/:id', view: 'machineForm', name: 'machineEdit' },
    { pattern: 'beans', view: 'beans', name: 'beans' },
    { pattern: 'beans/new', view: 'beanForm', name: 'beanNew' },
    { pattern: 'beans/:id', view: 'beanDetail', name: 'beanDetail' },
    { pattern: 'beans/:beanId/machines/:machineId', view: 'runList', name: 'runList' },
    { pattern: 'beans/:beanId/machines/:machineId/run/new', view: 'runForm', name: 'runNew' },
    { pattern: 'beans/:beanId/machines/:machineId/run/:runId', view: 'runForm', name: 'runEdit' }
  ];

  let currentRoute = null;

  /**
   * Initialize the router
   */
  function init() {
    // Listen for hash changes
    window.addEventListener('hashchange', handleRouteChange);

    // Handle initial route
    handleRouteChange();
  }

  /**
   * Handle route changes
   */
  function handleRouteChange() {
    const hash = window.location.hash.slice(1) || ''; // Remove #
    const path = hash.startsWith('/') ? hash.slice(1) : hash;

    const match = matchRoute(path);

    if (match) {
      currentRoute = match;
      AppState.setView(match.view, match.params, path);
    } else {
      // Route not found, redirect to home
      navigate('');
    }
  }

  /**
   * Match a path to a route pattern
   * @param {string} path - Path to match
   * @returns {object|null} Matched route with params or null
   */
  function matchRoute(path) {
    for (const route of routes) {
      const params = matchPattern(route.pattern, path);
      if (params !== null) {
        return {
          ...route,
          params
        };
      }
    }
    return null;
  }

  /**
   * Match a path against a pattern
   * @param {string} pattern - Route pattern (e.g., 'beans/:id')
   * @param {string} path - Actual path (e.g., 'beans/123')
   * @returns {object|null} Params object or null if no match
   */
  function matchPattern(pattern, path) {
    // Handle exact match for root
    if (pattern === '' && path === '') {
      return {};
    }

    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    // Different number of parts = no match
    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // This is a parameter
        const paramName = patternPart.slice(1);
        params[paramName] = decodeURIComponent(pathPart);
      } else if (patternPart !== pathPart) {
        // Parts don't match
        return null;
      }
    }

    return params;
  }

  /**
   * Navigate to a new route
   * @param {string} path - Path to navigate to
   */
  function navigate(path) {
    // Ensure path doesn't start with #
    if (path.startsWith('#')) {
      path = path.slice(1);
    }

    // Update hash (will trigger hashchange event)
    window.location.hash = '#' + path;
  }

  /**
   * Generate a path from a route name and params
   * @param {string} name - Route name
   * @param {object} params - Route parameters
   * @returns {string} Generated path
   */
  function generatePath(name, params = {}) {
    const route = routes.find(r => r.name === name);

    if (!route) {
      console.error(`Route not found: ${name}`);
      return '';
    }

    let path = route.pattern;

    // Replace params in pattern
    Object.keys(params).forEach(key => {
      path = path.replace(`:${key}`, encodeURIComponent(params[key]));
    });

    return path;
  }

  /**
   * Navigate using route name and params
   * @param {string} name - Route name
   * @param {object} params - Route parameters
   */
  function navigateToRoute(name, params = {}) {
    const path = generatePath(name, params);
    navigate(path);
  }

  /**
   * Go back in history
   */
  function goBack() {
    window.history.back();
  }

  /**
   * Get current route
   * @returns {object|null} Current route object
   */
  function getCurrentRoute() {
    return currentRoute;
  }

  // Public API
  return {
    init,
    navigate,
    navigateToRoute,
    generatePath,
    goBack,
    getCurrentRoute
  };
})();
