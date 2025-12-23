# Claude's Plan: Bayesian Optimization for Coffee Tracker

## Project Context

This is a **vanilla JavaScript coffee tracker application** with zero dependencies and no build tools. The app runs entirely in the browser using localStorage for persistence. Users track coffee beans, brewing machines, and brewing runs with ratings (1-10 stars).

### Current Tech Stack
- **Frontend**: Vanilla JavaScript (ES6+) with IIFE module pattern
- **No frameworks**: No React, Vue, Angular, webpack, npm, or build tools
- **Storage**: Browser localStorage (5-10MB limit)
- **Architecture**: Clean separation - data layer, state management, UI layer
- **Deployment**: Static files served directly (GitHub Pages)

### Existing Data Model

**Coffee Machine:**
```javascript
{
  id: "uuid",
  name: "Espresso Machine",
  parameters: [
    {
      id: "uuid",
      name: "Grind Size",
      type: "slider",  // or "number", "dropdown", "text"
      config: {
        min: 1,
        max: 20,
        step: 0.5,
        default: 10
      }
    },
    // ... more parameters
  ],
  createdAt: timestamp
}
```

**Coffee Bean:**
```javascript
{
  id: "uuid",
  name: "Ethiopian Yirgacheffe",
  purchaseDate: "2024-01-15",
  notes: "Floral, citrus notes",
  createdAt: timestamp
}
```

**Brewing Run:**
```javascript
{
  id: "uuid",
  beanId: "uuid",           // Foreign key to bean
  machineId: "uuid",        // Foreign key to machine
  parameterValues: {
    "param-id-1": 18.5,     // Grind Size value
    "param-id-2": 93,       // Temperature value
    // ...
  },
  rating: 8,                // 1-10 (null if not rated)
  notes: "Great shot!",
  starred: false,           // Only one starred per bean-machine combo
  timestamp: Date.now()
}
```

**Hierarchy:** Bean → Machine → Runs (many runs per bean-machine combination)

### Parameter Types Explained

1. **`slider`**: Bounded numeric with min/max/step (e.g., grind size 1-20)
2. **`number`**: Unbounded numeric input (e.g., temperature °C)
3. **`dropdown`**: Categorical select (e.g., ["Light", "Medium", "Dark"])
4. **`text`**: Free-form text (e.g., notes)

### Project Goal

**Add Bayesian Optimization to suggest optimal brewing parameters!**

Users want AI to analyze their rated runs and suggest the next best parameter combination to try. The hierarchy is Bean → Machine → Runs, so we need **one BO instance per bean-machine combination**.

**User Requirements:**
1. BO service **decoupled** from main app with clean API
2. AI suggestion appears as **virtual run at top of runs list**
3. Virtual run has **gradient purple background** with "🤖 AI Suggested" badge
4. **Configurable threshold** (default: 5 runs) before BO activates
5. **Below threshold**: Blur effect + "Needs more data" overlay + "Show Anyway" button
6. **Above threshold**: Clickable "Make This Run" button → prefills run form
7. **Exclude text parameters**, include slider/number/dropdown
8. **Ordinal encoding** for dropdowns (assume options have natural order)
9. Auto-retrain BO when new rated run is added

---

## Implementation Plan Overview

Add Bayesian Optimization (BO) to suggest optimal brewing parameters based on historical ratings. The BO service will be **fully decoupled** from the main app with a clean API, using a custom lightweight implementation compatible with the vanilla JavaScript architecture.

## Key Design Decisions

### Architecture
- **Custom BO Implementation**: Build a lightweight Gaussian Process with RBF kernel (~630 lines total) rather than using external libraries (no suitable browser-ready libraries exist)
- **Decoupled Service**: BO lives in `js/bayesian/` directory with clean API boundaries
- **Storage**: BO state stored in localStorage under `coffee_tracker_bo_state` key
- **Per-Combo Optimization**: One BO instance per bean-machine combination, automatically updated when rated runs are created

