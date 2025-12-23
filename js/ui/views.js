/**
 * Views
 * View rendering functions for all application screens
 */

const Views = (function() {
  'use strict';

  const appContainer = () => document.getElementById('app-content');

  // Helper for translations
  const t = (key, params) => I18n.t(key, params);

  /**
   * Render the home/dashboard view
   */
  function renderHome() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const { machines, beans, runs } = state;

    // Page title
    const title = document.createElement('h1');
    title.textContent = t('appTitle');
    title.className = 'mb-lg';
    container.appendChild(title);

    // Check if empty state
    if (machines.length === 0 && beans.length === 0) {
      const empty = Components.emptyState({
        icon: '☕',
        title: t('welcomeTitle'),
        message: t('welcomeMessage'),
        actionText: t('createMachine'),
        action: () => Router.navigate('machines/new')
      });
      container.appendChild(empty);
      return;
    }

    // Stats
    const statsDiv = document.createElement('div');
    statsDiv.className = 'dashboard-stats';

    const machinesCard = document.createElement('div');
    machinesCard.className = 'stat-card';
    machinesCard.innerHTML = `
      <div class="stat-label">${t('coffeeMachines')}</div>
      <div class="stat-value">${machines.length}</div>
    `;
    statsDiv.appendChild(machinesCard);

    const beansCard = document.createElement('div');
    beansCard.className = 'stat-card';
    beansCard.innerHTML = `
      <div class="stat-label">${t('coffeeBeans')}</div>
      <div class="stat-value">${beans.length}</div>
    `;
    statsDiv.appendChild(beansCard);

    const runsCard = document.createElement('div');
    runsCard.className = 'stat-card';
    runsCard.innerHTML = `
      <div class="stat-label">${t('totalRuns')}</div>
      <div class="stat-value">${runs.length}</div>
    `;
    statsDiv.appendChild(runsCard);

    container.appendChild(statsDiv);

    // Quick actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'dashboard-actions';

    actionsDiv.appendChild(Components.button(t('addMachine'), () => Router.navigate('machines/new'), 'primary'));
    actionsDiv.appendChild(Components.button(t('addBean'), () => Router.navigate('beans/new'), 'primary'));
    actionsDiv.appendChild(Components.button(t('viewBeans'), () => Router.navigate('beans'), 'secondary'));
    actionsDiv.appendChild(Components.button(t('viewMachines'), () => Router.navigate('machines'), 'secondary'));

    container.appendChild(actionsDiv);

    // Data management section
    const dataSection = createDataManagementSection();
    container.appendChild(dataSection);

    // AI Optimization settings section
    const aiSection = createAIOptimizationSection();
    container.appendChild(aiSection);

    // Recent runs
    if (runs.length > 0) {
      const section = document.createElement('div');
      section.className = 'dashboard-section';

      const sectionTitle = document.createElement('h2');
      sectionTitle.className = 'dashboard-section-title';
      sectionTitle.textContent = t('recentActivity');
      section.appendChild(sectionTitle);

      const recentRuns = Repository.RunRepository.getRecent(5);
      recentRuns.forEach(run => {
        const bean = Repository.BeanRepository.getById(run.beanId);
        const machine = Repository.MachineRepository.getById(run.machineId);

        if (bean && machine) {
          const runCard = createRunCard(run, bean, machine);
          section.appendChild(runCard);
        }
      });

      container.appendChild(section);
    }
  }

  /**
   * Render machines list
   */
  function renderMachines() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const machines = state.machines;

    // Header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-xl';

    const title = document.createElement('h1');
    title.textContent = t('coffeeMachines');
    header.appendChild(title);

    header.appendChild(Components.button(t('addMachine'), () => Router.navigate('machines/new'), 'primary'));

    container.appendChild(header);

    // Empty state
    if (machines.length === 0) {
      const empty = Components.emptyState({
        ...Config.EMPTY_STATES.NO_MACHINES,
        action: () => Router.navigate('machines/new'),
        actionText: Config.EMPTY_STATES.NO_MACHINES.action
      });
      container.appendChild(empty);
      return;
    }

    // Machine list
    const list = document.createElement('div');
    list.className = 'entity-list';

    machines.forEach(machine => {
      const card = createMachineCard(machine);
      list.appendChild(card);
    });

    container.appendChild(list);
  }

  /**
   * Render beans list
   */
  function renderBeans() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const beans = state.beans;

    // Header
    const header = document.createElement('div');
    header.className = 'flex justify-between items-center mb-xl';

    const title = document.createElement('h1');
    title.textContent = t('coffeeBeans');
    header.appendChild(title);

    header.appendChild(Components.button(t('addBean'), () => Router.navigate('beans/new'), 'primary'));

    container.appendChild(header);

    // Empty state
    if (beans.length === 0) {
      const empty = Components.emptyState({
        ...Config.EMPTY_STATES.NO_BEANS,
        action: () => Router.navigate('beans/new'),
        actionText: Config.EMPTY_STATES.NO_BEANS.action
      });
      container.appendChild(empty);
      return;
    }

    // Bean list
    const list = document.createElement('div');
    list.className = 'entity-list';

    beans.forEach(bean => {
      const card = createBeanCard(bean);
      list.appendChild(card);
    });

    container.appendChild(list);
  }

  /**
   * Render bean detail (machine selection)
   */
  function renderBeanDetail() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const { id } = state.routeParams;
    const bean = Repository.BeanRepository.getById(id);

    if (!bean) {
      container.appendChild(Components.alert('Bean not found', 'error'));
      return;
    }

    // Bean header
    const header = document.createElement('div');
    header.className = 'bean-detail-header';

    const title = document.createElement('h1');
    title.className = 'bean-detail-title';
    title.textContent = bean.name;
    header.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'bean-detail-meta';
    meta.innerHTML = `
      <span>${t('purchased')}: ${Helpers.formatDateDisplay(bean.purchaseDate)}</span>
      <span>${Helpers.daysSince(bean.purchaseDate)} ${t('daysAgo')}</span>
    `;
    header.appendChild(meta);

    if (bean.notes) {
      const notes = document.createElement('p');
      notes.textContent = bean.notes;
      notes.className = 'text-secondary';
      header.appendChild(notes);
    }

    const actions = document.createElement('div');
    actions.className = 'flex gap-sm mt-md';
    actions.appendChild(Components.button(t('edit'), () => Router.navigate(`beans/new?id=${id}`), 'secondary', 'sm'));
    actions.appendChild(Components.button(t('delete'), () => handleDeleteBean(id), 'danger', 'sm'));
    header.appendChild(actions);

    container.appendChild(header);

    // Machine selection
    const machines = state.machines;

    if (machines.length === 0) {
      const empty = Components.emptyState({
        icon: '⚙️',
        title: t('noCoffeeMachines'),
        message: t('noMachinesMessage'),
        actionText: t('createMachine'),
        action: () => Router.navigate('machines/new')
      });
      container.appendChild(empty);
      return;
    }

    const section = document.createElement('div');
    section.className = 'machine-selection';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'machine-selection-title';
    sectionTitle.textContent = t('selectCoffeeMachine');
    section.appendChild(sectionTitle);

    const grid = document.createElement('div');
    grid.className = 'machine-grid';

    machines.forEach(machine => {
      const option = document.createElement('div');
      option.className = 'machine-option';
      option.textContent = machine.name;
      option.addEventListener('click', () => {
        Router.navigate(`beans/${id}/machines/${machine.id}`);
      });
      grid.appendChild(option);
    });

    section.appendChild(grid);
    container.appendChild(section);
  }

  /**
   * Render run list for a bean-machine combination
   */
  function renderRunList() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const { beanId, machineId } = state.routeParams;
    const bean = Repository.BeanRepository.getById(beanId);
    const machine = Repository.MachineRepository.getById(machineId);

    if (!bean || !machine) {
      container.appendChild(Components.alert('Bean or machine not found', 'error'));
      return;
    }

    // Header with breadcrumb
    const header = document.createElement('div');
    header.className = 'run-list-header';

    const breadcrumb = document.createElement('div');
    breadcrumb.className = 'run-list-breadcrumb';
    breadcrumb.innerHTML = `
      <a href="#beans">Beans</a> /
      <a href="#beans/${beanId}">${bean.name}</a> /
      ${machine.name}
    `;
    header.appendChild(breadcrumb);

    const addBtn = Components.button(t('newRun'), () => {
      Router.navigate(`beans/${beanId}/machines/${machineId}/run/new`);
    }, 'primary');
    header.appendChild(addBtn);

    container.appendChild(header);

    // Get runs
    const runs = Repository.RunRepository.getByBeanAndMachine(beanId, machineId);

    // Get AI suggestion if available
    const aiSuggestion = BOService.suggestParameters(beanId, machineId);
    const isBoReady = BOService.isReady(beanId, machineId);
    const boConfig = BOService.getConfig();

    // Render AI suggestion card if available
    if (aiSuggestion) {
      const suggestionCard = Components.aiSuggestionCard(
        aiSuggestion,
        bean,
        machine,
        isBoReady,
        boConfig.minRunsThreshold
      );
      container.appendChild(suggestionCard);
    }

    if (runs.length === 0) {
      const empty = Components.emptyState({
        ...Config.EMPTY_STATES.NO_RUNS,
        action: () => Router.navigate(`beans/${beanId}/machines/${machineId}/run/new`),
        actionText: Config.EMPTY_STATES.NO_RUNS.action
      });
      container.appendChild(empty);
      return;
    }

    // Render runs
    runs.forEach(run => {
      const runCard = createRunCard(run, bean, machine);
      container.appendChild(runCard);
    });
  }

  /**
   * Render machine form (create/edit)
   */
  function renderMachineForm() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const { id } = state.routeParams;
    const machine = id ? Repository.MachineRepository.getById(id) : null;
    const isEdit = !!machine;

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'flex justify-between items-center mb-xl';

    const title = document.createElement('h1');
    title.textContent = isEdit ? t('editCoffeeMachine') : t('newCoffeeMachine');
    title.className = 'm-0';
    headerDiv.appendChild(title);

    if (isEdit) {
      const deleteBtn = Components.button(t('delete'), () => handleDeleteMachine(id), 'danger', 'button');
      headerDiv.appendChild(deleteBtn);
    }

    formContainer.appendChild(headerDiv);

    const form = document.createElement('form');
    form.className = 'form-card';

    form.appendChild(Components.textInput('name', machine?.name || '', t('machineName'), t('machineNamePlaceholder'), true));

    // Parameters section
    const parametersSection = document.createElement('div');
    parametersSection.className = 'parameters-section';

    const parametersHeader = document.createElement('div');
    parametersHeader.className = 'flex justify-between items-center mb-md';

    const parametersLabel = document.createElement('label');
    parametersLabel.className = 'form-label';
    parametersLabel.textContent = t('parameters');
    parametersHeader.appendChild(parametersLabel);

    const addParamBtn = Components.button(t('addParameter'), () => {
      const param = {
        id: Helpers.generateUUID(),
        name: '',
        type: Config.PARAMETER_TYPES.NUMBER,
        config: {}
      };
      parameters.push(param);
      renderParameters();
    }, 'secondary', 'sm');
    parametersHeader.appendChild(addParamBtn);

    parametersSection.appendChild(parametersHeader);

    const parametersContainer = document.createElement('div');
    parametersContainer.id = 'parameters-container';
    parametersSection.appendChild(parametersContainer);

    form.appendChild(parametersSection);

    // Track parameters
    let parameters = machine?.parameters ? Helpers.deepClone(machine.parameters) : [];

    function renderParameters() {
      // Save current form values to parameters array before re-rendering
      parameters.forEach((param, index) => {
        const nameInput = document.querySelector(`input[name="param_name_${index}"]`);
        const typeSelect = document.querySelector(`select[name="param_type_${index}"]`);

        if (nameInput) {
          param.name = nameInput.value;
        }
        if (typeSelect) {
          param.type = typeSelect.value;

          // Save config values too
          if (param.type === Config.PARAMETER_TYPES.SLIDER) {
            const minInput = document.querySelector(`input[name="param_min_${index}"]`);
            const maxInput = document.querySelector(`input[name="param_max_${index}"]`);
            const stepInput = document.querySelector(`input[name="param_step_${index}"]`);

            if (minInput) param.config.min = Number(minInput.value);
            if (maxInput) param.config.max = Number(maxInput.value);
            if (stepInput) param.config.step = Number(stepInput.value);
          } else if (param.type === Config.PARAMETER_TYPES.DROPDOWN) {
            const optionsInput = document.querySelector(`textarea[name="param_options_${index}"]`);
            if (optionsInput) {
              param.config.options = optionsInput.value.split('\n').map(o => o.trim()).filter(o => o.length > 0);
            }
          }
        }
      });

      parametersContainer.innerHTML = '';

      if (parameters.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-muted text-sm';
        emptyMsg.textContent = t('noParametersMessage');
        parametersContainer.appendChild(emptyMsg);
        return;
      }

      parameters.forEach((param, index) => {
        const paramCard = document.createElement('div');
        paramCard.className = 'parameter-card';

        // Parameter name
        const nameInput = Components.textInput(
          `param_name_${index}`,
          param.name,
          t('parameterName'),
          t('parameterNamePlaceholder'),
          true
        );
        paramCard.appendChild(nameInput);

        // Parameter type
        const typeSelect = Components.select(
          `param_type_${index}`,
          [
            { value: Config.PARAMETER_TYPES.NUMBER, label: t('paramTypeNumber') },
            { value: Config.PARAMETER_TYPES.SLIDER, label: t('paramTypeSlider') },
            { value: Config.PARAMETER_TYPES.TEXT, label: t('paramTypeText') },
            { value: Config.PARAMETER_TYPES.DROPDOWN, label: t('paramTypeDropdown') }
          ],
          param.type,
          t('parameterType')
        );
        paramCard.appendChild(typeSelect);

        // Type-specific config
        const configDiv = document.createElement('div');
        configDiv.className = 'parameter-config';
        configDiv.id = `param_config_${index}`;

        const renderConfig = () => {
          configDiv.innerHTML = '';
          const type = typeSelect.querySelector('select').value;

          if (type === Config.PARAMETER_TYPES.SLIDER) {
            configDiv.appendChild(Components.numberInput(
              `param_min_${index}`,
              param.config.min ?? 0,
              t('min'),
              '',
              undefined,
              undefined,
              0.1
            ));
            configDiv.appendChild(Components.numberInput(
              `param_max_${index}`,
              param.config.max ?? 100,
              t('max'),
              '',
              undefined,
              undefined,
              0.1
            ));
            configDiv.appendChild(Components.numberInput(
              `param_step_${index}`,
              param.config.step ?? 1,
              t('step'),
              '',
              0.01,
              undefined,
              0.01
            ));
          } else if (type === Config.PARAMETER_TYPES.DROPDOWN) {
            const optionsInput = Components.textarea(
              `param_options_${index}`,
              param.config.options ? param.config.options.join('\n') : '',
              t('options'),
              t('optionsPlaceholder')
            );
            configDiv.appendChild(optionsInput);
          }
        };

        renderConfig();
        typeSelect.querySelector('select').addEventListener('change', renderConfig);
        paramCard.appendChild(configDiv);

        // Remove button
        const removeBtn = Components.button(t('remove'), () => {
          parameters.splice(index, 1);
          renderParameters();
        }, 'danger', 'sm');
        paramCard.appendChild(removeBtn);

        parametersContainer.appendChild(paramCard);
      });
    }

    renderParameters();

    const submitBtn = Components.button(isEdit ? t('update') + ' ' + t('machines') : t('create') + ' ' + t('machines'), null, 'primary', 'submit');
    const cancelBtn = Components.button(t('cancel'), () => Router.goBack(), 'secondary');

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);

    form.appendChild(actions);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      // Collect parameters
      const collectedParams = parameters.map((param, index) => {
        const name = formData.get(`param_name_${index}`);
        const type = formData.get(`param_type_${index}`);
        const config = {};

        if (type === Config.PARAMETER_TYPES.SLIDER) {
          config.min = Number(formData.get(`param_min_${index}`)) || 0;
          config.max = Number(formData.get(`param_max_${index}`)) || 100;
          config.step = Number(formData.get(`param_step_${index}`)) || 1;
        } else if (type === Config.PARAMETER_TYPES.DROPDOWN) {
          const optionsText = formData.get(`param_options_${index}`) || '';
          config.options = optionsText.split('\n').map(o => o.trim()).filter(o => o.length > 0);
        }

        return {
          id: param.id,
          name: name,
          type: type,
          config: config
        };
      });

      const data = {
        name: formData.get('name'),
        parameters: collectedParams
      };

      try {
        if (isEdit) {
          AppState.updateMachine(id, data);
          Router.navigate('machines');
        } else {
          AppState.createMachine(data);
          Router.navigate('machines');
        }
      } catch (error) {
        alert(error.message);
      }
    });

    formContainer.appendChild(form);
    container.appendChild(formContainer);
  }

  /**
   * Render bean form (create/edit)
   */
  function renderBeanForm() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const { id } = state.routeParams;
    const bean = id ? Repository.BeanRepository.getById(id) : null;
    const isEdit = !!bean;

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    const title = document.createElement('h1');
    title.textContent = isEdit ? t('editCoffeeBean') : t('newCoffeeBean');
    title.className = 'mb-xl';
    formContainer.appendChild(title);

    const form = document.createElement('form');
    form.className = 'form-card';

    form.appendChild(Components.textInput('name', bean?.name || '', t('beanName'), t('beanNamePlaceholder'), true));
    form.appendChild(Components.dateInput('purchaseDate', bean?.purchaseDate || Helpers.formatDate(new Date()), t('purchaseDate')));
    form.appendChild(Components.textarea('notes', bean?.notes || '', t('notes'), t('notesPlaceholder')));

    const submitBtn = Components.button(isEdit ? t('update') + ' ' + t('beans') : t('create') + ' ' + t('beans'), null, 'primary', 'submit');
    const cancelBtn = Components.button(t('cancel'), () => Router.goBack(), 'secondary');

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);

    form.appendChild(actions);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        purchaseDate: formData.get('purchaseDate'),
        notes: formData.get('notes')
      };

      try {
        if (isEdit) {
          AppState.updateBean(id, data);
          Router.navigate('beans');
        } else {
          AppState.createBean(data);
          Router.navigate('beans');
        }
      } catch (error) {
        alert(error.message);
      }
    });

    formContainer.appendChild(form);
    container.appendChild(formContainer);
  }

  /**
   * Render run form (create/edit)
   */
  function renderRunForm() {
    const container = appContainer();
    container.innerHTML = '';

    const state = AppState.getState();
    const { beanId, machineId, runId } = state.routeParams;
    const bean = Repository.BeanRepository.getById(beanId);
    const machine = Repository.MachineRepository.getById(machineId);
    const run = runId ? Repository.RunRepository.getById(runId) : null;
    const isEdit = !!run;

    if (!bean || !machine) {
      container.appendChild(Components.alert('Bean or machine not found', 'error'));
      return;
    }

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container';

    const title = document.createElement('h1');
    title.textContent = isEdit ? t('editRunTitle') : t('newRunTitle');
    title.className = 'mb-xl';
    formContainer.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = `${bean.name} • ${machine.name}`;
    subtitle.className = 'text-muted mb-lg';
    formContainer.appendChild(subtitle);

    const form = document.createElement('form');
    form.className = 'form-card';

    // Extract prefill data from URL query parameter
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    let prefillData = null;
    try {
      const prefillParam = urlParams.get('prefill');
      if (prefillParam) {
        prefillData = JSON.parse(decodeURIComponent(prefillParam));
      }
    } catch (e) {
      console.error('Failed to parse prefill data:', e);
    }

    // Add parameter inputs
    machine.parameters.forEach(param => {
      // Prioritize: existing run data > prefill data > no default
      const value = run?.parameterValues[param.id] ?? prefillData?.[param.id];
      const input = Components.parameterInput(param, value);
      form.appendChild(input);
    });

    // Rating
    form.appendChild(Components.ratingInput('rating', run?.rating, t('rating')));

    // Notes
    form.appendChild(Components.textarea('notes', run?.notes || '', t('notes'), t('notesPlaceholder')));

    const submitBtn = Components.button(isEdit ? t('updateRun') : t('saveRun'), null, 'primary', 'submit');
    const cancelBtn = Components.button(t('cancel'), () => Router.goBack(), 'secondary');

    const actions = document.createElement('div');
    actions.className = 'form-actions';
    actions.appendChild(cancelBtn);
    actions.appendChild(submitBtn);

    form.appendChild(actions);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      const parameterValues = {};
      machine.parameters.forEach(param => {
        parameterValues[param.id] = formData.get(`param_${param.id}`);
      });

      const data = {
        beanId,
        machineId,
        parameterValues,
        rating: formData.get('rating') ? Number(formData.get('rating')) : null,
        notes: formData.get('notes')
      };

      try {
        if (isEdit) {
          AppState.updateRun(runId, data);
        } else {
          AppState.createRun(data);
        }
        Router.navigate(`beans/${beanId}/machines/${machineId}`);
      } catch (error) {
        alert(error.message);
      }
    });

    formContainer.appendChild(form);
    container.appendChild(formContainer);
  }

  /**
   * Helper: Create a machine card
   */
  function createMachineCard(machine) {
    const card = document.createElement('div');
    card.className = 'entity-card';

    const runCount = Repository.MachineRepository.getRunCount(machine.id);
    const paramCount = machine.parameters.length;
    card.innerHTML = `
      <div class="entity-card-header">
        <h3 class="entity-card-title">${Helpers.escapeHTML(machine.name)}</h3>
      </div>
      <div class="entity-card-meta">
        <span>${paramCount} ${paramCount !== 1 ? t('parameters_plural') : t('parameter')}</span>
        <span>${runCount} ${runCount !== 1 ? t('runs_plural') : t('run')}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      Router.navigate(`machines/${machine.id}`);
    });

    return card;
  }

  /**
   * Helper: Create a bean card
   */
  function createBeanCard(bean) {
    const card = document.createElement('div');
    card.className = 'entity-card';

    const daysSince = Helpers.daysSince(bean.purchaseDate);
    let freshnessLabel = '';
    let freshnessType = 'success';

    if (daysSince <= Config.BEAN_FRESHNESS.FRESH) {
      freshnessLabel = t('fresh');
      freshnessType = 'success';
    } else if (daysSince <= Config.BEAN_FRESHNESS.GOOD) {
      freshnessLabel = t('good');
      freshnessType = 'info';
    } else if (daysSince <= Config.BEAN_FRESHNESS.AGING) {
      freshnessLabel = t('aging');
      freshnessType = 'warning';
    } else {
      freshnessLabel = t('old');
      freshnessType = 'danger';
    }

    const runCount = Repository.BeanRepository.getRunCount(bean.id);
    card.innerHTML = `
      <div class="entity-card-header">
        <h3 class="entity-card-title">${Helpers.escapeHTML(bean.name)}</h3>
        <span class="badge badge-${freshnessType}">${freshnessLabel}</span>
      </div>
      <div class="entity-card-meta">
        <span>${t('purchased')}: ${Helpers.formatDateDisplay(bean.purchaseDate)}</span>
        <span>${daysSince} ${t('daysAgo')}</span>
        <span>${runCount} ${runCount !== 1 ? t('runs_plural') : t('run')}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      Router.navigate(`beans/${bean.id}`);
    });

    return card;
  }

  /**
   * Helper: Create a run card
   */
  function createRunCard(run, bean, machine) {
    const card = document.createElement('div');
    card.className = 'run-card' + (run.starred ? ' starred' : '');

    // Header
    const header = document.createElement('div');
    header.className = 'run-card-header';

    const date = document.createElement('div');
    date.className = 'run-date';
    date.textContent = Helpers.formatDateTime(run.timestamp);
    header.appendChild(date);

    const star = Components.starToggle(run.starred, (starred) => {
      AppState.toggleRunStar(run.id, starred);
    }, t);
    header.appendChild(star);

    card.appendChild(header);

    // Parameters
    const paramsDiv = document.createElement('div');
    paramsDiv.className = 'run-parameters';

    machine.parameters.forEach(param => {
      const value = run.parameterValues[param.id];
      const paramItem = document.createElement('div');
      paramItem.className = 'parameter-item';
      paramItem.innerHTML = `
        <div class="parameter-label">${Helpers.escapeHTML(param.name)}</div>
        <div class="parameter-value">${Helpers.escapeHTML(String(value))}</div>
      `;
      paramsDiv.appendChild(paramItem);
    });

    card.appendChild(paramsDiv);

    // Rating
    if (run.rating) {
      const ratingDiv = document.createElement('div');
      ratingDiv.className = 'run-rating';

      const stars = '★'.repeat(run.rating) + '☆'.repeat(10 - run.rating);
      ratingDiv.innerHTML = `<span style="color: var(--color-star)">${stars}</span> <span class="font-semibold">${run.rating}/10</span>`;

      card.appendChild(ratingDiv);
    }

    // Notes
    if (run.notes) {
      const notes = document.createElement('div');
      notes.className = 'run-notes';
      notes.textContent = run.notes;
      card.appendChild(notes);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'run-actions';

    actions.appendChild(Components.button(t('edit'), (e) => {
      e.stopPropagation();
      Router.navigate(`beans/${run.beanId}/machines/${run.machineId}/run/${run.id}`);
    }, 'secondary', 'sm'));

    actions.appendChild(Components.button(t('delete'), (e) => {
      e.stopPropagation();
      Components.confirm(t('confirmDeleteRun'), () => {
        AppState.deleteRun(run.id);
      });
    }, 'danger', 'sm'));

    card.appendChild(actions);

    return card;
  }

  /**
   * Helper: Create data management section
   */
  function createDataManagementSection() {
    const section = document.createElement('div');
    section.className = 'data-management-section';

    const title = document.createElement('h2');
    title.className = 'data-management-title';
    title.textContent = t('dataManagement');
    section.appendChild(title);

    // Get current data stats
    const stats = ExportImport.getDataStats();

    // Stats display
    const statsText = document.createElement('p');
    statsText.className = 'data-stats';
    statsText.textContent = `${stats.machines} ${t('machines')}, ${stats.beans} ${t('beans')}, ${stats.runs} ${t('runs_plural')} • ${t('storage')}: ${stats.storageUsed} KB (${stats.storagePercentage}%)`;
    section.appendChild(statsText);

    // Button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'data-management-buttons';

    // Export button
    const exportBtn = Components.button(t('exportData'), () => {
      ExportImport.exportData();
    }, 'secondary');
    buttonContainer.appendChild(exportBtn);

    // Import button (replace)
    const importReplaceBtn = Components.button(t('importReplace'), () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          Components.confirm(
            t('confirmImportReplace'),
            async () => {
              try {
                await ExportImport.importData(file, false);
              } catch (error) {
                AppState.setError(error.message);
              }
            }
          );
        }
      };
      input.click();
    }, 'secondary');
    buttonContainer.appendChild(importReplaceBtn);

    // Import button (merge)
    const importMergeBtn = Components.button(t('importMerge'), () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            await ExportImport.importData(file, true);
          } catch (error) {
            AppState.setError(error.message);
          }
        }
      };
      input.click();
    }, 'secondary');
    buttonContainer.appendChild(importMergeBtn);

    section.appendChild(buttonContainer);

    return section;
  }

  /**
   * Create AI optimization settings section
   */
  function createAIOptimizationSection() {
    const section = document.createElement('div');
    section.className = 'data-management-section';

    const title = document.createElement('h2');
    title.className = 'data-management-title';
    title.textContent = t('aiOptimizationSettings');
    section.appendChild(title);

    // Get current config
    const boConfig = BOService.getConfig();

    // Form container
    const formDiv = document.createElement('div');
    formDiv.className = 'ai-settings-form';

    // Min runs threshold
    const minRunsGroup = document.createElement('div');
    minRunsGroup.className = 'form-group';

    const minRunsLabel = document.createElement('label');
    minRunsLabel.className = 'form-label';
    minRunsLabel.textContent = t('minRunsThreshold');
    minRunsGroup.appendChild(minRunsLabel);

    const minRunsHelp = document.createElement('p');
    minRunsHelp.className = 'form-help';
    minRunsHelp.textContent = t('minRunsThresholdHelp');
    minRunsGroup.appendChild(minRunsHelp);

    const minRunsInput = Components.numberInput('minRunsThreshold', boConfig.minRunsThreshold);
    minRunsInput.querySelector('input').min = 1;
    minRunsInput.querySelector('input').max = 20;
    minRunsGroup.appendChild(minRunsInput);

    formDiv.appendChild(minRunsGroup);

    // Exploration factor
    const explorationGroup = document.createElement('div');
    explorationGroup.className = 'form-group';

    const explorationLabel = document.createElement('label');
    explorationLabel.className = 'form-label';
    explorationLabel.textContent = t('explorationFactor');
    explorationGroup.appendChild(explorationLabel);

    const explorationHelp = document.createElement('p');
    explorationHelp.className = 'form-help';
    explorationHelp.textContent = t('explorationFactorHelp');
    explorationGroup.appendChild(explorationHelp);

    const explorationInput = Components.numberInput('explorationFactor', boConfig.explorationFactor);
    explorationInput.querySelector('input').min = 1.0;
    explorationInput.querySelector('input').max = 3.0;
    explorationInput.querySelector('input').step = 0.1;
    explorationGroup.appendChild(explorationInput);

    formDiv.appendChild(explorationGroup);

    section.appendChild(formDiv);

    // Save button
    const saveBtn = Components.button(t('save'), () => {
      const minRuns = Number(minRunsInput.querySelector('input').value);
      const exploration = Number(explorationInput.querySelector('input').value);

      BOService.setConfig({
        minRunsThreshold: minRuns,
        explorationFactor: exploration
      });

      AppState.setMessage(t('boSettingsSaved'));
    }, 'primary');

    section.appendChild(saveBtn);

    return section;
  }

  /**
   * Helper: Handle bean deletion
   */
  function handleDeleteBean(beanId) {
    const count = Repository.BeanRepository.getRunCount(beanId);
    const message = count > 0
      ? t('confirmDeleteBeanWithRuns', { count })
      : t('confirmDeleteBean');

    Components.confirm(message, () => {
      try {
        AppState.deleteBean(beanId);
        Router.navigate('beans');
      } catch (error) {
        alert(error.message);
      }
    });
  }

  /**
   * Helper: Handle machine deletion
   */
  function handleDeleteMachine(machineId) {
    const count = Repository.MachineRepository.getRunCount(machineId);
    const message = count > 0
      ? t('confirmDeleteMachineWithRuns', { count })
      : t('confirmDeleteMachine');

    Components.confirm(message, () => {
      try {
        AppState.deleteMachine(machineId);
        Router.navigate('machines');
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Public API
  return {
    renderHome,
    renderMachines,
    renderBeans,
    renderBeanDetail,
    renderRunList,
    renderMachineForm,
    renderBeanForm,
    renderRunForm
  };
})();
