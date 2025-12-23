# BO Curve Visualization Feature - Implementation Plan

## Executive Summary

Implement an interactive Bayesian Optimization curve visualization showing predicted rating vs. individual parameters, with uncertainty bands and real-time slider interaction.

**Feature Goal**: Visualize 2D slices through high-dimensional BO landscape
- X-axis: One parameter value (variable)
- Y-axis: Predicted star rating (1-10)
- Interactive sliders (one per parameter) in colored boxes
- When user drags a slider, plot updates showing:
  - Golden mean curve (predicted rating across parameter range)
  - Colored uncertainty band (±2σ, colored by active parameter)
  - Vertical bar at current slider position
  - Actual rated run data points overlaid

---

## Current Codebase Architecture

### Technology Stack
- **Vanilla JavaScript (ES6+)** - IIFE module pattern
- **Zero dependencies** - No npm, no build tools, no frameworks
- **Zero plotting libraries** - Pure Canvas implementation needed
- **Observable pattern** for state management
- **Hash-based SPA routing**

### Key Existing Files

#### Bayesian Optimization Core
```
/js/bayesian/
├── gaussianProcess.js       # GP with predict() API (lines 78-119)
├── boService.js             # Main BO API with normalization (lines 374-491)
├── acquisitionFunctions.js  # UCB implementation
├── kernels.js               # RBF kernel
└── boStorage.js             # localStorage persistence
```

#### UI Layer
```
/js/ui/
├── components.js            # Reusable UI components (add visualization here)
├── views.js                 # Page-level rendering (integration point)
└── router.js                # Hash-based routing
```

#### Data & Config
```
/js/
├── config.js                # PARAMETER_TYPES, BO_CONFIG (lines 26-32, 172-182)
├── data/models.js           # Parameter schemas (lines 98-207)
└── data/repository.js       # CRUD + BO hooks
```

### Existing BO APIs

**Gaussian Process Prediction** (`gaussianProcess.js:78-119`):
```javascript
const gp = new GP(kernel, noise);
gp.fit(X_train, y_train);  // Train on observations
const {mean, variance} = gp.predict(X_test);  // Returns parallel arrays
```

**BOService** (`boService.js`):
```javascript
BOService.isReady(beanId, machineId)           // Returns bool if >= 5 runs
BOService.suggestParameters(beanId, machineId) // Returns {expectedRating, variance, ...}

// Internal normalization (lines 374-491)
_normalizeParameter(value, parameter)     // value → [0,1]
_denormalizeParameter(normValue, param)   // [0,1] → value
```

**Parameter Types** (`config.js:26-32`):
```javascript
PARAMETER_TYPES: {
  SLIDER: 'slider',    // {min, max, step, default}
  NUMBER: 'number',    // {default} - unbounded
  DROPDOWN: 'dropdown',// {options: []} - ordinal encoded
  TEXT: 'text'         // Excluded from BO
}
```

**BO Configuration** (`config.js:172-182`):
```javascript
BO_CONFIG: {
  MIN_RUNS_THRESHOLD: 5,          // Min runs before BO activates
  KERNEL_LENGTH_SCALE: 0.3,
  KERNEL_OUTPUT_SCALE: 1.0,
  KERNEL_NOISE: 0.1,
  NUMBER_PARAM_PADDING: 0.2       // 20% padding for unbounded numbers
}
```

**Parameter Normalization Details** (`boService.js:374-491`):
- **Slider**: `(value - min) / (max - min)` → [0,1]
- **Number**: Dynamic min/max from historical data + 20% padding → [0,1]
- **Dropdown**: Ordinal encoding `index / (options.length - 1)` → [0,1]

**Current AI Suggestion Display** (`components.js:671-811`):
- Text-only display: "7.5 ± 1.2 (6.3-8.7)"
- Gradient purple background
- "Make This Run" button prefills form

---

## User Requirements & Design Decisions

### Core User Choices (from Q&A)

1. **Categorical Parameters**: Discrete slider (snap to valid categories only, no interpolation)
2. **Number Parameter Ranges**: Historical data range + 20% padding (same as BO uses)
3. **Fixed Values**: Other params fixed at current slider positions (interactive exploration)
4. **Plot Additions**:
   - Show actual rated runs as points
   - Show current slider position indicator (vertical bar)

### Visual Design Elements

- **Mean curve**: Golden color `#D4A574` (matching star rating theme)
- **Uncertainty band**: Colored by active parameter (shaded ±2σ region)
- **Vertical position bar**: Shows current slider value
- **Color-coded sliders**: Each parameter has unique color (same as its uncertainty band)
- **Active feedback**: When slider moves, plot transitions to that slider's color
- **Data points**: Small circles overlaid on curve showing actual rated runs