### Data Handling
- **Include**: `slider` and `number` parameters (numeric, optimizable)
- **Include**: `dropdown` parameters with ordinal encoding (0, 1, 2... based on option order)
- **Exclude**: `text` parameters (non-optimizable)
- **Normalization**: All parameters normalized to [0, 1] for GP, then denormalized for display

### User Experience
- **AI Suggestion Card**: Virtual run displayed at top of runs list with gradient purple background
- **Threshold Logic**: Configurable minimum runs (default: 5) before BO activates
  - **Below threshold**: Card is blurred with "Needs more data" overlay + "Show Anyway" button
  - **Above threshold**: Card is visible and clickable
- **"Make This Run"**: Button navigates to run form with prefilled AI-suggested values via URL query parameter

## File Structure

### New Files (630 lines total)

```
js/bayesian/
├── kernels.js              (~50 lines)  - RBF kernel implementation
├── gaussianProcess.js      (~200 lines) - GP with fit/predict, matrix operations
├── acquisitionFunctions.js (~30 lines)  - UCB acquisition function
├── boService.js            (~300 lines) - Main BO API (init, update, suggest)
└── boStorage.js            (~50 lines)  - BO state persistence to localStorage
```

### Modified Files

1. **`js/config.js`** - Add BO configuration constants
2. **`js/data/repository.js`** - Add `BOService.updateWithRun()` hook after run creation
3. **`js/ui/views.js`** - Modify `renderRunList()` to show AI suggestion; modify `renderRunForm()` to handle prefill query param
4. **`js/ui/components.js`** - Add `aiSuggestionCard()` component
5. **`css/components.css`** - Add AI suggestion card styles (gradient purple background, blur effect, etc.)
6. **`index.html`** - Load BO modules after data layer, before UI layer

## Implementation Details

### 1. BO Service API

**Core Functions:**
```javascript
BOService.initializeOptimizer(beanId, machineId)  // Create empty BO state
BOService.updateWithRun(beanId, machineId, run)   // Train with new rated run
BOService.suggestParameters(beanId, machineId)    // Get AI suggestion as run object
BOService.isReady(beanId, machineId)              // Check if >= threshold runs
BOService.getConfig() / setConfig(updates)        // Manage configuration
BOService.clearOptimizer(beanId, machineId)       // Clear BO state
```

**BO State Structure (localStorage):**
```javascript
{
  "bean-id_machine-id": {
    observations: [
      { parameters: [18, 93, 9], rating: 0.85 },  // Normalized
      ...
    ],
    parameterMetadata: [
      { id: "param-id", name: "Dose", type: "number", min: 15, max: 22 },
      ...
    ],
    gpHyperparameters: { lengthScale: 0.3, outputScale: 1.0, noise: 0.1 },
    lastUpdated: timestamp
  }
}
```

### 2. Data Pipeline

**Run → Observation:**
1. Filter parameters: Keep slider/number/dropdown, exclude text
2. Extract values from `run.parameterValues[paramId]`
3. Normalize:
   - Sliders: `(value - min) / (max - min)`
   - Numbers: Use historical min/max with 20% padding
   - Dropdowns: `options.indexOf(value) / (options.length - 1)`
4. Normalize rating: `(rating - 1) / 9` (1-10 → 0-1)

**Suggestion → Run:**
1. GP suggests optimal normalized parameters via UCB acquisition
2. Denormalize values back to original scales
3. Create run object with `isAISuggestion: true`, `rating: null`
4. Fill text parameters with defaults

### 3. Integration Points

**Repository Hook (`js/data/repository.js` line ~285):**
```javascript
// In RunRepository.create(), after saving run:
const run = Models.RunModel.create(...);
runs.push(run);
Storage.set(Config.STORAGE_KEYS.RUNS, runs);

// NEW: Update BO if run is rated
if (run.rating !== null) {
  BOService.updateWithRun(run.beanId, run.machineId, run);
}

return run;
```

