/**
 * Application Configuration
 * Constants and configuration values used throughout the app
 */

const Config = (function() {
  'use strict';

  // Application version (for data migration)
  const APP_VERSION = '1.0.0';

  // localStorage keys
  const STORAGE_KEYS = {
    MACHINES: 'coffee_tracker_machines',
    BEANS: 'coffee_tracker_beans',
    RUNS: 'coffee_tracker_runs',
    VERSION: 'coffee_tracker_version',
    BACKUP_REMINDER_DISMISSED: 'coffee_tracker_backup_reminder_dismissed'
  };

  // localStorage key prefix for app data
  const STORAGE_PREFIX = 'coffee_tracker_';

  // Parameter types for coffee machine configurations
  const PARAMETER_TYPES = {
    NUMBER: 'number',
    SLIDER: 'slider',
    TEXT: 'text',
    DROPDOWN: 'dropdown'
  };

  // Validation constraints
  const VALIDATION = {
    MACHINE_NAME_MIN_LENGTH: 1,
    MACHINE_NAME_MAX_LENGTH: 50,
    BEAN_NAME_MIN_LENGTH: 1,
    BEAN_NAME_MAX_LENGTH: 50,
    PARAMETER_NAME_MIN_LENGTH: 1,
    PARAMETER_NAME_MAX_LENGTH: 30,
    NOTES_MAX_LENGTH: 500,
    RATING_MIN: 1,
    RATING_MAX: 10,
    SLIDER_DEFAULT_MIN: 0,
    SLIDER_DEFAULT_MAX: 100,
    SLIDER_DEFAULT_STEP: 1
  };

  // UI Configuration
  const UI = {
    RECENT_RUNS_LIMIT: 5,          // Number of recent runs to show on dashboard
    DEFAULT_PAGE_SIZE: 20,          // Items per page for lists
    DEBOUNCE_DELAY: 300,            // Debounce delay for input (ms)
    ANIMATION_DURATION: 200,        // CSS animation duration (ms)
    TOAST_DURATION: 3000            // Toast notification duration (ms)
  };

  // Route paths
  const ROUTES = {
    HOME: '',
    MACHINES: 'machines',
    MACHINES_NEW: 'machines/new',
    MACHINE_DETAIL: 'machines/:id',
    BEANS: 'beans',
    BEANS_NEW: 'beans/new',
    BEAN_DETAIL: 'beans/:id',
    RUN_LIST: 'beans/:beanId/machines/:machineId',
    RUN_NEW: 'beans/:beanId/machines/:machineId/run/new',
    RUN_DETAIL: 'beans/:beanId/machines/:machineId/run/:runId'
  };

  // Error messages
  const ERRORS = {
    STORAGE_NOT_AVAILABLE: 'localStorage is not available. Please enable cookies and try again.',
    STORAGE_QUOTA_EXCEEDED: 'Storage limit reached. Please delete some old data or export your data to free up space.',
    INVALID_DATA: 'The data appears to be corrupted. Please try refreshing the page.',
    MACHINE_NOT_FOUND: 'Coffee machine not found.',
    BEAN_NOT_FOUND: 'Coffee bean not found.',
    RUN_NOT_FOUND: 'Run not found.',
    CANNOT_DELETE_MACHINE: 'Cannot delete this machine because it has associated runs.',
    CANNOT_DELETE_BEAN: 'Cannot delete this bean because it has associated runs.',
    REQUIRED_FIELD: 'This field is required.',
    INVALID_DATE: 'Please enter a valid date.',
    INVALID_RATING: 'Rating must be between 1 and 10.',
    INVALID_NUMBER: 'Please enter a valid number.',
    INVALID_SLIDER_RANGE: 'Maximum value must be greater than minimum value.'
  };

  // Success messages - now using I18n
  const MESSAGES = {
    get MACHINE_CREATED() { return I18n.t('machineCreated'); },
    get MACHINE_UPDATED() { return I18n.t('machineUpdated'); },
    get MACHINE_DELETED() { return I18n.t('machineDeleted'); },
    get BEAN_CREATED() { return I18n.t('beanCreated'); },
    get BEAN_UPDATED() { return I18n.t('beanUpdated'); },
    get BEAN_DELETED() { return I18n.t('beanDeleted'); },
    get RUN_CREATED() { return I18n.t('runCreated'); },
    get RUN_UPDATED() { return I18n.t('runUpdated'); },
    get RUN_DELETED() { return I18n.t('runDeleted'); },
    get DATA_EXPORTED() { return I18n.t('dataExported'); },
    get DATA_IMPORTED() { return I18n.t('dataImported'); }
  };

  // Empty state messages - now using I18n
  const EMPTY_STATES = {
    NO_MACHINES: {
      get title() { return I18n.t('noCoffeeMachines'); },
      get message() { return I18n.t('noMachinesMessage'); },
      get action() { return I18n.t('addMachine'); }
    },
    NO_BEANS: {
      get title() { return I18n.t('noCoffeeBeans'); },
      get message() { return I18n.t('noBeansMessage'); },
      get action() { return I18n.t('addBean'); }
    },
    NO_RUNS: {
      get title() { return I18n.t('noRuns'); },
      get message() { return I18n.t('noRunsMessage'); },
      get action() { return I18n.t('createRun'); }
    },
    NO_RECENT_ACTIVITY: {
      get title() { return I18n.t('recentActivity'); },
      message: '',
      action: null
    }
  };

  // Bean freshness indicators (days)
  const BEAN_FRESHNESS = {
    FRESH: 14,        // 0-14 days: Fresh
    GOOD: 30,         // 15-30 days: Good
    AGING: 60,        // 31-60 days: Aging
    OLD: Infinity     // 60+ days: Old
  };

  // Rating display configuration
  const RATING = {
    MIN: 1,
    MAX: 10,
    COLORS: {
      LOW: '#C44536',      // Red (1-3)
      MEDIUM: '#E8A537',   // Orange (4-6)
      HIGH: '#D4A574',     // Gold (7-8)
      EXCELLENT: '#7A9F5A' // Green (9-10)
    }
  };

  // Default parameter configurations for new machines
  const DEFAULT_PARAMETERS = {
    ESPRESSO: [
      { name: 'Grind Size', type: 'slider', config: { min: 1, max: 20, step: 0.5, default: 10 } },
      { name: 'Temperature (°C)', type: 'number', config: { default: 92 } },
      { name: 'Pressure (bar)', type: 'number', config: { default: 9 } },
      { name: 'Dose (g)', type: 'number', config: { default: 18 } }
    ],
    POUR_OVER: [
      { name: 'Grind Size', type: 'slider', config: { min: 1, max: 20, step: 0.5, default: 12 } },
      { name: 'Water Temp (°C)', type: 'number', config: { default: 96 } },
      { name: 'Coffee (g)', type: 'number', config: { default: 15 } },
      { name: 'Water (ml)', type: 'number', config: { default: 250 } },
      { name: 'Bloom Time (s)', type: 'number', config: { default: 30 } }
    ],
    FRENCH_PRESS: [
      { name: 'Grind Size', type: 'slider', config: { min: 1, max: 20, step: 0.5, default: 15 } },
      { name: 'Coffee (g)', type: 'number', config: { default: 30 } },
      { name: 'Water (ml)', type: 'number', config: { default: 500 } },
      { name: 'Steep Time (min)', type: 'number', config: { default: 4 } }
    ]
  };

  // Public API
  return {
    APP_VERSION,
    STORAGE_KEYS,
    STORAGE_PREFIX,
    PARAMETER_TYPES,
    VALIDATION,
    UI,
    ROUTES,
    ERRORS,
    MESSAGES,
    EMPTY_STATES,
    BEAN_FRESHNESS,
    RATING,
    DEFAULT_PARAMETERS
  };
})();
