/**
 * UI Components
 * Reusable component builders for the application
 */

const Components = (function() {
  'use strict';

  /**
   * Create a button element
   */
  function button(text, onClick, variant = 'primary', type = 'button') {
    const btn = document.createElement('button');
    btn.type = type;
    btn.className = `btn btn-${variant}`;
    btn.textContent = text;

    if (onClick) {
      btn.addEventListener('click', onClick);
    }

    return btn;
  }

  /**
   * Create a text input field with label
   */
  function textInput(name, value, label, placeholder = '', required = false) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label + (required ? ' *' : '');
      labelEl.htmlFor = name;
      group.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.type = 'text';
    input.name = name;
    input.id = name;
    input.className = 'form-input';
    input.value = value || '';
    input.placeholder = placeholder;
    if (required) input.required = true;

    group.appendChild(input);
    return group;
  }

  /**
   * Create a number input field with label
   */
  function numberInput(name, value, label, placeholder = '', min, max, step, required = false) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label + (required ? ' *' : '');
      labelEl.htmlFor = name;
      group.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.type = 'number';
    input.name = name;
    input.id = name;
    input.className = 'form-input';
    input.value = value !== undefined && value !== null ? value : '';
    input.placeholder = placeholder;
    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    if (step !== undefined) input.step = step;
    if (required) input.required = true;

    group.appendChild(input);
    return group;
  }

  /**
   * Create a date input field with label
   */
  function dateInput(name, value, label) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label;
      labelEl.htmlFor = name;
      group.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.type = 'date';
    input.name = name;
    input.id = name;
    input.className = 'form-input';
    input.value = value || Helpers.formatDate(new Date());

    group.appendChild(input);
    return group;
  }

  /**
   * Create a textarea field with label
   */
  function textarea(name, value, label, placeholder = '', rows = 4) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label;
      labelEl.htmlFor = name;
      group.appendChild(labelEl);
    }

    const ta = document.createElement('textarea');
    ta.name = name;
    ta.id = name;
    ta.className = 'form-textarea';
    ta.value = value || '';
    ta.placeholder = placeholder;
    ta.rows = rows;

    group.appendChild(ta);
    return group;
  }

  /**
   * Create a select dropdown with label
   */
  function select(name, options, value, label, required = false) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label + (required ? ' *' : '');
      labelEl.htmlFor = name;
      group.appendChild(labelEl);
    }

    const sel = document.createElement('select');
    sel.name = name;
    sel.id = name;
    sel.className = 'form-select';
    if (required) sel.required = true;

    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = typeof opt === 'object' ? opt.value : opt;
      option.textContent = typeof opt === 'object' ? opt.label : opt;
      if (option.value === value) {
        option.selected = true;
      }
      sel.appendChild(option);
    });

    group.appendChild(sel);
    return group;
  }

  /**
   * Create a slider input with value display
   */
  function slider(name, value, min, max, step, label, required = false) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelRow = document.createElement('div');
    labelRow.className = 'flex justify-between items-center mb-sm';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label m-0';
      labelEl.textContent = label + (required ? ' *' : '');
      labelEl.htmlFor = name;
      labelRow.appendChild(labelEl);
    }

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'text-sm font-medium';
    valueDisplay.textContent = value !== undefined && value !== null ? value : min;
    labelRow.appendChild(valueDisplay);

    group.appendChild(labelRow);

    const input = document.createElement('input');
    input.type = 'range';
    input.name = name;
    input.id = name;
    input.className = 'form-range';
    input.min = min;
    input.max = max;
    input.step = step;
    input.value = value !== undefined && value !== null ? value : min;
    if (required) input.required = true;

    input.addEventListener('input', () => {
      valueDisplay.textContent = input.value;
    });

    group.appendChild(input);
    return group;
  }

  /**
   * Create a rating input (1-10)
   */
  function ratingInput(name, value, label, required = false) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label + (required ? ' *' : '');
      group.appendChild(labelEl);
    }

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'rating';

    // Use a number input that's visually hidden but validates
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'number';
    hiddenInput.name = name;
    hiddenInput.value = value || '';
    hiddenInput.style.position = 'absolute';
    hiddenInput.style.opacity = '0';
    hiddenInput.style.pointerEvents = 'none';
    hiddenInput.style.width = '1px';
    hiddenInput.style.height = '1px';
    hiddenInput.min = '1';
    hiddenInput.max = '10';
    hiddenInput.tabIndex = -1;
    if (required) {
      hiddenInput.required = true;
      hiddenInput.addEventListener('invalid', function() {
        this.setCustomValidity(I18n.t('pleaseSelectRating'));
      });
      hiddenInput.addEventListener('input', function() {
        this.setCustomValidity('');
      });
    }

    for (let i = 1; i <= 10; i++) {
      const star = document.createElement('span');
      star.className = 'rating-star';
      star.textContent = '★';
      star.dataset.value = i;

      if (value && i <= value) {
        star.classList.add('filled');
      }

      star.addEventListener('click', () => {
        hiddenInput.value = i;
        // Clear custom validity when a value is selected
        hiddenInput.setCustomValidity('');
        ratingDiv.querySelectorAll('.rating-star').forEach((s, idx) => {
          s.classList.toggle('filled', idx < i);
        });
      });

      ratingDiv.appendChild(star);
    }

    group.appendChild(ratingDiv);
    group.appendChild(hiddenInput);

    return group;
  }

  /**
   * Create a star toggle button
   */
  function starToggle(starred, onToggle, t) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'star-icon' + (starred ? ' starred' : '');
    btn.textContent = '★';

    // Use translation function if provided, otherwise fallback to English
    if (t) {
      btn.title = starred ? t('unstar') : t('star');
    } else {
      btn.title = starred ? 'Unstar' : 'Star as best';
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (onToggle) {
        onToggle(!starred);
      }
    });

    return btn;
  }

  /**
   * Create a card element
   */
  function card(title, content, footer) {
    const cardEl = document.createElement('div');
    cardEl.className = 'card';

    if (title) {
      const header = document.createElement('div');
      header.className = 'card-header';

      if (typeof title === 'string') {
        const h3 = document.createElement('h3');
        h3.textContent = title;
        header.appendChild(h3);
      } else {
        header.appendChild(title);
      }

      cardEl.appendChild(header);
    }

    if (content) {
      const body = document.createElement('div');
      body.className = 'card-body';

      if (typeof content === 'string') {
        body.innerHTML = content;
      } else {
        body.appendChild(content);
      }

      cardEl.appendChild(body);
    }

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'card-footer';

      if (typeof footer === 'string') {
        footerEl.innerHTML = footer;
      } else {
        footerEl.appendChild(footer);
      }

      cardEl.appendChild(footerEl);
    }

    return cardEl;
  }

  /**
   * Create a modal dialog
   */
  function modal(title, content, actions) {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    const modalEl = document.createElement('div');
    modalEl.className = 'modal';

    const header = document.createElement('div');
    header.className = 'modal-header';
    const titleEl = document.createElement('h3');
    titleEl.className = 'modal-title';
    titleEl.textContent = title;
    header.appendChild(titleEl);
    modalEl.appendChild(header);

    const body = document.createElement('div');
    body.className = 'modal-body';
    if (typeof content === 'string') {
      body.innerHTML = content;
    } else {
      body.appendChild(content);
    }
    modalEl.appendChild(body);

    if (actions) {
      const footer = document.createElement('div');
      footer.className = 'modal-footer';
      actions.forEach(action => footer.appendChild(action));
      modalEl.appendChild(footer);
    }

    backdrop.appendChild(modalEl);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        backdrop.remove();
      }
    });

    return backdrop;
  }

  /**
   * Show a confirmation dialog
   */
  function confirm(message, onConfirm, onCancel) {
    const confirmBtn = button('Confirm', () => {
      if (onConfirm) onConfirm();
      modalEl.remove();
    }, 'danger');

    const cancelBtn = button('Cancel', () => {
      if (onCancel) onCancel();
      modalEl.remove();
    }, 'secondary');

    const modalEl = modal('Confirm', message, [cancelBtn, confirmBtn]);
    document.body.appendChild(modalEl);
  }

  /**
   * Show backup reminder modal with checkbox
   * @param {Function} t - Translation function
   */
  function showBackupReminder(t) {
    // Check if user has dismissed this before
    const dismissed = Storage.get(Config.STORAGE_KEYS.BACKUP_REMINDER_DISMISSED, false);
    if (dismissed) {
      return;
    }

    // Create modal content with checkbox
    const content = document.createElement('div');

    const message = document.createElement('p');
    message.textContent = t('backupReminderMessage');
    message.style.marginBottom = 'var(--spacing-lg)';
    content.appendChild(message);

    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'backup-reminder-checkbox';
    checkbox.className = 'checkbox-input';

    const label = document.createElement('label');
    label.htmlFor = 'backup-reminder-checkbox';
    label.className = 'checkbox-label';
    label.textContent = t('backupReminderCheckbox');

    checkboxContainer.appendChild(checkbox);
    checkboxContainer.appendChild(label);
    content.appendChild(checkboxContainer);

    const okBtn = button(t('backupReminderOk'), () => {
      // Save dismissed state if checkbox is checked
      if (checkbox.checked) {
        Storage.set(Config.STORAGE_KEYS.BACKUP_REMINDER_DISMISSED, true);
      }
      modalEl.remove();
    }, 'primary');

    const modalEl = modal(t('backupReminderTitle'), content, [okBtn]);
    document.body.appendChild(modalEl);
  }

  /**
   * Create an alert/toast notification
   */
  function alert(message, type = 'info') {
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type}`;
    alertEl.textContent = message;
    return alertEl;
  }

  /**
   * Create an empty state component
   */
  function emptyState(config) {
    const container = document.createElement('div');
    container.className = 'empty-state';

    if (config.icon) {
      const icon = document.createElement('div');
      icon.className = 'empty-state-icon';
      icon.textContent = config.icon;
      container.appendChild(icon);
    }

    const title = document.createElement('h3');
    title.className = 'empty-state-title';
    title.textContent = config.title;
    container.appendChild(title);

    if (config.message) {
      const message = document.createElement('p');
      message.className = 'empty-state-message';
      message.textContent = config.message;
      container.appendChild(message);
    }

    if (config.action && config.actionText) {
      const btn = button(config.actionText, config.action, 'primary');
      container.appendChild(btn);
    }

    return container;
  }

  /**
   * Create a badge
   */
  function badge(text, type = 'info') {
    const badgeEl = document.createElement('span');
    badgeEl.className = `badge badge-${type}`;
    badgeEl.textContent = text;
    return badgeEl;
  }

  /**
   * Create a loading spinner
   */
  function spinner() {
    const spinnerEl = document.createElement('div');
    spinnerEl.className = 'spinner';
    return spinnerEl;
  }

  /**
   * Create a dynamic parameter input based on type
   */
  function parameterInput(parameter, value) {
    switch (parameter.type) {
      case Config.PARAMETER_TYPES.SLIDER:
        return slider(
          `param_${parameter.id}`,
          value !== undefined ? value : parameter.config.default,
          parameter.config.min,
          parameter.config.max,
          parameter.config.step,
          parameter.name,
          true // required
        );

      case Config.PARAMETER_TYPES.NUMBER:
        return numberInput(
          `param_${parameter.id}`,
          value !== undefined ? value : parameter.config.default,
          parameter.name,
          '', // placeholder
          undefined, // min
          undefined, // max
          undefined, // step
          true // required
        );

      case Config.PARAMETER_TYPES.DROPDOWN:
        return select(
          `param_${parameter.id}`,
          parameter.config.options,
          value !== undefined ? value : parameter.config.default,
          parameter.name,
          true // required
        );

      case Config.PARAMETER_TYPES.TEXT:
      default:
        return textInput(
          `param_${parameter.id}`,
          value !== undefined ? value : parameter.config.default,
          parameter.name,
          '', // placeholder
          true // required
        );
    }
  }

  /**
   * Create a language switcher component (for header - compact)
   */
  function languageSwitcher() {
    const container = document.createElement('div');
    container.className = 'language-switcher';

    const languages = I18n.getLanguages();
    const currentLang = I18n.getLanguage();

    Object.keys(languages).forEach(langCode => {
      const langInfo = languages[langCode];
      const langBtn = document.createElement('button');
      langBtn.type = 'button';
      langBtn.className = 'language-btn' + (currentLang === langCode ? ' active' : '');
      langBtn.textContent = langInfo.flag;
      langBtn.title = langInfo.name;

      langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        AppState.setLanguage(langCode);

        // Update active state on all language buttons
        container.querySelectorAll('.language-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        langBtn.classList.add('active');

        // Force re-render by navigating to current route
        const state = AppState.getState();
        Router.navigate(state.currentRoute || '');
      });

      container.appendChild(langBtn);
    });

    return container;
  }

  /**
   * Create a language selector section for settings page
   */
  function languageSelector() {
    const t = (key) => I18n.t(key);
    const container = document.createElement('div');
    container.className = 'language-selector';

    const languages = I18n.getLanguages();
    const currentLang = I18n.getLanguage();

    Object.keys(languages).forEach(langCode => {
      const langInfo = languages[langCode];
      const langOption = document.createElement('div');
      langOption.className = 'language-option' + (currentLang === langCode ? ' active' : '');

      const flag = document.createElement('span');
      flag.className = 'language-flag';
      flag.textContent = langInfo.flag;

      const name = document.createElement('span');
      name.className = 'language-name';
      name.textContent = langInfo.name;

      langOption.appendChild(flag);
      langOption.appendChild(name);

      langOption.addEventListener('click', () => {
        AppState.setLanguage(langCode);

        // Update active state
        container.querySelectorAll('.language-option').forEach(opt => {
          opt.classList.remove('active');
        });
        langOption.classList.add('active');

        // Force re-render
        const state = AppState.getState();
        Router.navigate(state.currentRoute || '');
      });

      container.appendChild(langOption);
    });

    return container;
  }

  /**
   * AI Suggestion Card Component
   * Displays Bayesian Optimization parameter suggestions
   *
   * @param {object} suggestion - Suggested run object
   * @param {object} bean - Bean object
   * @param {object} machine - Machine object
   * @param {boolean} isReady - Whether BO has enough data
   * @param {number} threshold - Minimum runs threshold
   * @returns {HTMLElement} AI suggestion card element
   */
  function aiSuggestionCard(suggestion, bean, machine, isReady, threshold, currentCount = 0) {
    const t = (key, params) => I18n.t(key, params);

    const card = document.createElement('div');
    card.className = `ai-suggestion-card ${!isReady ? 'blurred' : ''}`;

    // Header with badge and status
    const header = document.createElement('div');
    header.className = 'ai-suggestion-header';

    const badge = document.createElement('div');
    badge.className = 'ai-badge';
    badge.textContent = `✨ ${t('aiSuggested')}`;

    const status = document.createElement('div');
    status.className = 'ai-status';
    status.textContent = isReady ? t('aiSuggestionReady') : t('aiSuggestionNeedsData');

    header.appendChild(badge);
    header.appendChild(status);
    card.appendChild(header);

    // Parameters section
    const paramsDiv = document.createElement('div');
    paramsDiv.className = 'ai-suggestion-params';

    machine.parameters.forEach(param => {
      const value = suggestion.parameterValues[param.id];
      if (value !== undefined && value !== null && value !== '') {
        const paramRow = document.createElement('div');
        paramRow.className = 'param-row';

        const paramName = document.createElement('span');
        paramName.className = 'param-name';
        paramName.textContent = `${Helpers.escapeHTML(param.name)}:`;

        const paramValue = document.createElement('span');
        paramValue.className = 'param-value';
        paramValue.textContent = Helpers.escapeHTML(String(value));

        paramRow.appendChild(paramName);
        paramRow.appendChild(paramValue);
        paramsDiv.appendChild(paramRow);
      }
    });

    card.appendChild(paramsDiv);

    // Expected rating section (if available)
    if (suggestion.expectedRating !== null && suggestion.expectedRating !== undefined) {
      const expectedDiv = document.createElement('div');
      expectedDiv.className = 'ai-expected-rating';

      const expectedLabel = document.createElement('div');
      expectedLabel.className = 'expected-label';
      expectedLabel.textContent = t('expectedRating');

      const ratingValue = suggestion.expectedRating;
      const stddev = suggestion.expectedStddev || 0;
      const lowerBound = Math.max(1, ratingValue - stddev);
      const upperBound = Math.min(10, ratingValue + stddev);

      const ratingDisplay = document.createElement('div');
      ratingDisplay.className = 'expected-rating-value';

      // Display format: "7.5 ± 1.2" or "7.5 (6.3-8.7)"
      const ratingText = document.createElement('span');
      ratingText.className = 'rating-mean';
      ratingText.textContent = ratingValue.toFixed(1);

      const varianceText = document.createElement('span');
      varianceText.className = 'rating-variance';
      varianceText.textContent = ` ± ${stddev.toFixed(1)}`;

      const rangeText = document.createElement('span');
      rangeText.className = 'rating-range';
      rangeText.textContent = ` (${lowerBound.toFixed(1)}-${upperBound.toFixed(1)})`;

      ratingDisplay.appendChild(ratingText);
      ratingDisplay.appendChild(varianceText);
      ratingDisplay.appendChild(rangeText);

      expectedDiv.appendChild(expectedLabel);
      expectedDiv.appendChild(ratingDisplay);
      card.appendChild(expectedDiv);
    }

    // Overlay for "needs more data" state
    if (!isReady) {
      const overlay = document.createElement('div');
      overlay.className = 'ai-suggestion-overlay';

      const runsNeeded = threshold - currentCount;

      const title = document.createElement('h3');
      title.className = 'ai-overlay-title';
      title.textContent = t('aiNeedsMoreData');
      overlay.appendChild(title);

      const message = document.createElement('p');
      message.className = 'ai-overlay-message';
      message.textContent = t('aiCollectMoreRuns', {
        current: currentCount,
        needed: runsNeeded,
        total: threshold
      });
      overlay.appendChild(message);

      const showAnywayBtn = button(t('showAnyway'), () => {
        card.classList.remove('blurred');
        overlay.remove();
      }, 'secondary', 'button');

      overlay.appendChild(showAnywayBtn);
      card.appendChild(overlay);
    } else {
      // Actions for ready state
      const actions = document.createElement('div');
      actions.className = 'ai-suggestion-actions';

      const makeRunBtn = button(t('makeThisRun'), () => {
        const serialized = encodeURIComponent(JSON.stringify(suggestion.parameterValues));
        Router.navigate(`beans/${suggestion.beanId}/machines/${suggestion.machineId}/run/new?prefill=${serialized}`);
      }, 'primary', 'button');

      actions.appendChild(makeRunBtn);
      card.appendChild(actions);
    }

    // Add collapsible visualization section (only if ready)
    if (isReady) {
      const vizSection = document.createElement('div');
      vizSection.className = 'ai-viz-section';

      // Expand button
      const expandBtn = document.createElement('button');
      expandBtn.className = 'ai-viz-toggle';
      expandBtn.type = 'button';
      expandBtn.innerHTML = '<span>Show Visualization</span><span class="toggle-icon">▼</span>';

      // Collapsible content
      const vizContent = document.createElement('div');
      vizContent.className = 'ai-viz-content';
      vizContent.style.display = 'none';

      // Create visualization inside
      const visualization = boCurveVisualization(
        suggestion.beanId,
        suggestion.machineId,
        machine,
        suggestion.parameterValues
      );
      vizContent.appendChild(visualization);

      // Collapse button
      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'ai-viz-collapse';
      collapseBtn.type = 'button';
      collapseBtn.innerHTML = '<span class="toggle-icon">▲</span><span>Hide Visualization</span>';

      vizContent.appendChild(collapseBtn);

      // Toggle handlers
      expandBtn.addEventListener('click', () => {
        vizContent.style.display = 'block';
        expandBtn.style.display = 'none';
      });

      collapseBtn.addEventListener('click', () => {
        vizContent.style.display = 'none';
        expandBtn.style.display = 'flex';
      });

      vizSection.appendChild(expandBtn);
      vizSection.appendChild(vizContent);
      card.appendChild(vizSection);
    }

    return card;
  }

  /**
   * BO Curve Visualization Component
   * Interactive plot showing predicted rating vs parameter value
   *
   * @param {string} beanId
   * @param {string} machineId
   * @param {object} machine - Machine object with parameters
   * @param {object} initialValues - {paramId: value} initial slider positions
   * @returns {HTMLElement} Visualization container
   */
  function boCurveVisualization(beanId, machineId, machine, initialValues = {}) {
    const container = document.createElement('div');
    container.className = 'bo-curve-visualization';

    try {
      // Get optimizable parameters
      const optimizableParams = machine.parameters.filter(p =>
        p.type !== Config.PARAMETER_TYPES.TEXT
      );

      if (optimizableParams.length === 0) {
        container.textContent = 'No optimizable parameters';
        return container;
      }

      // State
      const state = {
        activeParamIndex: 0,
        sliderValues: { ...initialValues },
        colors: _generateParameterColors(optimizableParams.length)
      };

      // Ensure all params have initial values
      optimizableParams.forEach((param) => {
        if (state.sliderValues[param.id] === undefined) {
          state.sliderValues[param.id] = _getDefaultValue(param);
        }
      });

      // Canvas for plot
      const canvas = document.createElement('canvas');
      canvas.className = 'bo-curve-canvas';
      canvas.width = 800;
      canvas.height = 400;
      canvas.style.cursor = 'ew-resize';
      container.appendChild(canvas);

      const ctx = canvas.getContext('2d');

      // Parameter buttons container
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'bo-param-buttons';

      const paramButtons = [];

      optimizableParams.forEach((param, idx) => {
        const button = _createParameterButton(
          param,
          idx,
          state.colors[idx],
          state.sliderValues[param.id],
          (selectedIdx) => {
            // Button click handler - switch active parameter
            state.activeParamIndex = selectedIdx;

            // Update button states
            paramButtons.forEach((btn, i) => {
              if (i === selectedIdx) {
                btn.classList.add('active');
              } else {
                btn.classList.remove('active');
              }
            });

            _renderCurve(canvas, ctx, beanId, machineId, machine, state, optimizableParams);
          }
        );

        if (idx === 0) {
          button.classList.add('active');
        }

        paramButtons.push(button);
        buttonsContainer.appendChild(button);
      });

      container.appendChild(buttonsContainer);

      // Add canvas drag interaction
      _addCanvasDragInteraction(
        canvas,
        beanId,
        machineId,
        machine,
        state,
        optimizableParams,
        paramButtons,
        ctx
      );

      // Initial render
      _renderCurve(canvas, ctx, beanId, machineId, machine, state, optimizableParams);

    } catch (error) {
      console.error('BO Visualization Error:', error);
      container.innerHTML = '<p style="color: #666; padding: 1rem;">Unable to load visualization</p>';
    }

    return container;
  }

  /**
   * Create a parameter toggle button
   * @private
   */
  function _createParameterButton(parameter, index, color, initialValue, onClick) {
    const button = document.createElement('button');
    button.className = 'bo-param-button';
    button.type = 'button';
    button.style.borderColor = color;
    button.dataset.paramIndex = index;

    const nameSpan = document.createElement('span');
    nameSpan.className = 'param-name';
    nameSpan.textContent = parameter.name;
    button.appendChild(nameSpan);

    const valueSpan = document.createElement('span');
    valueSpan.className = 'param-value';
    valueSpan.textContent = _formatParameterValue(parameter, initialValue);
    button.appendChild(valueSpan);

    button.addEventListener('click', () => onClick(index));

    return button;
  }

  /**
   * Add drag interaction to canvas for parameter adjustment
   * @private
   */
  function _addCanvasDragInteraction(canvas, beanId, machineId, machine, state, optimizableParams, paramButtons, ctx) {
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    let isDragging = false;

    const updateParameterFromX = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;

      // Convert to canvas coordinates (account for CSS scaling)
      const canvasX = (x / rect.width) * canvas.width;

      // Check if within plot area
      if (canvasX < padding.left || canvasX > canvas.width - padding.right) {
        return;
      }

      const activeParam = optimizableParams[state.activeParamIndex];

      // Get current curve data to map x position to parameter value
      const curveData = BOService.getPredictionCurve(
        beanId,
        machineId,
        state.activeParamIndex,
        {
          numPoints: 100,
          fixedValues: state.sliderValues
        }
      );

      if (!curveData) return;

      const { paramValues } = curveData;
      const xMin = Math.min(...paramValues);
      const xMax = Math.max(...paramValues);
      const plotWidth = canvas.width - padding.left - padding.right;

      // Map canvas X to parameter value
      const normalizedX = (canvasX - padding.left) / plotWidth;
      let paramValue = xMin + normalizedX * (xMax - xMin);

      // Handle dropdown - snap to nearest option
      if (activeParam.type === Config.PARAMETER_TYPES.DROPDOWN) {
        const options = activeParam.config.options;
        const closestIndex = Math.round((paramValue - xMin) / (xMax - xMin) * (options.length - 1));
        paramValue = paramValues[curveData.validIndices[Math.max(0, Math.min(closestIndex, options.length - 1))]];
        state.sliderValues[activeParam.id] = options[Math.max(0, Math.min(closestIndex, options.length - 1))];
      } else {
        // Clamp to valid range
        paramValue = Math.max(xMin, Math.min(xMax, paramValue));
        state.sliderValues[activeParam.id] = paramValue;
      }

      // Update button display
      const activeButton = paramButtons[state.activeParamIndex];
      const valueSpan = activeButton.querySelector('.param-value');
      valueSpan.textContent = _formatParameterValue(activeParam, state.sliderValues[activeParam.id]);

      // Re-render
      _renderCurve(canvas, ctx, beanId, machineId, machine, state, optimizableParams);
    };

    canvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateParameterFromX(e.clientX);
    });

    canvas.addEventListener('mousemove', (e) => {
      if (isDragging) {
        updateParameterFromX(e.clientX);
      }
    });

    canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    // Touch support
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      isDragging = true;
      updateParameterFromX(e.touches[0].clientX);
    });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (isDragging) {
        updateParameterFromX(e.touches[0].clientX);
      }
    });

    canvas.addEventListener('touchend', () => {
      isDragging = false;
    });
  }

  /**
   * Format parameter value for display in button
   * @private
   */
  function _formatParameterValue(parameter, value) {
    if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
      return value || '';
    } else {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      return isNaN(numValue) ? '0' : numValue.toFixed(1);
    }
  }

  /**
   * Format slider value for display
   * @private
   */
  function _formatSliderValue(parameter, rawValue) {
    if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
      const idx = Math.round(parseFloat(rawValue));
      return parameter.config.options[idx] || '';
    } else {
      const numValue = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue);
      return isNaN(numValue) ? '0.00' : numValue.toFixed(2);
    }
  }

  /**
   * Render the BO curve on canvas
   * @private
   */
  function _renderCurve(canvas, ctx, beanId, machineId, machine, state, optimizableParams) {
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Get curve data
    const curveData = BOService.getPredictionCurve(
      beanId,
      machineId,
      state.activeParamIndex,
      {
        numPoints: 100,
        fixedValues: state.sliderValues
      }
    );

    if (!curveData) {
      ctx.fillStyle = '#666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Not enough data for predictions', width / 2, height / 2);
      return;
    }

    const { paramValues, ratings, uncertainties, validIndices } = curveData;

    // Scales
    const xMin = Math.min(...paramValues);
    const xMax = Math.max(...paramValues);
    const yMin = 1;  // Rating always 1-10
    const yMax = 10;

    const xScale = (value) => padding.left + ((value - xMin) / (xMax - xMin)) * plotWidth;
    const yScale = (value) => padding.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();

    // Y-axis labels (ratings 1-10)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    for (let r = 1; r <= 10; r++) {
      const y = yScale(r);
      ctx.fillText(r.toString(), padding.left - 10, y + 4);

      // Grid line - very subtle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // X-axis label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      curveData.parameterName,
      padding.left + plotWidth / 2,
      height - padding.bottom + 40
    );

    // Y-axis label
    ctx.save();
    ctx.translate(20, padding.top + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Score', 0, 0);
    ctx.restore();

    // Draw uncertainty band (±1σ) - subtle white mist
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();

    // Top boundary (mean + 1σ)
    for (let i = 0; i < paramValues.length; i++) {
      const x = xScale(paramValues[i]);
      const y = yScale(Math.min(10, ratings[i] + uncertainties[i]));

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    // Bottom boundary (mean - 1σ) - reverse order
    for (let i = paramValues.length - 1; i >= 0; i--) {
      const x = xScale(paramValues[i]);
      const y = yScale(Math.max(1, ratings[i] - uncertainties[i]));
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();

    // Draw mean curve (Crema Gold)
    const cremaGold = '#dfc160';
    ctx.strokeStyle = cremaGold;
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let i = 0; i < paramValues.length; i++) {
      const x = xScale(paramValues[i]);
      const y = yScale(ratings[i]);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.stroke();

    // Highlight discrete positions for categorical
    if (validIndices) {
      ctx.fillStyle = cremaGold;
      validIndices.forEach(idx => {
        const x = xScale(paramValues[idx]);
        const y = yScale(ratings[idx]);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw actual data points - hollow white rings
    const runs = BOService.getRunsForVisualization(beanId, machineId);
    const activeParam = optimizableParams[state.activeParamIndex];

    runs.forEach(run => {
      const paramValue = run.parameterValues[activeParam.id];
      if (paramValue === undefined) return;

      const x = xScale(paramValue);
      const y = yScale(run.rating);

      // Hollow white rings (no fill)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
    });

    // Draw vertical position indicator with gradient fade (at current slider value)
    const currentValue = state.sliderValues[activeParam.id];
    let currentX;
    let currentParamIndex;

    if (activeParam.type === Config.PARAMETER_TYPES.DROPDOWN) {
      const optionIndex = activeParam.config.options.indexOf(currentValue);
      if (optionIndex >= 0 && validIndices) {
        currentX = xScale(paramValues[validIndices[optionIndex]]);
        currentParamIndex = validIndices[optionIndex];
      }
    } else {
      currentX = xScale(currentValue);
      // Find closest index for the current value
      let minDiff = Infinity;
      for (let i = 0; i < paramValues.length; i++) {
        const diff = Math.abs(paramValues[i] - currentValue);
        if (diff < minDiff) {
          minDiff = diff;
          currentParamIndex = i;
        }
      }
    }

    if (currentX !== undefined && currentParamIndex !== undefined) {
      // Create vertical gradient that fades at top and bottom
      const fadeHeight = 30; // pixels of fade at each end
      const gradient = ctx.createLinearGradient(currentX, padding.top, currentX, height - padding.bottom);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(fadeHeight / plotHeight, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1 - (fadeHeight / plotHeight), 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(currentX, padding.top);
      ctx.lineTo(currentX, height - padding.bottom);
      ctx.stroke();

      // Draw glowing dot at intersection with regression curve
      const predictedY = yScale(ratings[currentParamIndex]);

      // Outer glow
      ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(currentX, predictedY, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Inner dot (no shadow)
      ctx.shadowBlur = 0;
      ctx.fillStyle = cremaGold;
      ctx.beginPath();
      ctx.arc(currentX, predictedY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  /**
   * Generate distinct colors for parameters
   * @private
   */
  function _generateParameterColors(count) {
    const baseColors = [
      '#667eea', // Purple
      '#f093fb', // Pink
      '#4facfe', // Blue
      '#43e97b', // Green
      '#fa709a', // Rose
      '#fee140', // Yellow
      '#30cfd0', // Cyan
      '#a8edea'  // Mint
    ];

    return baseColors.slice(0, count);
  }

  /**
   * Get default value for a parameter
   * @private
   */
  function _getDefaultValue(parameter) {
    if (parameter.config.default !== null && parameter.config.default !== undefined) {
      return parameter.config.default;
    }

    if (parameter.type === Config.PARAMETER_TYPES.SLIDER) {
      return (parameter.config.min + parameter.config.max) / 2;
    } else if (parameter.type === Config.PARAMETER_TYPES.NUMBER) {
      return 50; // Arbitrary default
    } else if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
      return parameter.config.options[0];
    }

    return null;
  }

  /**
   * Convert hex color to RGBA
   * @private
   */
  function _hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Get color for rating (from config)
   * @private
   */
  function _getRatingColor(rating) {
    if (rating <= 3) return Config.RATING.COLORS.LOW;
    if (rating <= 6) return Config.RATING.COLORS.MEDIUM;
    if (rating <= 8) return Config.RATING.COLORS.HIGH;
    return Config.RATING.COLORS.EXCELLENT;
  }

  // Public API
  return {
    button,
    textInput,
    numberInput,
    dateInput,
    textarea,
    select,
    slider,
    ratingInput,
    starToggle,
    card,
    modal,
    confirm,
    showBackupReminder,
    alert,
    emptyState,
    badge,
    spinner,
    parameterInput,
    languageSwitcher,
    languageSelector,
    aiSuggestionCard,
    boCurveVisualization
  };
})();