**UI Rendering (`js/ui/views.js` renderRunList()):**
```javascript
// After getting runs, before rendering:
const runs = Repository.RunRepository.getByBeanAndMachine(beanId, machineId);

// Get AI suggestion
const aiSuggestion = BOService.suggestParameters(beanId, machineId);
const isBoReady = BOService.isReady(beanId, machineId);

// Render AI card if suggestion exists
if (aiSuggestion) {
  const suggestionCard = Components.aiSuggestionCard(
    aiSuggestion, bean, machine, isBoReady,
    BOService.getConfig().minRunsThreshold
  );
  container.appendChild(suggestionCard);
}

// Render existing runs...
```

**Prefill Form (`js/ui/views.js` renderRunForm() line ~703):**
```javascript
// Extract prefill from URL query params
const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
const prefillData = urlParams.get('prefill')
  ? JSON.parse(decodeURIComponent(urlParams.get('prefill')))
  : null;

// When creating parameter inputs:
machine.parameters.forEach(param => {
  const value = run?.parameterValues[param.id]
    || prefillData?.[param.id];  // Use prefill if available
  const input = Components.parameterInput(param, value);
  form.appendChild(input);
});
```

### 4. AI Suggestion Card Component

**Visual Design:**
- Gradient purple background (`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`)
- Header: "🤖 AI Suggested" badge + status ("Ready" or "Needs more data")
- Parameter list: Show all parameter values in white text
- Blur effect when below threshold
- Overlay with "Needs more data" message + "Show Anyway" button
- "Make This Run" button navigates to form with `?prefill=...` query param

**CSS Classes:**
- `.ai-suggestion-card` - Main container
- `.ai-suggestion-card.blurred` - Apply `filter: blur(8px)` + `pointer-events: none`
- `.ai-suggestion-overlay` - Overlay for "needs more data" message
- `.ai-badge`, `.ai-status`, `.ai-suggestion-params` - Layout components

### 5. Edge Cases

**No Optimizable Parameters:**
- `initializeOptimizer()` returns `null` if zero numeric/dropdown parameters
- UI doesn't show suggestion card

**All Same Rating:**
- GP handles flat posteriors (relies on variance for exploration)
- Add small jitter (`Math.random() * 0.01`) to ratings if needed

**Machine Parameters Change:**
- Clear BO state when machine.parameters are modified
- Add to `MachineRepository.update()`: `BOService.clearOptimizer(beanId, machineId)` for all affected bean-machine combos

**localStorage Size:**
- Limit to 100 most recent observations per combo
- Implement in `updateWithRun()`:
  ```javascript
  if (state.observations.length > 100) {
    state.observations = state.observations.slice(-100);
  }
  ```

**Numerical Stability:**
- Use Cholesky decomposition for matrix inversion
- Add jitter to kernel matrix diagonal (noise term)
- Catch errors and fallback to random suggestion

## Implementation Phases (Estimated 12 days)

### Phase 1: Foundation (Days 1-2)
1. Create `js/bayesian/` directory structure
2. Implement `kernels.js` (RBF kernel)
3. Implement `gaussianProcess.js` (matrix ops, GP class)
4. Implement `boStorage.js`
5. Test GP with synthetic 1D data in console

### Phase 2: BO Service (Days 3-4)
1. Implement `acquisitionFunctions.js` (UCB)
2. Implement `boService.js` (all API functions)
3. Add BO config to `js/config.js`
4. Load modules in `index.html`
5. Test in console: create runs → BO updates → get suggestions

### Phase 3: Integration (Days 5-6)
1. Add `BOService.updateWithRun()` hook to `repository.js`
2. Test end-to-end: create runs → BO updates
3. Add config persistence for BO settings

### Phase 4: UI Implementation (Days 7-8)
1. Implement `Components.aiSuggestionCard()` in `components.js`
2. Add CSS styles to `components.css`
3. Modify `renderRunList()` to show AI suggestion
4. Implement "needs more data" blur + "show anyway" button
5. Wire up "Make This Run" button

