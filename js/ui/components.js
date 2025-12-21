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
  function numberInput(name, value, label, placeholder = '', min, max, step) {
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
    input.type = 'number';
    input.name = name;
    input.id = name;
    input.className = 'form-input';
    input.value = value !== undefined && value !== null ? value : '';
    input.placeholder = placeholder;
    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    if (step !== undefined) input.step = step;

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
  function select(name, options, value, label) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label;
      labelEl.htmlFor = name;
      group.appendChild(labelEl);
    }

    const sel = document.createElement('select');
    sel.name = name;
    sel.id = name;
    sel.className = 'form-select';

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
  function slider(name, value, min, max, step, label) {
    const group = document.createElement('div');
    group.className = 'form-group';

    const labelRow = document.createElement('div');
    labelRow.className = 'flex justify-between items-center mb-sm';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label m-0';
      labelEl.textContent = label;
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

    input.addEventListener('input', () => {
      valueDisplay.textContent = input.value;
    });

    group.appendChild(input);
    return group;
  }

  /**
   * Create a rating input (1-10)
   */
  function ratingInput(name, value, label) {
    const group = document.createElement('div');
    group.className = 'form-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'form-label';
      labelEl.textContent = label;
      group.appendChild(labelEl);
    }

    const ratingDiv = document.createElement('div');
    ratingDiv.className = 'rating';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = name;
    hiddenInput.value = value || '';

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
  function starToggle(starred, onToggle) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'star-icon' + (starred ? ' starred' : '');
    btn.textContent = '★';
    btn.title = starred ? 'Unstar' : 'Star as best';

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
          parameter.name
        );

      case Config.PARAMETER_TYPES.NUMBER:
        return numberInput(
          `param_${parameter.id}`,
          value !== undefined ? value : parameter.config.default,
          parameter.name
        );

      case Config.PARAMETER_TYPES.DROPDOWN:
        return select(
          `param_${parameter.id}`,
          parameter.config.options,
          value !== undefined ? value : parameter.config.default,
          parameter.name
        );

      case Config.PARAMETER_TYPES.TEXT:
      default:
        return textInput(
          `param_${parameter.id}`,
          value !== undefined ? value : parameter.config.default,
          parameter.name
        );
    }
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
    alert,
    emptyState,
    badge,
    spinner,
    parameterInput
  };
})();