---

## Implementation Plan

### Phase 1: Core API Extension

**File**: `/js/bayesian/boService.js`

**Add new function** `getPredictionCurve()`:

```javascript
/**
 * Get prediction curve for a single parameter
 * @param {string} beanId
 * @param {string} machineId
 * @param {number} paramIndex - Index in parameterMetadata array
 * @param {object} options - {numPoints: 50, fixedValues: {paramId: value}}
 * @returns {object|null} {
 *   paramValues: number[],      // Denormalized parameter values
 *   ratings: number[],           // Predicted ratings (1-10 scale)
 *   uncertainties: number[],     // Standard deviations (rating scale)
 *   parameterName: string,
 *   parameterType: string,
 *   validIndices: number[]|null  // For categorical: indices of valid positions
 * }
 */
function getPredictionCurve(beanId, machineId, paramIndex, options = {}) {
  const numPoints = options.numPoints || 50;
  const fixedValues = options.fixedValues || {};

  // 1. Load BO state
  const key = _makeKey(beanId, machineId);
  const state = BOStorage.get(key);
  if (!state || state.observations.length === 0) return null;

  // 2. Get parameter metadata
  const targetParam = state.parameterMetadata[paramIndex];

  // 3. Get machine to access full parameter configs
  const machine = Repository.MachineRepository.getById(machineId);
  const fullParam = machine.parameters.find(p => p.id === targetParam.id);

  // 4. Generate sample points for target parameter
  const normalizedSamples = _generateParameterSamples(
    fullParam,
    numPoints,
    state.observations  // For dynamic NUMBER ranges
  );

  // 5. Build test vectors (fix other params at fixedValues)
  const X_test = normalizedSamples.map(normValue => {
    const testVector = new Array(state.parameterMetadata.length);

    state.parameterMetadata.forEach((param, idx) => {
      if (idx === paramIndex) {
        testVector[idx] = normValue;
      } else {
        // Normalize the fixed value for this parameter
        const fixedValue = fixedValues[param.id];
        const fullP = machine.parameters.find(p => p.id === param.id);
        testVector[idx] = _normalizeParameter(fixedValue, fullP, state.observations);
      }
    });

    return testVector;
  });

  // 6. Get GP predictions
  const kernel = new Kernels.RBFKernel(
    state.gpHyperparameters.lengthScale,
    state.gpHyperparameters.outputScale
  );
  const gp = new GaussianProcess.GP(kernel, state.gpHyperparameters.noise);

  const X_train = state.observations.map(obs => obs.parameters);
  const y_train = state.observations.map(obs => obs.rating);

  gp.fit(X_train, y_train);
  const {mean, variance} = gp.predict(X_test);

  // 7. Denormalize predictions and parameter values
  const paramValues = normalizedSamples.map(normValue =>
    _denormalizeParameter(normValue, fullParam, state.observations)
  );

  const ratings = mean.map(m => _denormalizeRating(m));
  const uncertainties = variance.map(v => Math.sqrt(v) * 9); // Rating scale stddev

  // 8. For categorical: identify valid discrete positions
  let validIndices = null;
  if (fullParam.type === Config.PARAMETER_TYPES.DROPDOWN) {
    validIndices = fullParam.config.options.map((_, optIdx) => {
      // Find closest sample point to this category's normalized value
      const normValue = fullParam.config.options.length === 1
        ? 0
        : optIdx / (fullParam.config.options.length - 1);

      let closestIdx = 0;
      let minDist = Math.abs(normalizedSamples[0] - normValue);

      for (let i = 1; i < normalizedSamples.length; i++) {
        const dist = Math.abs(normalizedSamples[i] - normValue);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      return closestIdx;
    });
  }

  return {
    paramValues,
    ratings,
    uncertainties,
    parameterName: fullParam.name,
    parameterType: fullParam.type,
    validIndices
  };
}

/**
 * Generate linearly spaced normalized samples for a parameter
 * @private
 */
function _generateParameterSamples(parameter, numPoints, observations) {
  const samples = [];

  if (parameter.type === Config.PARAMETER_TYPES.SLIDER) {
    // Use slider's min/max
    for (let i = 0; i < numPoints; i++) {
      samples.push(i / (numPoints - 1));
    }
  } else if (parameter.type === Config.PARAMETER_TYPES.NUMBER) {
    // Use dynamic range from observations
    // (Same logic as _normalizeParameter for NUMBER type)
    for (let i = 0; i < numPoints; i++) {
      samples.push(i / (numPoints - 1));
    }
  } else if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
    // Linear spacing (will snap discrete values later)
    for (let i = 0; i < numPoints; i++) {
      samples.push(i / (numPoints - 1));
    }
  }

  return samples;
}

/**
 * Denormalize rating from [0,1] to [1,10]
 * @private
 */
function _denormalizeRating(normalizedRating) {
  return normalizedRating * 9 + 1;
}

/**
 * Get runs for a specific bean-machine combo (for data point overlay)
 */
function getRunsForVisualization(beanId, machineId) {
  const runs = Repository.RunRepository.getAll()
    .filter(run => run.beanId === beanId && run.machineId === machineId)
    .filter(run => run.rating !== null && run.rating !== undefined);

  return runs;
}
```