### Phase 5: Form Prefill (Day 9)
1. Modify `renderRunForm()` to parse `?prefill=` query param
2. Populate form inputs with prefilled values
3. Test: Click AI suggestion → form pre-fills → save run

### Phase 6: Edge Cases & Polish (Days 10-11)
1. Handle zero optimizable parameters
2. Handle all same ratings (jitter)
3. Clear BO on machine parameter changes
4. Add BO config UI to dashboard
5. Implement observation limit (100 per combo)

### Phase 7: Testing & Docs (Day 12)
1. Test with various machines (espresso, pour-over, etc.)
2. Test different parameter types (slider/number/dropdown)
3. Test edge cases
4. Add code comments and JSDoc

## Detailed Component Implementations

### 1. RBF Kernel (`js/bayesian/kernels.js`)

```javascript
const Kernels = (function() {
  'use strict';

  /**
   * Radial Basis Function (RBF) / Squared Exponential Kernel
   */
  class RBFKernel {
    constructor(lengthScale = 1.0, outputScale = 1.0) {
      this.lengthScale = lengthScale;
      this.outputScale = outputScale;
    }

    /**
     * Compute kernel value between two points
     * k(x1, x2) = σ² * exp(-0.5 * ||x1-x2||² / l²)
     */
    compute(x1, x2) {
      let squaredDist = 0;
      for (let i = 0; i < x1.length; i++) {
        const diff = x1[i] - x2[i];
        squaredDist += diff * diff;
      }

      return this.outputScale * Math.exp(
        -0.5 * squaredDist / (this.lengthScale * this.lengthScale)
      );
    }
  }

  return { RBFKernel };
})();
```

### 2. Gaussian Process (`js/bayesian/gaussianProcess.js`)

**Key Methods:**
- `fit(X, y)` - Train GP on observations
- `predict(X_test)` - Predict mean and variance at new points
- Matrix operations: `_computeKernelMatrix()`, `_choleskyInverse()`, `_matmul()`, etc.

**Implementation Notes:**
- Use Cholesky decomposition for numerical stability
- Cache inverse kernel matrix
- Add small jitter (noise) to diagonal for stability

### 3. Acquisition Functions (`js/bayesian/acquisitionFunctions.js`)

```javascript
const AcquisitionFunctions = (function() {
  'use strict';

  /**
   * Upper Confidence Bound (UCB)
   * UCB(x) = mean(x) + β * stddev(x)
   */
  function ucb(mean, variance, exploration = 2.0) {
    const stddev = Math.sqrt(variance);
    return mean + exploration * stddev;
  }

  return { ucb };
})();
```

### 4. BO Service (`js/bayesian/boService.js`)

**Key Private Functions:**
- `_getOptimizableParameters(machine)` - Filter slider/number/dropdown
- `_makeKey(beanId, machineId)` - Create storage key
- `_runToObservation(run, machine, metadata)` - Convert run to normalized observation
- `_suggestionToRun(suggestion, machine, beanId, machineId, metadata)` - Convert normalized suggestion to run
- `_normalizeParameter(value, param, metadata)` - Normalize single parameter
- `_denormalizeParameter(normalized, param, metadata)` - Denormalize single parameter
- `_generateCandidates(numDims, numCandidates)` - Random sampling for acquisition optimization

### 5. AI Suggestion Card (`js/ui/components.js`)

