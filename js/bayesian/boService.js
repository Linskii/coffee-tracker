/**
 * Bayesian Optimization Service
 *
 * Main API for Bayesian Optimization. Manages GP models for each bean-machine
 * combination and provides parameter suggestions.
 *
 * Key responsibilities:
 * - Initialize optimizers for bean-machine combinations
 * - Update GP models when new rated runs are created
 * - Generate AI-suggested parameter values using acquisition functions
 * - Manage configuration and state persistence
 */
const BOService = (function() {
  'use strict';

  // Default configuration (can be overridden)
  let config = {
    minRunsThreshold: Config.BO_CONFIG.MIN_RUNS_THRESHOLD,
    explorationFactor: Config.BO_CONFIG.EXPLORATION_FACTOR,
    numCandidates: Config.BO_CONFIG.NUM_CANDIDATES,
    kernelLengthScale: Config.BO_CONFIG.KERNEL_LENGTH_SCALE,
    kernelOutputScale: Config.BO_CONFIG.KERNEL_OUTPUT_SCALE,
    kernelNoise: Config.BO_CONFIG.KERNEL_NOISE,
    maxObservations: Config.BO_CONFIG.MAX_OBSERVATIONS,
    numberParamPadding: Config.BO_CONFIG.NUMBER_PARAM_PADDING
  };

  // Load persisted config from localStorage
  _loadConfig();

  /**
   * Get current configuration
   * @returns {Object} Current BO configuration
   */
  function getConfig() {
    return { ...config };
  }

  /**
   * Update configuration
   * @param {Object} updates - Configuration updates
   */
  function setConfig(updates) {
    config = { ...config, ...updates };
    _saveConfig();
  }

  /**
   * Initialize optimizer for a bean-machine combination
   * Creates empty BO state if there are optimizable parameters
   *
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   * @returns {boolean} True if initialized, false if no optimizable parameters
   */
  function initializeOptimizer(beanId, machineId) {
    const machine = Repository.MachineRepository.getById(machineId);
    if (!machine) {
      throw new Error('Machine not found');
    }

    const optimizableParams = _getOptimizableParameters(machine);
    if (optimizableParams.length === 0) {
      return false; // No parameters to optimize
    }

    const key = _makeKey(beanId, machineId);
    const state = {
      observations: [],
      parameterMetadata: optimizableParams.map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        config: p.config
      })),
      gpHyperparameters: {
        lengthScale: config.kernelLengthScale,
        outputScale: config.kernelOutputScale,
        noise: config.kernelNoise
      },
      lastUpdated: Date.now()
    };

    BOStorage.set(key, state);
    return true;
  }

  /**
   * Update optimizer with a new rated run
   * Automatically initializes if needed
   *
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   * @param {Object} run - Run object with rating
   */
  function updateWithRun(beanId, machineId, run) {
    // Only update if run has a rating
    if (run.rating === null || run.rating === undefined) {
      return;
    }

    const machine = Repository.MachineRepository.getById(machineId);
    if (!machine) {
      console.error('BOService: Machine not found', machineId);
      return;
    }

    const key = _makeKey(beanId, machineId);
    let state = BOStorage.get(key);

    // Initialize if doesn't exist
    if (!state) {
      const initialized = initializeOptimizer(beanId, machineId);
      if (!initialized) {
        return; // No optimizable parameters
      }
      state = BOStorage.get(key);
    }

    // Convert run to observation
    const observation = _runToObservation(run, machine, state.parameterMetadata, state);
    if (!observation) {
      return; // Failed to convert (e.g., mismatched parameters)
    }

    // Add observation
    state.observations.push(observation);

    // Limit number of observations
    if (state.observations.length > config.maxObservations) {
      state.observations = state.observations.slice(-config.maxObservations);
    }

    state.lastUpdated = Date.now();
    BOStorage.set(key, state);
  }

  /**
   * Generate AI-suggested parameters
   * Returns null if optimizer not ready or no optimizable parameters
   *
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   * @returns {Object|null} Suggested run object or null
   */
  function suggestParameters(beanId, machineId) {
    const machine = Repository.MachineRepository.getById(machineId);
    if (!machine) {
      return null;
    }

    const key = _makeKey(beanId, machineId);
    const state = BOStorage.get(key);

    if (!state || state.observations.length === 0) {
      return null; // No data
    }

    try {
      // Extract training data
      const X_train = state.observations.map(obs => obs.parameters);
      const y_train = state.observations.map(obs => obs.rating);

      // Create and train GP
      const kernel = new Kernels.RBFKernel(
        state.gpHyperparameters.lengthScale,
        state.gpHyperparameters.outputScale
      );
      const gp = new GaussianProcess.GP(kernel, state.gpHyperparameters.noise);
      gp.fit(X_train, y_train);

      // Generate candidate points
      const numDims = state.parameterMetadata.length;
      const candidates = _generateCandidates(numDims, config.numCandidates);

      // Predict at candidates
      const predictions = gp.predict(candidates);

      // Find best candidate using UCB acquisition
      const bestIdx = AcquisitionFunctions.findMaxUCB(
        predictions.mean,
        predictions.variance,
        config.explorationFactor
      );

      const bestCandidate = candidates[bestIdx];
      const expectedRating = predictions.mean[bestIdx];
      const variance = predictions.variance[bestIdx];

      // Convert to run object
      const suggestion = _suggestionToRun(
        bestCandidate,
        machine,
        beanId,
        machineId,
        state.parameterMetadata,
        state,
        expectedRating,
        variance
      );

      return suggestion;
    } catch (e) {
      console.error('BOService: Failed to generate suggestion', e);
      return null;
    }
  }

  /**
   * Check if optimizer has enough data to show suggestions
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   * @returns {boolean} True if ready
   */
  function isReady(beanId, machineId) {
    const key = _makeKey(beanId, machineId);
    const state = BOStorage.get(key);

    if (!state) {
      return false;
    }

    return state.observations.length >= config.minRunsThreshold;
  }

  /**
   * Get current observation count for a bean-machine combination
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   * @returns {number} Number of observations (rated runs)
   */
  function getObservationCount(beanId, machineId) {
    const key = _makeKey(beanId, machineId);
    const state = BOStorage.get(key);

    if (!state) {
      return 0;
    }

    return state.observations.length;
  }

  /**
   * Clear optimizer state for a bean-machine combination
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   */
  function clearOptimizer(beanId, machineId) {
    const key = _makeKey(beanId, machineId);
    BOStorage.remove(key);
  }

  /**
   * Clear all optimizers for a specific machine
   * Used when machine parameters change
   * @param {string} machineId - Machine ID
   */
  function clearOptimizersForMachine(machineId) {
    const allKeys = BOStorage.keys();
    const keysToRemove = allKeys.filter(key => key.endsWith(`_${machineId}`));
    keysToRemove.forEach(key => BOStorage.remove(key));
  }

  // ============================================================================
  // Private Helper Functions
  // ============================================================================

  /**
   * Get parameters that can be optimized (exclude text)
   * @private
   */
  function _getOptimizableParameters(machine) {
    return machine.parameters.filter(param =>
      param.type === Config.PARAMETER_TYPES.SLIDER ||
      param.type === Config.PARAMETER_TYPES.NUMBER ||
      param.type === Config.PARAMETER_TYPES.DROPDOWN
    );
  }

  /**
   * Create storage key for bean-machine combination
   * @private
   */
  function _makeKey(beanId, machineId) {
    return `${beanId}_${machineId}`;
  }

  /**
   * Convert run to normalized observation
   * @private
   */
  function _runToObservation(run, machine, metadata, existingState) {
    const parameters = [];
    const rawValues = {};

    for (const paramMeta of metadata) {
      const value = run.parameterValues[paramMeta.id];
      if (value === undefined || value === null) {
        console.warn('BOService: Missing parameter value', paramMeta.id);
        return null;
      }

      const param = machine.parameters.find(p => p.id === paramMeta.id);
      if (!param) {
        return null;
      }

      // Store raw value
      rawValues[paramMeta.id] = value;

      const normalized = _normalizeParameter(value, param, existingState);
      parameters.push(normalized);
    }

    // Normalize rating from 1-10 to 0-1
    const normalizedRating = (run.rating - 1) / 9;

    return {
      parameters,
      rawValues,
      rating: normalizedRating
    };
  }

  /**
   * Convert normalized suggestion to run object
   * @private
   */
  function _suggestionToRun(normalizedParams, machine, beanId, machineId, metadata, state, expectedRating = null, variance = null) {
    const parameterValues = {};

    // Denormalize optimizable parameters
    for (let i = 0; i < metadata.length; i++) {
      const paramMeta = metadata[i];
      const param = machine.parameters.find(p => p.id === paramMeta.id);
      if (!param) continue;

      const denormalized = _denormalizeParameter(normalizedParams[i], param, state);
      parameterValues[param.id] = denormalized;
    }

    // Add text parameters with empty defaults
    machine.parameters.forEach(param => {
      if (param.type === Config.PARAMETER_TYPES.TEXT && !parameterValues[param.id]) {
        parameterValues[param.id] = '';
      }
    });

    // Convert normalized rating (0-1) back to 1-10 scale
    const denormalizedRating = expectedRating !== null ? expectedRating * 9 + 1 : null;
    const stddev = variance !== null ? Math.sqrt(Math.max(0, variance)) : null;
    // Convert standard deviation from normalized scale to 1-10 scale
    const denormalizedStddev = stddev !== null ? stddev * 9 : null;

    return {
      id: 'ai-suggestion',
      beanId,
      machineId,
      parameterValues,
      rating: null,
      notes: '',
      starred: false,
      timestamp: Date.now(),
      isAISuggestion: true,
      expectedRating: denormalizedRating,
      expectedStddev: denormalizedStddev
    };
  }

  /**
   * Normalize a parameter value to [0, 1]
   * @private
   */
  function _normalizeParameter(value, param, state) {
    const numValue = Number(value);

    if (param.type === Config.PARAMETER_TYPES.SLIDER) {
      const min = param.config.min;
      const max = param.config.max;
      return (numValue - min) / (max - min);
    }

    if (param.type === Config.PARAMETER_TYPES.NUMBER) {
      // Get all raw values for this parameter from existing observations
      const allValues = [];
      if (state && state.observations) {
        state.observations.forEach(obs => {
          if (obs.rawValues && obs.rawValues[param.id] !== undefined) {
            allValues.push(Number(obs.rawValues[param.id]));
          }
        });
      }

      // Include current value
      allValues.push(numValue);

      if (allValues.length > 0) {
        let minVal = Math.min(...allValues);
        let maxVal = Math.max(...allValues);

        // Add padding
        const range = maxVal - minVal;
        if (range > 0) {
          const padding = range * config.numberParamPadding;
          minVal -= padding;
          maxVal += padding;
        } else {
          // All values are the same, add small range
          minVal -= 1;
          maxVal += 1;
        }

        return (numValue - minVal) / (maxVal - minVal);
      }

      return 0.5; // Default if no history
    }

    if (param.type === Config.PARAMETER_TYPES.DROPDOWN) {
      const options = param.config.options || [];
      const idx = options.indexOf(value);
      if (idx === -1) return 0;
      if (options.length === 1) return 0;
      return idx / (options.length - 1);
    }

    return 0.5; // Fallback
  }

  /**
   * Denormalize a parameter value from [0, 1]
   * @private
   */
  function _denormalizeParameter(normalized, param, state) {
    if (param.type === Config.PARAMETER_TYPES.SLIDER) {
      const min = param.config.min;
      const max = param.config.max;
      const step = param.config.step || 1;

      const value = min + normalized * (max - min);

      // Round to nearest step
      const rounded = Math.round(value / step) * step;
      return Math.max(min, Math.min(max, rounded));
    }

    if (param.type === Config.PARAMETER_TYPES.NUMBER) {
      // Get all raw values for this parameter from existing observations
      const allValues = [];
      if (state && state.observations) {
        state.observations.forEach(obs => {
          if (obs.rawValues && obs.rawValues[param.id] !== undefined) {
            allValues.push(Number(obs.rawValues[param.id]));
          }
        });
      }

      if (allValues.length > 0) {
        let minVal = Math.min(...allValues);
        let maxVal = Math.max(...allValues);

        const range = maxVal - minVal;
        if (range > 0) {
          const padding = range * config.numberParamPadding;
          minVal -= padding;
          maxVal += padding;
        } else {
          minVal -= 1;
          maxVal += 1;
        }

        const value = minVal + normalized * (maxVal - minVal);

        // Round to reasonable precision (2 decimal places)
        return Math.round(value * 100) / 100;
      }

      // Fallback: use default if available
      return param.config.default || 0;
    }

    if (param.type === Config.PARAMETER_TYPES.DROPDOWN) {
      const options = param.config.options || [];
      if (options.length === 0) return '';

      const idx = Math.round(normalized * (options.length - 1));
      return options[Math.max(0, Math.min(idx, options.length - 1))];
    }

    return '';
  }

  /**
   * Generate random candidate points in [0,1]^D
   * @private
   */
  function _generateCandidates(numDims, numCandidates) {
    const candidates = [];

    for (let i = 0; i < numCandidates; i++) {
      const candidate = [];
      for (let j = 0; j < numDims; j++) {
        candidate.push(Math.random());
      }
      candidates.push(candidate);
    }

    return candidates;
  }

  /**
   * Load configuration from localStorage
   * @private
   */
  function _loadConfig() {
    try {
      const saved = Storage.get(Config.STORAGE_KEYS.BO_CONFIG);
      if (saved) {
        config = { ...config, ...saved };
      }
    } catch (e) {
      console.error('BOService: Failed to load config', e);
    }
  }

  /**
   * Save configuration to localStorage
   * @private
   */
  function _saveConfig() {
    try {
      Storage.set(Config.STORAGE_KEYS.BO_CONFIG, config);
    } catch (e) {
      console.error('BOService: Failed to save config', e);
    }
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
          testVector[idx] = _normalizeParameter(fixedValue, fullP, state);
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
      _denormalizeParameter(normValue, fullParam, state)
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
   * Get runs for a specific bean-machine combo (for data point overlay)
   * @param {string} beanId - Bean ID
   * @param {string} machineId - Machine ID
   * @returns {Array} Array of runs with ratings
   */
  function getRunsForVisualization(beanId, machineId) {
    const runs = Repository.RunRepository.getAll()
      .filter(run => run.beanId === beanId && run.machineId === machineId)
      .filter(run => run.rating !== null && run.rating !== undefined);

    return runs;
  }

  // Public API
  return {
    getConfig,
    setConfig,
    initializeOptimizer,
    updateWithRun,
    suggestParameters,
    isReady,
    getObservationCount,
    clearOptimizer,
    clearOptimizersForMachine,
    getPredictionCurve,
    getRunsForVisualization
  };
})();