**Export additions**:
```javascript
return {
  // ... existing exports
  getPredictionCurve,
  getRunsForVisualization
};
```

---

### Phase 2: Canvas Visualization Component

**File**: `/js/ui/components.js`

**Add new component** `boCurveVisualization()`:

```javascript
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
  optimizableParams.forEach((param, idx) => {
    if (state.sliderValues[param.id] === undefined) {
      state.sliderValues[param.id] = _getDefaultValue(param);
    }
  });

  // Canvas for plot
  const canvas = document.createElement('canvas');
  canvas.className = 'bo-curve-canvas';
  canvas.width = 800;
  canvas.height = 400;
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Sliders container
  const slidersContainer = document.createElement('div');
  slidersContainer.className = 'bo-curve-sliders';

  optimizableParams.forEach((param, idx) => {
    const sliderBox = _createParameterSlider(
      param,
      idx,
      state.colors[idx],
      state.sliderValues[param.id],
      (newValue) => {
        // Slider change handler
        state.sliderValues[param.id] = newValue;
        state.activeParamIndex = idx;
        _renderCurve(canvas, ctx, beanId, machineId, machine, state, optimizableParams);
      }
    );

    slidersContainer.appendChild(sliderBox);
  });

  container.appendChild(slidersContainer);

  // Initial render
  _renderCurve(canvas, ctx, beanId, machineId, machine, state, optimizableParams);

  return container;
}

/**
 * Create a parameter slider with color-coded box
 * @private
 */
function _createParameterSlider(parameter, index, color, initialValue, onChange) {
  const box = document.createElement('div');
  box.className = 'param-slider-box';
  box.style.borderColor = color;

  const label = document.createElement('label');
  label.className = 'param-slider-label';
  label.textContent = parameter.name;
  box.appendChild(label);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.className = 'param-slider';

  // Configure based on parameter type
  if (parameter.type === Config.PARAMETER_TYPES.SLIDER) {
    slider.min = parameter.config.min;
    slider.max = parameter.config.max;
    slider.step = parameter.config.step;
    slider.value = initialValue;
  } else if (parameter.type === Config.PARAMETER_TYPES.NUMBER) {
    // Will need dynamic range - get from observations
    const runs = BOService.getRunsForVisualization(beanId, machineId);
    const values = runs.map(r => r.parameterValues[parameter.id]).filter(v => v != null);

    if (values.length > 0) {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const padding = (max - min) * Config.BO_CONFIG.NUMBER_PARAM_PADDING;

      slider.min = min - padding;
      slider.max = max + padding;
      slider.step = (slider.max - slider.min) / 100;
      slider.value = initialValue;
    } else {
      // Fallback
      slider.min = 0;
      slider.max = 100;
      slider.step = 1;
      slider.value = initialValue || 50;
    }
  } else if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
    // Discrete positions only
    slider.min = 0;
    slider.max = parameter.config.options.length - 1;
    slider.step = 1;

    const currentOption = parameter.config.options.indexOf(initialValue);
    slider.value = currentOption >= 0 ? currentOption : 0;
  }

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'param-slider-value';
  valueDisplay.textContent = _formatSliderValue(parameter, slider.value);

  // Debounced change handler
  let debounceTimer = null;
  slider.addEventListener('input', (e) => {
    const rawValue = parseFloat(e.target.value);
    let actualValue;

    if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
      actualValue = parameter.config.options[Math.round(rawValue)];
    } else {
      actualValue = rawValue;
    }

    valueDisplay.textContent = _formatSliderValue(parameter, rawValue);

    // Debounce curve update
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      onChange(actualValue);
    }, 100); // 100ms debounce
  });

  box.appendChild(slider);
  box.appendChild(valueDisplay);

  return box;
}

/**
 * Format slider value for display
 * @private
 */
function _formatSliderValue(parameter, rawValue) {
  if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
    const idx = Math.round(rawValue);
    return parameter.config.options[idx] || '';
  } else {
    return rawValue.toFixed(2);
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
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y-axis labels (ratings 1-10)
  ctx.fillStyle = '#666';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  for (let r = 1; r <= 10; r++) {
    const y = yScale(r);
    ctx.fillText(r.toString(), padding.left - 10, y + 4);

    // Grid line
    ctx.strokeStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // X-axis label
  ctx.fillStyle = '#333';
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
  ctx.fillText('Predicted Rating', 0, 0);
  ctx.restore();

  // Draw uncertainty band (±2σ)
  const activeColor = state.colors[state.activeParamIndex];
  const bandColor = _hexToRGBA(activeColor, 0.3);

  ctx.fillStyle = bandColor;
  ctx.beginPath();

  // Top boundary (mean + 2σ)
  for (let i = 0; i < paramValues.length; i++) {
    const x = xScale(paramValues[i]);
    const y = yScale(Math.min(10, ratings[i] + 2 * uncertainties[i]));

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  // Bottom boundary (mean - 2σ) - reverse order
  for (let i = paramValues.length - 1; i >= 0; i--) {
    const x = xScale(paramValues[i]);
    const y = yScale(Math.max(1, ratings[i] - 2 * uncertainties[i]));
    ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.fill();

  // Draw mean curve (golden)
  const goldenColor = '#D4A574';
  ctx.strokeStyle = goldenColor;
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
    ctx.fillStyle = goldenColor;
    validIndices.forEach(idx => {
      const x = xScale(paramValues[idx]);
      const y = yScale(ratings[idx]);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  // Draw actual data points
  const runs = BOService.getRunsForVisualization(beanId, machineId);
  const activeParam = optimizableParams[state.activeParamIndex];

  runs.forEach(run => {
    const paramValue = run.parameterValues[activeParam.id];
    if (paramValue === undefined) return;

    const x = xScale(paramValue);
    const y = yScale(run.rating);

    // Color by rating
    const ratingColor = _getRatingColor(run.rating);
    ctx.fillStyle = ratingColor;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  });

  // Draw vertical position indicator (at current slider value)
  const currentValue = state.sliderValues[activeParam.id];
  let currentX;

  if (activeParam.type === Config.PARAMETER_TYPES.DROPDOWN) {
    const optionIndex = activeParam.config.options.indexOf(currentValue);
    if (optionIndex >= 0 && validIndices) {
      currentX = xScale(paramValues[validIndices[optionIndex]]);
    }
  } else {
    currentX = xScale(currentValue);
  }

  if (currentX !== undefined) {
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(currentX, padding.top);
    ctx.lineTo(currentX, height - padding.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
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
```