```javascript
function aiSuggestionCard(suggestion, bean, machine, isReady, threshold) {
  const card = document.createElement('div');
  card.className = `ai-suggestion-card ${!isReady ? 'blurred' : ''}`;

  // Header with badge
  const header = document.createElement('div');
  header.className = 'ai-suggestion-header';
  header.innerHTML = `
    <div class="ai-badge">🤖 AI Suggested</div>
    <div class="ai-status">${isReady ? 'Ready' : 'Needs more data'}</div>
  `;
  card.appendChild(header);

  // Parameters
  const paramsDiv = document.createElement('div');
  paramsDiv.className = 'ai-suggestion-params';

  machine.parameters.forEach(param => {
    const value = suggestion.parameterValues[param.id];
    if (value !== undefined && value !== null) {
      const paramRow = document.createElement('div');
      paramRow.className = 'param-row';
      paramRow.innerHTML = `
        <span class="param-name">${Helpers.escapeHTML(param.name)}:</span>
        <span class="param-value">${Helpers.escapeHTML(String(value))}</span>
      `;
      paramsDiv.appendChild(paramRow);
    }
  });
  card.appendChild(paramsDiv);

  // Actions / Overlay
  if (!isReady) {
    const overlay = document.createElement('div');
    overlay.className = 'ai-suggestion-overlay';
    overlay.innerHTML = `<p>Need at least ${threshold} rated runs for AI suggestions</p>`;

    const showAnywayBtn = Components.button('Show Anyway', () => {
      card.classList.remove('blurred');
      overlay.remove();
    }, 'secondary', 'button');

    overlay.appendChild(showAnywayBtn);
    card.appendChild(overlay);
  } else {
    const actions = document.createElement('div');
    actions.className = 'ai-suggestion-actions';

    const makeRunBtn = Components.button('Make This Run', () => {
      const serialized = encodeURIComponent(JSON.stringify(suggestion.parameterValues));
      Router.navigate(`beans/${suggestion.beanId}/machines/${suggestion.machineId}/run/new?prefill=${serialized}`);
    }, 'primary', 'button');

    actions.appendChild(makeRunBtn);
    card.appendChild(actions);
  }

  return card;
}
```

### 6. CSS Styles (`css/components.css`)

```css
/* AI Suggestion Card */
.ai-suggestion-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  position: relative;
  transition: all 0.3s ease;
}

.ai-suggestion-card.blurred {
  filter: blur(8px);
  pointer-events: none;
}

.ai-suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.ai-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
}

.ai-status {
  font-size: 0.85rem;
  opacity: 0.9;
}

.ai-suggestion-params {
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.ai-suggestion-params .param-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.ai-suggestion-params .param-row:last-child {
  border-bottom: none;
}

.ai-suggestion-params .param-name {
  font-weight: 500;
}

.ai-suggestion-params .param-value {
  font-weight: 700;
}

.ai-suggestion-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
}

.ai-suggestion-overlay p {
  color: white;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.ai-suggestion-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
```

---

## Existing Codebase Structure & Context

### Directory Structure
```
/home/paul/vsc_projects/private_projects/coffee-tracker/
├── index.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── base.css
│   ├── components.css      # ADD AI CARD STYLES HERE
│   └── pages.css
└── js/
    ├── utils/
    │   ├── helpers.js
    │   └── validators.js
    ├── i18n.js
    ├── config.js            # ADD BO_CONFIG HERE
    ├── data/
    │   ├── storage.js
    │   ├── models.js
    │   ├── repository.js    # ADD BO HOOK IN RunRepository.create()
    │   └── exportImport.js
    ├── state/
    │   └── appState.js
    ├── ui/
    │   ├── components.js    # ADD aiSuggestionCard() HERE
    │   ├── router.js
    │   └── views.js         # MODIFY renderRunList() & renderRunForm()
    ├── main.js
    └── bayesian/            # CREATE THIS DIRECTORY
        ├── kernels.js
        ├── gaussianProcess.js
        ├── acquisitionFunctions.js
        ├── boService.js
        └── boStorage.js
```

### Key Existing Modules

