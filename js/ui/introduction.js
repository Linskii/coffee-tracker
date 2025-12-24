/**
 * Introduction/Tutorial Module
 * Shows step-by-step introduction images for new users
 */

const Introduction = (function() {
  'use strict';

  const TOTAL_STEPS = 9;
  const INTRO_SEEN_KEY = 'coffee_tracker_intro_seen';

  /**
   * Check if user has seen the introduction
   * @returns {boolean} True if introduction has been seen
   */
  function hasSeenIntro() {
    return Storage.get(INTRO_SEEN_KEY, false);
  }

  /**
   * Mark introduction as seen
   */
  function markIntroAsSeen() {
    Storage.set(INTRO_SEEN_KEY, true);
  }

  /**
   * Check if this is a first-time visitor
   * @returns {boolean} True if localStorage has no modifications (first visit)
   */
  function isFirstTimeVisitor() {
    // Check if there are any machines, beans, or runs in storage
    const machines = Storage.get('coffee_tracker_machines', []);
    const beans = Storage.get('coffee_tracker_beans', []);
    const runs = Storage.get('coffee_tracker_runs', []);

    return machines.length === 0 && beans.length === 0 && runs.length === 0;
  }

  /**
   * Get the image path for a specific step
   * @param {number} stepNumber - Step number (1-9)
   * @returns {string} Image path
   */
  function getImagePath(stepNumber) {
    const lang = I18n.getLanguage();
    const prefix = lang === 'de' ? 'de' : 'engl';

    // Map step numbers to image file names
    const imageMap = {
      1: `${prefix}_1_new_coffee_machine.jpg`,
      2: `${prefix}_2_new_coffee_bean.jpg`,
      3: `${prefix}_3_bean_selection.jpg`,
      4: `${prefix}_4_machine_selection.jpg`,
      5: `${prefix}_5_create_brew.jpg`,
      6: `${prefix}_6_ai_more_data.jpg`,
      7: `${prefix}_7_ai_suggestion.jpg`,
      8: `${prefix}_8_visualization_showcase.jpg`,
      9: `${prefix}_9_settings.jpg`
    };

    return `introduction_images/${imageMap[stepNumber]}`;
  }

  /**
   * Create a step container with image
   * @param {number} stepNumber - Step number (1-9)
   * @returns {HTMLElement} Step container element
   */
  function createStepContainer(stepNumber) {
    const container = document.createElement('div');
    container.className = 'intro-step';

    const stepLabel = document.createElement('div');
    stepLabel.className = 'intro-step-label';
    stepLabel.textContent = `${I18n.t('introStep')} ${stepNumber}`;
    container.appendChild(stepLabel);

    const stepTitle = document.createElement('div');
    stepTitle.className = 'intro-step-title';
    stepTitle.textContent = I18n.t(`introStep${stepNumber}Title`);
    container.appendChild(stepTitle);

    const imageContainer = document.createElement('div');
    imageContainer.className = 'intro-image-container';

    const image = document.createElement('img');
    image.src = getImagePath(stepNumber);
    image.alt = `${I18n.t('introStep')} ${stepNumber}`;
    image.className = 'intro-image';
    imageContainer.appendChild(image);

    container.appendChild(imageContainer);

    return container;
  }

  /**
   * Create a language selector for the intro overlay
   * @returns {HTMLElement} Language selector element
   */
  function createIntroLanguageSelector() {
    const container = document.createElement('div');
    container.className = 'intro-language-selector';

    const languages = I18n.getLanguages();
    const currentLang = I18n.getLanguage();

    Object.keys(languages).forEach(langCode => {
      const langInfo = languages[langCode];
      const langBtn = document.createElement('button');
      langBtn.className = 'language-btn' + (currentLang === langCode ? ' active' : '');
      langBtn.textContent = langInfo.flag;
      langBtn.title = langInfo.name;

      langBtn.addEventListener('click', () => {
        // Update language
        I18n.setLanguage(langCode);
        AppState.setLanguage(langCode);

        // Close and reopen intro with new language
        hideIntro();
        setTimeout(() => {
          showIntro(true);
        }, 100);
      });

      container.appendChild(langBtn);
    });

    return container;
  }

  /**
   * Create the introduction overlay container
   * @param {boolean} includeCreateButton - Whether to include "Create Machine" button at bottom
   * @returns {HTMLElement} Introduction overlay element
   */
  function createIntroOverlay(includeCreateButton = true) {
    const overlay = document.createElement('div');
    overlay.className = 'intro-overlay';
    overlay.id = 'intro-overlay';

    const content = document.createElement('div');
    content.className = 'intro-content';

    // Close button (only when opened from settings)
    if (!includeCreateButton) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'intro-close-btn';
      closeBtn.innerHTML = '&times;';
      closeBtn.title = I18n.t('closeIntro');
      closeBtn.addEventListener('click', hideIntro);
      content.appendChild(closeBtn);
    }

    // Language selector (only for first-time visitors)
    if (includeCreateButton) {
      const langSelector = createIntroLanguageSelector();
      content.appendChild(langSelector);
    }

    // Steps container
    const stepsContainer = document.createElement('div');
    stepsContainer.className = 'intro-steps-container';

    // Create all steps
    for (let i = 1; i <= TOTAL_STEPS; i++) {
      const stepContainer = createStepContainer(i);
      stepsContainer.appendChild(stepContainer);
    }

    content.appendChild(stepsContainer);

    // Create Machine button at bottom (only for first-time visitors)
    if (includeCreateButton) {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'intro-button-container';

      const readyText = document.createElement('p');
      readyText.className = 'intro-ready-text';
      readyText.textContent = I18n.t('introReadyText');
      buttonContainer.appendChild(readyText);

      const createBtn = Components.button(
        I18n.t('createMachine'),
        () => {
          hideIntro();
          markIntroAsSeen();
          Router.navigate('machines/new');
        },
        'primary',
        'button'
      );
      createBtn.classList.add('btn-lg');

      buttonContainer.appendChild(createBtn);
      content.appendChild(buttonContainer);
    }

    overlay.appendChild(content);

    return overlay;
  }

  /**
   * Show the introduction overlay
   * @param {boolean} includeCreateButton - Whether to include "Create Machine" button
   */
  function showIntro(includeCreateButton = true) {
    // Remove existing intro if any
    hideIntro();

    const overlay = createIntroOverlay(includeCreateButton);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(() => {
      overlay.classList.add('intro-overlay-visible');
    });
  }

  /**
   * Hide the introduction overlay
   */
  function hideIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (overlay) {
      overlay.classList.remove('intro-overlay-visible');
      setTimeout(() => {
        overlay.remove();
      }, 300); // Match CSS transition duration
    }
  }

  /**
   * Show intro if this is first-time visitor
   * Should be called on app initialization
   */
  function showIntroIfFirstVisit() {
    if (isFirstTimeVisitor() && !hasSeenIntro()) {
      // Small delay to let the app initialize
      setTimeout(() => {
        showIntro(true);
      }, 500);
    }
  }

  /**
   * Show intro from settings (without create button)
   */
  function showIntroFromSettings() {
    showIntro(false);
  }

  // Public API
  return {
    showIntroIfFirstVisit,
    showIntroFromSettings,
    hasSeenIntro,
    markIntroAsSeen,
    isFirstTimeVisitor
  };
})();