**Export additions**:
```javascript
return {
  // ... existing exports
  boCurveVisualization
};
```

---

### Phase 3: CSS Styling

**File**: `/css/components.css`

Add styles for the new visualization component:

```css
/* BO Curve Visualization */
.bo-curve-visualization {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bo-curve-canvas {
  display: block;
  margin: 0 auto 1.5rem;
  background: white;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.bo-curve-sliders {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.param-slider-box {
  padding: 1rem;
  background: white;
  border-radius: 4px;
  border: 2px solid #ddd;
  transition: all 0.2s ease;
}

.param-slider-box:hover {
  border-color: currentColor;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.param-slider-label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #333;
  font-size: 0.9rem;
}

.param-slider {
  width: 100%;
  margin-bottom: 0.5rem;
}

.param-slider-value {
  display: block;
  text-align: center;
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}
```

---

### Phase 4: Integration into UI

**File**: `/js/ui/views.js`

Find the `renderRunList()` function (around lines 300-400) and add the visualization after the AI suggestion card:

```javascript
// Inside renderRunList() function, after AI suggestion card rendering

if (isReady) {
  // Existing AI suggestion card code...
  content.appendChild(aiCard);

  // NEW: Add BO curve visualization
  const initialValues = suggestion ? suggestion.parameterValues : {};
  const visualization = Components.boCurveVisualization(
    beanId,
    machineId,
    machine,
    initialValues
  );
  content.appendChild(visualization);
}
```

---

## Implementation Order

### Phase 1: Core API (30% of work)
1. Add `getPredictionCurve()` to `boService.js`
2. Add `getRunsForVisualization()` to `boService.js`
3. Add helper functions: `_generateParameterSamples()`, `_denormalizeRating()`
4. Test API with console logs