**`Config` (js/config.js):**
```javascript
const Config = {
  PARAMETER_TYPES: {
    NUMBER: 'number',
    SLIDER: 'slider',
    TEXT: 'text',
    DROPDOWN: 'dropdown'
  },
  STORAGE_KEYS: {
    MACHINES: 'coffee_tracker_machines',
    BEANS: 'coffee_tracker_beans',
    RUNS: 'coffee_tracker_runs',
    // ADD: BO_STATE: 'coffee_tracker_bo_state'
  },
  VALIDATION: {
    RATING_MIN: 1,
    RATING_MAX: 10,
    // ...
  },
  // ADD: BO_CONFIG section
};
```

**`Storage` (js/data/storage.js):**
```javascript
const Storage = {
  get(key, defaultValue = null),  // Returns parsed JSON
  set(key, value),                 // Stores JSON
  remove(key),
  // ... error handling, quota detection
};
```

**`Repository.RunRepository` (js/data/repository.js ~line 200-300):**
```javascript
const RunRepository = {
  getAll() { return Storage.get(Config.STORAGE_KEYS.RUNS, []); },

  getById(id) { /* ... */ },

  getByBeanAndMachine(beanId, machineId) {
    return this.getAll().filter(r =>
      r.beanId === beanId && r.machineId === machineId
    );
  },

  create(data) {
    const run = Models.RunModel.create(
      data.beanId,
      data.machineId,
      data.parameterValues,
      data.rating,
      data.notes,
      data.starred
    );

    // Validate
    const errors = Models.RunModel.validate(run, machine);
    if (errors.length > 0) throw new Error(errors.join(', '));

    // Handle starred runs (only one per bean-machine)
    const runs = this.getAll();
    if (run.starred) {
      runs.forEach(r => {
        if (r.beanId === run.beanId && r.machineId === run.machineId) {
          r.starred = false;
        }
      });
    }

    runs.push(run);
    Storage.set(Config.STORAGE_KEYS.RUNS, runs);

    // >>> ADD HERE: BOService.updateWithRun(run.beanId, run.machineId, run)

    return run;
  },

  update(id, data) { /* ... */ },
  delete(id) { /* ... */ }
};
```

**`Components` (js/ui/components.js):**
```javascript
const Components = (function() {
  'use strict';

  return {
    button(text, onClick, variant, type),
    alert(message, type),
    emptyState(options),
    parameterInput(param, value),  // Renders slider/number/text/dropdown
    ratingInput(name, value, label),
    textarea(name, value, label, placeholder),
    // >>> ADD: aiSuggestionCard(suggestion, bean, machine, isReady, threshold)
  };
})();
```

**`Views.renderRunList()` (js/ui/views.js ~line 360-450):**
```javascript
function renderRunList() {
  const container = appContainer();
  container.innerHTML = '';

  const { beanId, machineId } = AppState.getState().routeParams;
  const bean = Repository.BeanRepository.getById(beanId);
  const machine = Repository.MachineRepository.getById(machineId);

  // ... header rendering ...

  const runs = Repository.RunRepository.getByBeanAndMachine(beanId, machineId);

  // >>> ADD HERE: Get and render AI suggestion
  // const aiSuggestion = BOService.suggestParameters(beanId, machineId);
  // if (aiSuggestion) { container.appendChild(aiSuggestionCard(...)); }

  if (runs.length === 0) {
    // Empty state
    return;
  }

  // Render run cards
  runs.forEach(run => {
    const runCard = createRunCard(run, bean, machine);
    container.appendChild(runCard);
  });
}
```

