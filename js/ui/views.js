/**
 * Views
 * View rendering functions for all application screens
 */

const Views = (function() {
  'use strict';

  const appContainer = () => document.getElementById('app-content');

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
    title.textContent = 'Coffee Tracker';
    title.className = 'mb-lg';
    container.appendChild(title);

    // Check if empty state
    if (machines.length === 0 && beans.length === 0) {
      const empty = Components.emptyState({
        icon: '☕',
        title: 'Welcome to Coffee Tracker!',
        message: 'Start by creating your first coffee machine, then add beans to track your perfect brew.',
        actionText: 'Create Coffee Machine',
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
      <div class="stat-label">Coffee Machines</div>
      <div class="stat-value">${machines.length}</div>
    `;
    statsDiv.appendChild(machinesCard);

    const beansCard = document.createElement('div');
    beansCard.className = 'stat-card';
    beansCard.innerHTML = `
      <div class="stat-label">Coffee Beans</div>
      <div class="stat-value">${beans.length}</div>
    `;
    statsDiv.appendChild(beansCard);

    const runsCard = document.createElement('div');
    runsCard.className = 'stat-card';
    runsCard.innerHTML = `
      <div class="stat-label">Total Runs</div>
      <div class="stat-value">${runs.length}</div>
    `;
    statsDiv.appendChild(runsCard);

    container.appendChild(statsDiv);

    // Quick actions
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'dashboard-actions';

    actionsDiv.appendChild(Components.button('Add Machine', () => Router.navigate('machines/new'), 'primary'));
    actionsDiv.appendChild(Components.button('Add Bean', () => Router.navigate('beans/new'), 'primary'));
    actionsDiv.appendChild(Components.button('View Beans', () => Router.navigate('beans'), 'secondary'));
    actionsDiv.appendChild(Components.button('View Machines', () => Router.navigate('machines'), 'secondary'));

    container.appendChild(actionsDiv);

    // Recent runs
    if (runs.length > 0) {
      const section = document.createElement('div');
      section.className = 'dashboard-section';

      const sectionTitle = document.createElement('h2');
      sectionTitle.className = 'dashboard-section-title';
      sectionTitle.textContent = 'Recent Activity';
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
    title.textContent = 'Coffee Machines';
    header.appendChild(title);

    header.appendChild(Components.button('Add Machine', () => Router.navigate('machines/new'), 'primary'));

    container.appendChild(header);

    // Empty state
    if (machines.length === 0) {
      const empty = Components.emptyState(Config.EMPTY_STATES.NO_MACHINES);
      empty.querySelector('.btn').addEventListener('click', () => Router.navigate('machines/new'));
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
    title.textContent = 'Coffee Beans';
    header.appendChild(title);

    header.appendChild(Components.button('Add Bean', () => Router.navigate('beans/new'), 'primary'));

    container.appendChild(header);

    // Empty state
    if (beans.length === 0) {
      const empty = Components.emptyState(Config.EMPTY_STATES.NO_BEANS);
      empty.querySelector('.btn').addEventListener('click', () => Router.navigate('beans/new'));
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
      <span>Purchased: ${Helpers.formatDateDisplay(bean.purchaseDate)}</span>
      <span>${Helpers.daysSince(bean.purchaseDate)} days ago</span>
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
    actions.appendChild(Components.button('Edit', () => Router.navigate(`beans/new?id=${id}`), 'secondary', 'sm'));
    actions.appendChild(Components.button('Delete', () => handleDeleteBean(id), 'danger', 'sm'));
    header.appendChild(actions);

    container.appendChild(header);

    // Machine selection
    const machines = state.machines;

    if (machines.length === 0) {
      const empty = Components.emptyState({
        icon: '⚙️',
        title: 'No Coffee Machines',
        message: 'Create a coffee machine first to start tracking runs for this bean.',
        actionText: 'Create Machine',
        action: () => Router.navigate('machines/new')
      });
      container.appendChild(empty);
      return;
    }

    const section = document.createElement('div');
    section.className = 'machine-selection';

    const sectionTitle = document.createElement('h2');
    sectionTitle.className = 'machine-selection-title';
    sectionTitle.textContent = 'Select Coffee Machine';
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

    const addBtn = Components.button('New Run', () => {
      Router.navigate(`beans/${beanId}/machines/${machineId}/run/new`);
    }, 'primary');
    header.appendChild(addBtn);

    container.appendChild(header);

    // Get runs
    const runs = Repository.RunRepository.getByBeanAndMachine(beanId, machineId);

    if (runs.length === 0) {
      const empty = Components.emptyState(Config.EMPTY_STATES.NO_RUNS);
      empty.querySelector('.btn').addEventListener('click', () => {
        Router.navigate(`beans/${beanId}/machines/${machineId}/run/new`);
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

    const title = document.createElement('h1');
    title.textContent = isEdit ? 'Edit Coffee Machine' : 'New Coffee Machine';
    title.className = 'mb-xl';
    formContainer.appendChild(title);

    const form = document.createElement('form');
    form.className = 'form-card';

    form.appendChild(Components.textInput('name', machine?.name || '', 'Machine Name', 'e.g., Espresso Machine', true));

    // Parameters section
    const parametersSection = document.createElement('div');
    parametersSection.className = 'parameters-section';

    const parametersHeader = document.createElement('div');
    parametersHeader.className = 'flex justify-between items-center mb-md';

    const parametersLabel = document.createElement('label');
    parametersLabel.className = 'form-label';
    parametersLabel.textContent = 'Parameters';
    parametersHeader.appendChild(parametersLabel);

    const addParamBtn = Components.button('+ Add Parameter', () => {
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
      parametersContainer.innerHTML = '';

      if (parameters.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.className = 'text-muted text-sm';
        emptyMsg.textContent = 'No parameters yet. Add parameters to track brewing settings.';
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
          'Name',
          'e.g., Grind Size',
          true
        );
        paramCard.appendChild(nameInput);

        // Parameter type
        const typeSelect = Components.select(
          `param_type_${index}`,
          [
            { value: Config.PARAMETER_TYPES.NUMBER, label: 'Number' },
            { value: Config.PARAMETER_TYPES.SLIDER, label: 'Slider' },
            { value: Config.PARAMETER_TYPES.TEXT, label: 'Text' },
            { value: Config.PARAMETER_TYPES.DROPDOWN, label: 'Dropdown' }
          ],
          param.type,
          'Type'
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
              'Min',
              '',
              undefined,
              undefined,
              0.1
            ));
            configDiv.appendChild(Components.numberInput(
              `param_max_${index}`,
              param.config.max ?? 100,
              'Max',
              '',
              undefined,
              undefined,
              0.1
            ));
            configDiv.appendChild(Components.numberInput(
              `param_step_${index}`,
              param.config.step ?? 1,
              'Step',
              '',
              0.01,
              undefined,
              0.01
            ));
          } else if (type === Config.PARAMETER_TYPES.DROPDOWN) {
            const optionsInput = Components.textarea(
              `param_options_${index}`,
              param.config.options ? param.config.options.join('\n') : '',
              'Options (one per line)',
              'Fine\nMedium\nCoarse'
            );
            configDiv.appendChild(optionsInput);
          }
        };

        renderConfig();
        typeSelect.querySelector('select').addEventListener('change', renderConfig);
        paramCard.appendChild(configDiv);

        // Remove button
        const removeBtn = Components.button('Remove', () => {
          parameters.splice(index, 1);
          renderParameters();
        }, 'danger', 'sm');
        paramCard.appendChild(removeBtn);

        parametersContainer.appendChild(paramCard);
      });
    }

    renderParameters();

    const submitBtn = Components.button(isEdit ? 'Update Machine' : 'Create Machine', null, 'primary', 'submit');
    const cancelBtn = Components.button('Cancel', () => Router.goBack(), 'secondary');

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
    title.textContent = isEdit ? 'Edit Coffee Bean' : 'New Coffee Bean';
    title.className = 'mb-xl';
    formContainer.appendChild(title);

    const form = document.createElement('form');
    form.className = 'form-card';

    form.appendChild(Components.textInput('name', bean?.name || '', 'Bean Name', 'e.g., Ethiopian Yirgacheffe', true));
    form.appendChild(Components.dateInput('purchaseDate', bean?.purchaseDate || Helpers.formatDate(new Date()), 'Purchase Date'));
    form.appendChild(Components.textarea('notes', bean?.notes || '', 'Notes (Optional)', 'e.g., Fruity notes, light roast'));

    const submitBtn = Components.button(isEdit ? 'Update Bean' : 'Create Bean', null, 'primary', 'submit');
    const cancelBtn = Components.button('Cancel', () => Router.goBack(), 'secondary');

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
    title.textContent = isEdit ? 'Edit Run' : 'New Run';
    title.className = 'mb-xl';
    formContainer.appendChild(title);

    const subtitle = document.createElement('p');
    subtitle.textContent = `${bean.name} • ${machine.name}`;
    subtitle.className = 'text-muted mb-lg';
    formContainer.appendChild(subtitle);

    const form = document.createElement('form');
    form.className = 'form-card';

    // Add parameter inputs
    machine.parameters.forEach(param => {
      const value = run?.parameterValues[param.id];
      const input = Components.parameterInput(param, value);
      form.appendChild(input);
    });

    // Rating
    form.appendChild(Components.ratingInput('rating', run?.rating, 'Rating (Optional)'));

    // Notes
    form.appendChild(Components.textarea('notes', run?.notes || '', 'Notes (Optional)', 'e.g., Slightly bitter, reduce temp next time'));

    const submitBtn = Components.button(isEdit ? 'Update Run' : 'Save Run', null, 'primary', 'submit');
    const cancelBtn = Components.button('Cancel', () => Router.goBack(), 'secondary');

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

    card.innerHTML = `
      <div class="entity-card-header">
        <h3 class="entity-card-title">${Helpers.escapeHTML(machine.name)}</h3>
      </div>
      <div class="entity-card-meta">
        <span>${machine.parameters.length} parameter${machine.parameters.length !== 1 ? 's' : ''}</span>
        <span>${Repository.MachineRepository.getRunCount(machine.id)} run${Repository.MachineRepository.getRunCount(machine.id) !== 1 ? 's' : ''}</span>
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
      freshnessLabel = 'Fresh';
      freshnessType = 'success';
    } else if (daysSince <= Config.BEAN_FRESHNESS.GOOD) {
      freshnessLabel = 'Good';
      freshnessType = 'info';
    } else if (daysSince <= Config.BEAN_FRESHNESS.AGING) {
      freshnessLabel = 'Aging';
      freshnessType = 'warning';
    } else {
      freshnessLabel = 'Old';
      freshnessType = 'danger';
    }

    card.innerHTML = `
      <div class="entity-card-header">
        <h3 class="entity-card-title">${Helpers.escapeHTML(bean.name)}</h3>
        <span class="badge badge-${freshnessType}">${freshnessLabel}</span>
      </div>
      <div class="entity-card-meta">
        <span>Purchased: ${Helpers.formatDateDisplay(bean.purchaseDate)}</span>
        <span>${daysSince} days ago</span>
        <span>${Repository.BeanRepository.getRunCount(bean.id)} run${Repository.BeanRepository.getRunCount(bean.id) !== 1 ? 's' : ''}</span>
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
    });
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

    actions.appendChild(Components.button('Edit', (e) => {
      e.stopPropagation();
      Router.navigate(`beans/${run.beanId}/machines/${run.machineId}/run/${run.id}`);
    }, 'secondary', 'sm'));

    actions.appendChild(Components.button('Delete', (e) => {
      e.stopPropagation();
      Components.confirm('Are you sure you want to delete this run?', () => {
        AppState.deleteRun(run.id);
      });
    }, 'danger', 'sm'));

    card.appendChild(actions);

    return card;
  }

  /**
   * Helper: Handle bean deletion
   */
  function handleDeleteBean(beanId) {
    const count = Repository.BeanRepository.getRunCount(beanId);
    const message = count > 0
      ? `This bean has ${count} run${count !== 1 ? 's' : ''}. Are you sure you want to delete it? This cannot be undone.`
      : 'Are you sure you want to delete this bean?';

    Components.confirm(message, () => {
      try {
        // Delete all runs first
        if (count > 0) {
          Repository.RunRepository.deleteByBean(beanId);
        }
        AppState.deleteBean(beanId);
        Router.navigate('beans');
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
