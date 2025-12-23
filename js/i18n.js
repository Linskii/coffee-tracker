/**
 * Internationalization (i18n)
 * Manages translations and language switching
 */

const I18n = (function() {
  'use strict';

  // Supported languages
  const LANGUAGES = {
    EN: 'en',
    DE: 'de'
  };

  // Language metadata with emoji flags
  const LANGUAGE_INFO = {
    en: { name: 'English', flag: '🇬🇧' },
    de: { name: 'Deutsch', flag: '🇩🇪' }
  };

  // Current language (default to English)
  let currentLanguage = LANGUAGES.EN;

  // Translation strings organized by language
  const translations = {
    en: {
      // App title
      appTitle: 'Coffee Tracker',

      // Navigation
      beans: 'Beans',
      machines: 'Machines',

      // Common actions
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      create: 'Create',
      update: 'Update',
      remove: 'Remove',

      // Dashboard
      welcomeTitle: 'Welcome to Coffee Tracker!',
      welcomeMessage: 'Start by creating your first coffee machine, then add beans to track your perfect brew.',
      coffeeMachines: 'Coffee Machines',
      coffeeBeans: 'Coffee Beans',
      totalRuns: 'Total Runs',
      recentActivity: 'Recent Activity',
      dataManagement: 'Data Management',

      // Actions
      addMachine: 'Add Machine',
      addBean: 'Add Bean',
      viewBeans: 'View Beans',
      viewMachines: 'View Machines',
      createMachine: 'Create Coffee Machine',
      updateMachine: 'Update Coffee Machine',
      createBean: 'Create Bean',
      updateBean: 'Update Bean',
      newRun: 'New Run',

      // Machine related
      machineName: 'Machine Name',
      machineNamePlaceholder: 'e.g., Espresso Machine',
      newCoffeeMachine: 'New Coffee Machine',
      editCoffeeMachine: 'Edit Coffee Machine',
      noCoffeeMachines: 'No Coffee Machines',
      noMachinesMessage: 'Create your first coffee machine to get started tracking your perfect brew.',
      parameters: 'Parameters',
      parameter: 'parameter',
      parameters_plural: 'parameters',
      addParameter: '+ Add Parameter',
      noParametersMessage: 'No parameters yet. Add parameters to track brewing settings.',
      parameterName: 'Name',
      parameterNamePlaceholder: 'e.g., Grind Size',
      parameterType: 'Type',

      // Parameter types
      paramTypeNumber: 'Number',
      paramTypeSlider: 'Slider',
      paramTypeText: 'Text',
      paramTypeDropdown: 'Dropdown',
      min: 'Min',
      max: 'Max',
      step: 'Step',
      options: 'Options (one per line)',
      optionsPlaceholder: 'Fine\nMedium\nCoarse',

      // Bean related
      beanName: 'Bean Name',
      beanNamePlaceholder: 'e.g., Ethiopian Yirgacheffe',
      newCoffeeBean: 'New Coffee Bean',
      editCoffeeBean: 'Edit Coffee Bean',
      noCoffeeBeans: 'No Coffee Beans',
      noBeansMessage: 'Add your first coffee bean to start tracking different brews.',
      purchaseDate: 'Purchase Date',
      purchased: 'Purchased',
      notes: 'Notes (Optional)',
      notesPlaceholder: 'e.g., Fruity notes, light roast',

      // Bean freshness
      fresh: 'Fresh',
      good: 'Good',
      aging: 'Aging',
      old: 'Old',
      daysAgo: 'days ago',

      // Run related
      run: 'run',
      runs_plural: 'runs',
      noRuns: 'No Runs Yet',
      noRunsMessage: 'Create your first run to track settings and ratings for this bean and machine combination.',
      createRun: 'Create Run',
      newRunTitle: 'New Run',
      editRunTitle: 'Edit Run',
      saveRun: 'Save Run',
      updateRun: 'Update Run',
      rating: 'Rating',
      selectCoffeeMachine: 'Select Coffee Machine',

      // Data management
      exportData: 'Export Data',
      importReplace: 'Import (Replace)',
      importMerge: 'Import (Merge)',
      storage: 'Storage',

      // Messages
      machineCreated: 'Coffee machine created successfully!',
      machineUpdated: 'Coffee machine updated successfully!',
      machineDeleted: 'Coffee machine deleted successfully!',
      beanCreated: 'Coffee bean added successfully!',
      beanUpdated: 'Coffee bean updated successfully!',
      beanDeleted: 'Coffee bean deleted successfully!',
      runCreated: 'Run saved successfully!',
      runUpdated: 'Run updated successfully!',
      runDeleted: 'Run deleted successfully!',
      dataExported: 'Data exported successfully!',
      dataImported: 'Data imported successfully!',

      // Confirmations
      confirmDeleteBean: 'Are you sure you want to delete this bean?',
      confirmDeleteBeanWithRuns: 'Are you sure you want to delete this bean? This will also delete {count} run(s) associated with it. This cannot be undone.',
      confirmDeleteMachine: 'Are you sure you want to delete this machine?',
      confirmDeleteMachineWithRuns: 'Are you sure you want to delete this machine? This will also delete {count} run(s) associated with it. This cannot be undone.',
      confirmDeleteRun: 'Are you sure you want to delete this run?',
      confirmImportReplace: 'This will replace all your current data with the imported data. Are you sure?',

      // Star toggle
      star: 'Star as best',
      unstar: 'Unstar',

      // Backup reminder
      backupReminderTitle: 'New Favorite Setting Found!',
      backupReminderMessage: 'Seems like you have found a new favorite setting for your machine. Remember to occasionally backup your data, as it\'s only stored in your browser.',
      backupReminderCheckbox: 'Don\'t show this message again',
      backupReminderOk: 'Got it',

      // Bayesian Optimization / AI Suggestions
      aiSuggested: 'AI Suggested',
      aiSuggestionReady: 'Ready to try',
      aiSuggestionNeedsData: 'Needs more data',
      aiSuggestionNeedsDataMessage: 'Need at least {minRuns} rated runs for AI suggestions',
      showAnyway: 'Show Anyway',
      makeThisRun: 'Make This Run',
      aiOptimizationSettings: 'AI Optimization Settings',
      minRunsThreshold: 'Minimum Runs for AI',
      minRunsThresholdHelp: 'Number of rated runs required before showing AI suggestions',
      explorationFactor: 'Exploration Factor',
      explorationFactorHelp: 'Higher values encourage trying new settings (1.0-3.0)',
      boSettingsSaved: 'AI optimization settings saved'
    },

    de: {
      // App title
      appTitle: 'Kaffee Tracker',

      // Navigation
      beans: 'Bohnen',
      machines: 'Maschinen',

      // Common actions
      add: 'Hinzufügen',
      edit: 'Bearbeiten',
      delete: 'Löschen',
      save: 'Speichern',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      create: 'Erstellen',
      update: 'Aktualisieren',
      remove: 'Entfernen',

      // Dashboard
      welcomeTitle: 'Willkommen beim Kaffee Tracker!',
      welcomeMessage: 'Beginnen Sie mit der Erstellung Ihrer ersten Kaffeemaschine und fügen Sie dann Bohnen hinzu, um Ihre perfekte Brühung zu verfolgen.',
      coffeeMachines: 'Kaffeemaschinen',
      coffeeBeans: 'Kaffeebohnen',
      totalRuns: 'Brühungen gesamt',
      recentActivity: 'Letzte Aktivitäten',
      dataManagement: 'Datenverwaltung',

      // Actions
      addMachine: 'Maschine hinzufügen',
      addBean: 'Bohne hinzufügen',
      viewBeans: 'Bohnen ansehen',
      viewMachines: 'Maschinen ansehen',
      createMachine: 'Kaffeemaschine erstellen',
      updateMachine: 'Kaffeemaschine aktualisieren',
      createBean: 'Bohne erstellen',
      updateBean: 'Bohne aktualisieren',
      newRun: 'Neue Brühung',

      // Machine related
      machineName: 'Maschinenname',
      machineNamePlaceholder: 'z.B. Espressomaschine',
      newCoffeeMachine: 'Neue Kaffeemaschine',
      editCoffeeMachine: 'Kaffeemaschine bearbeiten',
      noCoffeeMachines: 'Keine Kaffeemaschinen',
      noMachinesMessage: 'Erstellen Sie Ihre erste Kaffeemaschine, um mit der Verfolgung Ihrer perfekten Brühung zu beginnen.',
      parameters: 'Parameter',
      parameter: 'Parameter',
      parameters_plural: 'Parameter',
      addParameter: '+ Parameter hinzufügen',
      noParametersMessage: 'Noch keine Parameter. Fügen Sie Parameter hinzu, um Brüheinstellungen zu verfolgen.',
      parameterName: 'Name',
      parameterNamePlaceholder: 'z.B. Mahlgrad',
      parameterType: 'Typ',

      // Parameter types
      paramTypeNumber: 'Zahl',
      paramTypeSlider: 'Schieberegler',
      paramTypeText: 'Text',
      paramTypeDropdown: 'Dropdown',
      min: 'Min',
      max: 'Max',
      step: 'Schritt',
      options: 'Optionen (eine pro Zeile)',
      optionsPlaceholder: 'Fein\nMittel\nGrob',

      // Bean related
      beanName: 'Bohnenname',
      beanNamePlaceholder: 'z.B. Äthiopischer Yirgacheffe',
      newCoffeeBean: 'Neue Kaffeebohne',
      editCoffeeBean: 'Kaffeebohne bearbeiten',
      noCoffeeBeans: 'Keine Kaffeebohnen',
      noBeansMessage: 'Fügen Sie Ihre erste Kaffeebohne hinzu, um verschiedene Brühungen zu verfolgen.',
      purchaseDate: 'Kaufdatum',
      purchased: 'Gekauft',
      notes: 'Notizen (Optional)',
      notesPlaceholder: 'z.B. Fruchtige Noten, helle Röstung',

      // Bean freshness
      fresh: 'Frisch',
      good: 'Gut',
      aging: 'Alternd',
      old: 'Alt',
      daysAgo: 'Tage her',

      // Run related
      run: 'Brühung',
      runs_plural: 'Brühungen',
      noRuns: 'Noch keine Brühungen',
      noRunsMessage: 'Erstellen Sie Ihre erste Brühung, um Einstellungen und Bewertungen für diese Bohnen-Maschinen-Kombination zu verfolgen.',
      createRun: 'Brühung erstellen',
      newRunTitle: 'Neue Brühung',
      editRunTitle: 'Brühung bearbeiten',
      saveRun: 'Brühung speichern',
      updateRun: 'Brühung aktualisieren',
      rating: 'Bewertung',
      selectCoffeeMachine: 'Kaffeemaschine auswählen',

      // Data management
      exportData: 'Daten exportieren',
      importReplace: 'Importieren (Ersetzen)',
      importMerge: 'Importieren (Zusammenführen)',
      storage: 'Speicher',

      // Messages
      machineCreated: 'Kaffeemaschine erfolgreich erstellt!',
      machineUpdated: 'Kaffeemaschine erfolgreich aktualisiert!',
      machineDeleted: 'Kaffeemaschine erfolgreich gelöscht!',
      beanCreated: 'Kaffeebohne erfolgreich hinzugefügt!',
      beanUpdated: 'Kaffeebohne erfolgreich aktualisiert!',
      beanDeleted: 'Kaffeebohne erfolgreich gelöscht!',
      runCreated: 'Brühung erfolgreich gespeichert!',
      runUpdated: 'Brühung erfolgreich aktualisiert!',
      runDeleted: 'Brühung erfolgreich gelöscht!',
      dataExported: 'Daten erfolgreich exportiert!',
      dataImported: 'Daten erfolgreich importiert!',

      // Confirmations
      confirmDeleteBean: 'Möchten Sie diese Bohne wirklich löschen?',
      confirmDeleteBeanWithRuns: 'Möchten Sie diese Bohne wirklich löschen? Dies löscht auch {count} zugehörige Brühung(en). Dies kann nicht rückgängig gemacht werden.',
      confirmDeleteMachine: 'Möchten Sie diese Maschine wirklich löschen?',
      confirmDeleteMachineWithRuns: 'Möchten Sie diese Maschine wirklich löschen? Dies löscht auch {count} zugehörige Brühung(en). Dies kann nicht rückgängig gemacht werden.',
      confirmDeleteRun: 'Möchten Sie diese Brühung wirklich löschen?',
      confirmImportReplace: 'Dies ersetzt alle Ihre aktuellen Daten durch die importierten Daten. Sind Sie sicher?',

      // Star toggle
      star: 'Als beste markieren',
      unstar: 'Markierung entfernen',

      // Backup reminder
      backupReminderTitle: 'Neue Lieblingseinstellung gefunden!',
      backupReminderMessage: 'Anscheinend haben Sie eine neue Lieblingseinstellung für Ihre Maschine gefunden. Denken Sie daran, Ihre Daten gelegentlich zu sichern, da sie nur in Ihrem Browser gespeichert werden.',
      backupReminderCheckbox: 'Diese Meldung nicht mehr anzeigen',
      backupReminderOk: 'Verstanden',

      // Bayesian Optimization / AI Suggestions
      aiSuggested: 'KI-Vorschlag',
      aiSuggestionReady: 'Bereit zum Ausprobieren',
      aiSuggestionNeedsData: 'Benötigt mehr Daten',
      aiSuggestionNeedsDataMessage: 'Mindestens {minRuns} bewertete Brühungen für KI-Vorschläge erforderlich',
      showAnyway: 'Trotzdem anzeigen',
      makeThisRun: 'Diese Brühung durchführen',
      aiOptimizationSettings: 'KI-Optimierungseinstellungen',
      minRunsThreshold: 'Minimale Brühungen für KI',
      minRunsThresholdHelp: 'Anzahl bewerteter Brühungen, die für KI-Vorschläge erforderlich sind',
      explorationFactor: 'Erkundungsfaktor',
      explorationFactorHelp: 'Höhere Werte fördern das Ausprobieren neuer Einstellungen (1.0-3.0)',
      boSettingsSaved: 'KI-Optimierungseinstellungen gespeichert'
    }
  };

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @param {object} params - Parameters for string interpolation
   * @returns {string} Translated text
   */
  function t(key, params = {}) {
    let text = translations[currentLanguage][key] || translations[LANGUAGES.EN][key] || key;

    // Simple string interpolation
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });

    return text;
  }

  /**
   * Set current language
   * @param {string} lang - Language code
   */
  function setLanguage(lang) {
    if (translations[lang]) {
      currentLanguage = lang;
      // Save to localStorage
      try {
        localStorage.setItem('coffee_tracker_language', lang);
      } catch (e) {
        console.warn('Could not save language preference:', e);
      }
    }
  }

  /**
   * Get current language
   * @returns {string} Current language code
   */
  function getLanguage() {
    return currentLanguage;
  }

  /**
   * Get all available languages
   * @returns {object} Language info object
   */
  function getLanguages() {
    return LANGUAGE_INFO;
  }

  /**
   * Initialize i18n - load saved language preference
   */
  function init() {
    try {
      const savedLang = localStorage.getItem('coffee_tracker_language');
      if (savedLang && translations[savedLang]) {
        currentLanguage = savedLang;
      }
    } catch (e) {
      console.warn('Could not load language preference:', e);
    }
  }

  // Public API
  return {
    LANGUAGES,
    t,
    setLanguage,
    getLanguage,
    getLanguages,
    init
  };
})();