**`Views.renderRunForm()` (js/ui/views.js ~line 669-755):**
```javascript
function renderRunForm() {
  const container = appContainer();
  container.innerHTML = '';

  const { beanId, machineId, runId } = AppState.getState().routeParams;
  const bean = Repository.BeanRepository.getById(beanId);
  const machine = Repository.MachineRepository.getById(machineId);
  const run = runId ? Repository.RunRepository.getById(runId) : null;
  const isEdit = !!run;

  // ... header ...

  const form = document.createElement('form');

  // >>> ADD HERE: Parse ?prefill= query param from URL
  // const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
  // const prefillData = urlParams.get('prefill') ? JSON.parse(...) : null;

  // Add parameter inputs
  machine.parameters.forEach(param => {
    const value = run?.parameterValues[param.id];  // >>> OR prefillData?.[param.id]
    const input = Components.parameterInput(param, value);
    form.appendChild(input);
  });

  // Rating, notes, submit...

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const parameterValues = {};
    machine.parameters.forEach(param => {
      parameterValues[param.id] = formData.get(`param_${param.id}`);
    });

    const data = {
      beanId, machineId, parameterValues,
      rating: formData.get('rating') ? Number(formData.get('rating')) : null,
      notes: formData.get('notes')
    };

    if (isEdit) {
      AppState.updateRun(runId, data);
    } else {
      AppState.createRun(data);
    }
    Router.navigate(`beans/${beanId}/machines/${machineId}`);
  });

  container.appendChild(form);
}
```

**`index.html` Script Loading Order:**
```html
<!-- Utilities -->
<script src="js/utils/helpers.js"></script>
<script src="js/i18n.js"></script>
<script src="js/config.js"></script>

<!-- Data Layer -->
<script src="js/data/storage.js"></script>
<script src="js/data/models.js"></script>
<script src="js/data/repository.js"></script>
<script src="js/data/exportImport.js"></script>

<!-- >>> ADD BAYESIAN OPTIMIZATION HERE (after data, before state) -->
<!-- <script src="js/bayesian/kernels.js"></script> -->
<!-- <script src="js/bayesian/gaussianProcess.js"></script> -->
<!-- <script src="js/bayesian/acquisitionFunctions.js"></script> -->
<!-- <script src="js/bayesian/boStorage.js"></script> -->
<!-- <script src="js/bayesian/boService.js"></script> -->

<!-- State Management -->
<script src="js/state/appState.js"></script>

<!-- UI Layer -->
<script src="js/utils/validators.js"></script>
<script src="js/ui/components.js"></script>
<script src="js/ui/router.js"></script>
<script src="js/ui/views.js"></script>

<!-- Main Entry Point -->
<script src="js/main.js"></script>
```

### Important Code Patterns

**IIFE Module Pattern:**
```javascript
const ModuleName = (function() {
  'use strict';

  // Private variables/functions
  let privateVar = 'value';

  function privateFunction() {
    // ...
  }

  // Public API
  return {
    publicMethod() {
      // Can access privateVar, privateFunction
    }
  };
})();
```

**Translation Helper (used in views):**
```javascript
const t = (key, params) => I18n.t(key, params);
// Usage: title.textContent = t('newRunTitle');
```

**HTML Escaping:**
```javascript
// Always escape user input when setting innerHTML
card.innerHTML = `<h3>${Helpers.escapeHTML(machine.name)}</h3>`;
```

---

## Implementation Checklist

Use this checklist to track implementation progress:

### Phase 1: Foundation
- [ ] Create `js/bayesian/` directory
- [ ] Implement `js/bayesian/kernels.js` (RBF kernel)
- [ ] Implement `js/bayesian/gaussianProcess.js` (matrix ops, GP class)
- [ ] Implement `js/bayesian/boStorage.js` (localStorage wrapper)
- [ ] Test GP in browser console with synthetic 1D data

### Phase 2: BO Service
- [ ] Implement `js/bayesian/acquisitionFunctions.js` (UCB)
- [ ] Implement `js/bayesian/boService.js` (full API)
- [ ] Add `BO_CONFIG` to `js/config.js`
- [ ] Load BO modules in `index.html` (correct order)
- [ ] Test BO service in console (init, update, suggest)

### Phase 3: Integration
- [ ] Add `BOService.updateWithRun()` hook to `js/data/repository.js` (RunRepository.create)
- [ ] Test: Create rated runs → verify BO state updates in localStorage
- [ ] Add BO config persistence (if needed)

