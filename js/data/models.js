/**
 * Data Models
 * Factory functions and validation logic for data entities
 */

const Models = (function() {
  'use strict';

  /**
   * Machine Model
   * Represents a coffee machine with configurable parameters
   */
  const MachineModel = {
    /**
     * Create a new machine
     * @param {string} name - Machine name
     * @param {Array} parameters - Array of parameter objects
     * @returns {object} Machine object
     */
    create(name, parameters = []) {
      return {
        id: Helpers.generateUUID(),
        name: name.trim(),
        parameters: parameters.map(p => ParameterModel.create(p.name, p.type, p.config)),
        createdAt: Date.now()
      };
    },

    /**
     * Validate a machine object
     * @param {object} machine - Machine to validate
     * @returns {Array} Array of error messages (empty if valid)
     */
    validate(machine) {
      const errors = [];

      if (!machine) {
        errors.push('Machine object is required');
        return errors;
      }

      if (!machine.name || typeof machine.name !== 'string') {
        errors.push('Machine name is required');
      } else {
        const trimmed = machine.name.trim();
        if (trimmed.length < Config.VALIDATION.MACHINE_NAME_MIN_LENGTH) {
          errors.push('Machine name is required');
        }
        if (trimmed.length > Config.VALIDATION.MACHINE_NAME_MAX_LENGTH) {
          errors.push(`Machine name must be less than ${Config.VALIDATION.MACHINE_NAME_MAX_LENGTH} characters`);
        }
      }

      if (!Array.isArray(machine.parameters)) {
        errors.push('Machine must have a parameters array');
      } else {
        machine.parameters.forEach((param, index) => {
          const paramErrors = ParameterModel.validate(param);
          paramErrors.forEach(err => {
            errors.push(`Parameter ${index + 1}: ${err}`);
          });
        });
      }

      return errors;
    },

    /**
     * Add a parameter to a machine
     * @param {object} machine - Machine object
     * @param {object} parameter - Parameter to add
     * @returns {object} Updated machine
     */
    addParameter(machine, parameter) {
      const updated = Helpers.deepClone(machine);
      updated.parameters.push(ParameterModel.create(
        parameter.name,
        parameter.type,
        parameter.config
      ));
      return updated;
    },

    /**
     * Remove a parameter from a machine
     * @param {object} machine - Machine object
     * @param {string} parameterId - ID of parameter to remove
     * @returns {object} Updated machine
     */
    removeParameter(machine, parameterId) {
      const updated = Helpers.deepClone(machine);
      updated.parameters = updated.parameters.filter(p => p.id !== parameterId);
      return updated;
    }
  };

  /**
   * Parameter Model
   * Represents a configurable parameter for a coffee machine
   */
  const ParameterModel = {
    /**
     * Create a new parameter
     * @param {string} name - Parameter name (e.g., "Grind Size")
     * @param {string} type - Parameter type (number, slider, text, dropdown)
     * @param {object} config - Type-specific configuration
     * @returns {object} Parameter object
     */
    create(name, type, config = {}) {
      const param = {
        id: Helpers.generateUUID(),
        name: name.trim(),
        type: type,
        config: {}
      };

      // Set type-specific configuration
      switch (type) {
        case Config.PARAMETER_TYPES.SLIDER:
          param.config = {
            min: config.min ?? Config.VALIDATION.SLIDER_DEFAULT_MIN,
            max: config.max ?? Config.VALIDATION.SLIDER_DEFAULT_MAX,
            step: config.step ?? Config.VALIDATION.SLIDER_DEFAULT_STEP,
            default: config.default ?? null
          };
          break;

        case Config.PARAMETER_TYPES.NUMBER:
          param.config = {
            default: config.default ?? null
          };
          break;

        case Config.PARAMETER_TYPES.DROPDOWN:
          param.config = {
            options: config.options ?? [],
            default: config.default ?? null
          };
          break;

        case Config.PARAMETER_TYPES.TEXT:
          param.config = {
            default: config.default ?? null
          };
          break;

        default:
          param.config = config;
      }

      return param;
    },

    /**
     * Validate a parameter object
     * @param {object} parameter - Parameter to validate
     * @returns {Array} Array of error messages (empty if valid)
     */
    validate(parameter) {
      const errors = [];

      if (!parameter) {
        errors.push('Parameter is required');
        return errors;
      }

      if (!parameter.name || typeof parameter.name !== 'string') {
        errors.push('Parameter name is required');
      } else {
        const trimmed = parameter.name.trim();
        if (trimmed.length < Config.VALIDATION.PARAMETER_NAME_MIN_LENGTH) {
          errors.push('Parameter name is required');
        }
        if (trimmed.length > Config.VALIDATION.PARAMETER_NAME_MAX_LENGTH) {
          errors.push(`Parameter name must be less than ${Config.VALIDATION.PARAMETER_NAME_MAX_LENGTH} characters`);
        }
      }

      if (!Object.values(Config.PARAMETER_TYPES).includes(parameter.type)) {
        errors.push(`Invalid parameter type: ${parameter.type}`);
      }

      // Type-specific validation
      if (parameter.type === Config.PARAMETER_TYPES.SLIDER) {
        if (typeof parameter.config.min !== 'number') {
          errors.push('Slider minimum value is required');
        }
        if (typeof parameter.config.max !== 'number') {
          errors.push('Slider maximum value is required');
        }
        if (parameter.config.min >= parameter.config.max) {
          errors.push('Slider maximum must be greater than minimum');
        }
        if (typeof parameter.config.step !== 'number' || parameter.config.step <= 0) {
          errors.push('Slider step must be a positive number');
        }
      }

      if (parameter.type === Config.PARAMETER_TYPES.DROPDOWN) {
        if (!Array.isArray(parameter.config.options) || parameter.config.options.length === 0) {
          errors.push('Dropdown must have at least one option');
        }
      }

      return errors;
    }
  };

  /**
   * Bean Model
   * Represents a coffee bean
   */
  const BeanModel = {
    /**
     * Create a new bean
     * @param {string} name - Bean name
     * @param {string} purchaseDate - Purchase date (ISO string or YYYY-MM-DD)
     * @param {string} notes - Optional notes
     * @returns {object} Bean object
     */
    create(name, purchaseDate, notes = '') {
      return {
        id: Helpers.generateUUID(),
        name: name.trim(),
        purchaseDate: purchaseDate,
        notes: notes.trim(),
        createdAt: Date.now()
      };
    },

    /**
     * Validate a bean object
     * @param {object} bean - Bean to validate
     * @returns {Array} Array of error messages (empty if valid)
     */
    validate(bean) {
      const errors = [];

      if (!bean) {
        errors.push('Bean object is required');
        return errors;
      }

      if (!bean.name || typeof bean.name !== 'string') {
        errors.push('Bean name is required');
      } else {
        const trimmed = bean.name.trim();
        if (trimmed.length < Config.VALIDATION.BEAN_NAME_MIN_LENGTH) {
          errors.push('Bean name is required');
        }
        if (trimmed.length > Config.VALIDATION.BEAN_NAME_MAX_LENGTH) {
          errors.push(`Bean name must be less than ${Config.VALIDATION.BEAN_NAME_MAX_LENGTH} characters`);
        }
      }

      if (!bean.purchaseDate) {
        errors.push('Purchase date is required');
      } else {
        const date = new Date(bean.purchaseDate);
        if (isNaN(date.getTime())) {
          errors.push('Invalid purchase date');
        }
      }

      if (bean.notes && typeof bean.notes === 'string') {
        if (bean.notes.length > Config.VALIDATION.NOTES_MAX_LENGTH) {
          errors.push(`Notes must be less than ${Config.VALIDATION.NOTES_MAX_LENGTH} characters`);
        }
      }

      return errors;
    }
  };

  /**
   * Run Model
   * Represents a brewing run for a specific bean and machine
   */
  const RunModel = {
    /**
     * Create a new run
     * @param {string} beanId - Bean ID
     * @param {string} machineId - Machine ID
     * @param {object} parameterValues - Key-value pairs of parameter IDs and values
     * @param {number} rating - Rating (1-10)
     * @param {string} notes - Optional notes
     * @param {boolean} starred - Whether this is the starred run
     * @returns {object} Run object
     */
    create(beanId, machineId, parameterValues = {}, rating = null, notes = '', starred = false) {
      return {
        id: Helpers.generateUUID(),
        beanId,
        machineId,
        parameterValues,
        rating,
        notes: notes.trim(),
        starred,
        createdAt: Date.now(),
        timestamp: Date.now()
      };
    },

    /**
     * Validate a run object
     * @param {object} run - Run to validate
     * @param {object} machine - Machine object (for parameter validation)
     * @returns {Array} Array of error messages (empty if valid)
     */
    validate(run, machine = null) {
      const errors = [];

      if (!run) {
        errors.push('Run object is required');
        return errors;
      }

      if (!run.beanId) {
        errors.push('Bean ID is required');
      }

      if (!run.machineId) {
        errors.push('Machine ID is required');
      }

      if (!run.parameterValues || typeof run.parameterValues !== 'object') {
        errors.push('Parameter values are required');
      }

      if (run.rating !== null && run.rating !== undefined) {
        if (typeof run.rating !== 'number') {
          errors.push('Rating must be a number');
        } else if (run.rating < Config.VALIDATION.RATING_MIN || run.rating > Config.VALIDATION.RATING_MAX) {
          errors.push(`Rating must be between ${Config.VALIDATION.RATING_MIN} and ${Config.VALIDATION.RATING_MAX}`);
        }
      }

      if (run.notes && typeof run.notes === 'string') {
        if (run.notes.length > Config.VALIDATION.NOTES_MAX_LENGTH) {
          errors.push(`Notes must be less than ${Config.VALIDATION.NOTES_MAX_LENGTH} characters`);
        }
      }

      // Validate parameter values against machine parameters (if machine provided)
      if (machine && Array.isArray(machine.parameters)) {
        machine.parameters.forEach(param => {
          const value = run.parameterValues[param.id];

          // Check if required parameter has a value
          if (value === undefined || value === null || value === '') {
            errors.push(`Parameter "${param.name}" is required`);
            return;
          }

          // Type-specific validation
          switch (param.type) {
            case Config.PARAMETER_TYPES.NUMBER:
              if (typeof value !== 'number' && isNaN(Number(value))) {
                errors.push(`Parameter "${param.name}" must be a number`);
              }
              break;

            case Config.PARAMETER_TYPES.SLIDER:
              const numValue = Number(value);
              if (isNaN(numValue)) {
                errors.push(`Parameter "${param.name}" must be a number`);
              } else {
                if (numValue < param.config.min || numValue > param.config.max) {
                  errors.push(`Parameter "${param.name}" must be between ${param.config.min} and ${param.config.max}`);
                }
              }
              break;

            case Config.PARAMETER_TYPES.DROPDOWN:
              if (!param.config.options.includes(value)) {
                errors.push(`Parameter "${param.name}" must be one of: ${param.config.options.join(', ')}`);
              }
              break;

            case Config.PARAMETER_TYPES.TEXT:
              if (typeof value !== 'string') {
                errors.push(`Parameter "${param.name}" must be text`);
              }
              break;
          }
        });
      }

      return errors;
    },

    /**
     * Check if a run can be starred (only one star per bean-machine combo)
     * @param {object} run - Run to star
     * @param {Array} allRuns - All runs in the system
     * @returns {boolean} True if can be starred
     */
    canStar(run, allRuns) {
      if (!run.starred) {
        return true; // Can always unstar
      }

      // Check if another run for same bean-machine is already starred
      const alreadyStarred = allRuns.find(r =>
        r.id !== run.id &&
        r.beanId === run.beanId &&
        r.machineId === run.machineId &&
        r.starred === true
      );

      return !alreadyStarred;
    }
  };

  // Public API
  return {
    MachineModel,
    ParameterModel,
    BeanModel,
    RunModel
  };
})();