### Phase 2: Canvas Rendering (40% of work)
1. Add `boCurveVisualization()` component skeleton to `components.js`
2. Implement `_renderCurve()` with basic axes and labels
3. Add uncertainty band rendering
4. Add mean curve rendering
5. Add data point overlay
6. Add vertical position indicator
7. Test with sample data

### Phase 3: Interactive Sliders (20% of work)
1. Implement `_createParameterSlider()`
2. Add color generation helper
3. Wire up slider onChange handlers
4. Add debouncing for performance
5. Handle categorical discrete stepping
6. Test slider interactions

### Phase 4: Integration & Polish (10% of work)
1. Add CSS styling
2. Integrate into `views.js`
3. Test with real data
4. Handle edge cases (no data, single param, etc.)
5. Responsive canvas sizing (optional)

---

## Edge Cases & Error Handling

### Not Enough Data
- Check `BOService.isReady()` before rendering
- Show message: "Collect at least 5 rated runs to see predictions"

### Single Parameter Machine
- Still works! Just shows one slider
- No interaction between parameters to worry about

### No Variance (all ratings identical)
- GP will return zero variance
- Uncertainty band collapses to line (visually acceptable)

### Parameter Range Changes
- For NUMBER types, range recalculates on each render
- Automatically adapts as new data comes in

### Categorical with Single Option
- Slider disabled or hidden
- Show static label instead

### Very High Uncertainty
- Already visualized with wide uncertainty band
- Users can see where model is uncertain

---

## Testing Checklist

- [ ] API returns correct curve data for slider parameters
- [ ] API returns correct curve data for number parameters (dynamic range)
- [ ] API returns correct curve data for dropdown parameters (discrete)
- [ ] Canvas renders axes and labels correctly
- [ ] Uncertainty band renders with correct color and opacity
- [ ] Mean curve renders in golden color
- [ ] Data points overlay at correct positions
- [ ] Vertical position indicator updates on slider move
- [ ] Slider debouncing works (no lag)
- [ ] Categorical sliders snap to discrete positions
- [ ] Multiple parameters switch colors correctly
- [ ] Works with 1 parameter
- [ ] Works with 8+ parameters
- [ ] Handles no data gracefully
- [ ] Handles single data point gracefully
- [ ] Responsive to different screen sizes

---

## Performance Considerations

1. **Debouncing**: 100ms delay on slider input prevents excessive GP calculations
2. **Canvas caching**: Consider caching axes/grid if re-renders are slow
3. **Point sampling**: 100 points provides smooth curve without excessive computation
4. **GP prediction**: Already optimized with Cholesky decomposition in existing code

---

## Future Enhancements (Out of Scope for v1)

- 2D contour plots (show interaction between two parameters)
- Animation when switching active parameter
- Export visualization as image
- Zoom/pan on canvas
- Touch support for mobile
- Responsive canvas sizing
- Confidence intervals (90%, 95%, 99%)
- Toggle to show/hide data points
- Acquisition function overlay (show where BO would sample next)

---

## File Modification Summary

### Files to Modify
1. `/js/bayesian/boService.js` - Add `getPredictionCurve()`, `getRunsForVisualization()`
2. `/js/ui/components.js` - Add `boCurveVisualization()` component
3. `/js/ui/views.js` - Integrate visualization into `renderRunList()`
4. `/css/components.css` - Add visualization styles

### Files to Reference (No Changes)
- `/js/bayesian/gaussianProcess.js` - Use existing `GP.predict()`
- `/js/config.js` - Reference `PARAMETER_TYPES`, `BO_CONFIG`, `RATING.COLORS`
- `/js/data/models.js` - Reference parameter schemas
- `/js/data/repository.js` - Use `RunRepository.getAll()`

### New Files
None - all additions to existing files

---

## Zero-Shot Implementation Instructions

**For a fresh agent with empty context:**

1. Read this entire plan document first
2. Start with Phase 1 (Core API) - modify `boService.js`
3. Move to Phase 2 (Canvas Rendering) - modify `components.js`
4. Add Phase 3 (Sliders) - continue in `components.js`
5. Phase 4 (Integration) - modify `views.js` and add CSS
6. Test thoroughly with the checklist above

**Key architectural principles to maintain:**
- Keep vanilla JS, no dependencies
- Use IIFE module pattern
- Export new functions in module's return statement
- Follow existing naming conventions (camelCase for functions, UPPER_CASE for constants)
- Add JSDoc comments for all public functions
- Use existing helpers (Helpers.generateUUID(), etc.)
- Follow existing error handling patterns

**Golden color reference**: `#D4A574` (from `config.js` RATING.COLORS.HIGH)