### Phase 4: UI
- [ ] Implement `Components.aiSuggestionCard()` in `js/ui/components.js`
- [ ] Add CSS styles to `css/components.css` (gradient purple, blur, etc.)
- [ ] Modify `Views.renderRunList()` to show AI suggestion card
- [ ] Implement blur overlay for "needs more data"
- [ ] Wire "Make This Run" button to navigate with `?prefill=`

### Phase 5: Form Prefill
- [ ] Modify `Views.renderRunForm()` to parse `?prefill=` query param
- [ ] Populate form inputs with prefilled values
- [ ] Test: Click AI suggestion → form pre-fills → save run

### Phase 6: Edge Cases
- [ ] Handle zero optimizable parameters (no suggestion)
- [ ] Handle all same ratings (add jitter or message)
- [ ] Clear BO state when machine parameters change
- [ ] Add observation limit (100 per combo)
- [ ] Error handling & fallback behavior

### Phase 7: Polish
- [ ] Add BO config UI to dashboard (optional)
- [ ] Test with various machines (espresso, pour-over, etc.)
- [ ] Test different parameter types
- [ ] Add code comments and JSDoc
- [ ] Update README (if desired)

---

## Success Criteria

**When implementation is complete:**
1. ✅ AI-suggested run appears at top of runs list with purple gradient
2. ✅ Below threshold (e.g., <5 runs): suggestion is blurred with overlay
3. ✅ "Show Anyway" button reveals blurred suggestion
4. ✅ Above threshold: suggestion is visible with "Make This Run" button
5. ✅ Clicking "Make This Run" navigates to form with pre-filled parameters
6. ✅ Saving a rated run automatically updates BO state
7. ✅ BO suggests different parameters each time (exploration)
8. ✅ Over time, BO suggestions converge toward higher ratings
9. ✅ Machine with zero numeric parameters: no suggestion shown
10. ✅ All code follows existing IIFE module pattern, zero external dependencies

---

## Configuration Options

**Exposed in `BOService.getConfig()` / `setConfig()`:**
```javascript
{
  minRunsThreshold: 5,        // User-configurable via dashboard
  explorationFactor: 2.0,     // UCB exploration (higher = more exploration)
  numCandidates: 100,         // Candidates evaluated for suggestion
  kernelLengthScale: 0.3,     // GP kernel param
  kernelOutputScale: 1.0,     // GP kernel param
  kernelNoise: 0.1            // GP observation noise
}
```

---

## Questions & Clarifications

If you have questions during implementation:
1. **Parameter encoding**: Dropdowns use ordinal encoding (0, 1, 2...) assuming natural order
2. **Threshold**: Configurable via `BOService.setConfig({ minRunsThreshold: N })`
3. **Exploration**: UCB acquisition with exploration factor 2.0 (tune if needed)
4. **Storage limit**: Keep last 100 observations per bean-machine combo
5. **Numerical issues**: Use Cholesky decomposition + small jitter for stability

---

## Notes on JavaScript BO Libraries

Research found no suitable browser-ready Bayesian optimization libraries:
- `gaussian-process.js` - Requires sylvester.js, outdated
- `bayesian-optimizer` - npm package, unclear browser support
- `hpjs` - Focuses on ML hyperparameter tuning, not parameter optimization

**Decision: Custom implementation is justified** given:
- Low dimensionality (3-6 parameters typical for coffee machines)
- Zero-dependency requirement
- Simple GP with RBF kernel is sufficient
- Total ~630 lines of well-structured code

---

## Getting Started

**For a fresh Claude instance:**

1. Read this entire document to understand the project context and requirements
2. Start with Phase 1: Foundation - implement the core BO math (GP, kernels)
3. Test each phase incrementally in the browser console
4. Follow the checklist and mark items as complete
5. Ask clarifying questions if any requirements are ambiguous

**Working directory:** `/home/paul/vsc_projects/private_projects/coffee-tracker/`

The codebase is clean and well-structured, making this integration straightforward. Focus on one phase at a time, test incrementally, and you'll have a working BO system in no time. Good luck!
