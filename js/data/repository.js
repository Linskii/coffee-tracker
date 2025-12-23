/**
 * Data Repository Layer
 * CRUD operations and business logic for all entities
 */

const Repository = (function() {
  'use strict';

  /**
   * Machine Repository
   * Manages coffee machine data
   */
  const MachineRepository = {
    /**
     * Get all machines
     * @returns {Array} Array of machine objects
     */
    getAll() {
      return Storage.get(Config.STORAGE_KEYS.MACHINES, []);
    },

    /**
     * Get machine by ID
     * @param {string} id - Machine ID
     * @returns {object|null} Machine object or null
     */
    getById(id) {
      const machines = this.getAll();
      return machines.find(m => m.id === id) || null;
    },

    /**
     * Create a new machine
     * @param {object} data - Machine data (name, parameters)
     * @returns {object} Created machine
     * @throws {Error} If validation fails or storage fails
     */
    create(data) {
      const machine = Models.MachineModel.create(data.name, data.parameters || []);

      // Validate
      const errors = Models.MachineModel.validate(machine);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Save
      const machines = this.getAll();
      machines.push(machine);
      Storage.set(Config.STORAGE_KEYS.MACHINES, machines);

      return machine;
    },

    /**
     * Update an existing machine
     * @param {string} id - Machine ID
     * @param {object} data - Updated machine data
     * @returns {object} Updated machine
     * @throws {Error} If machine not found or validation fails
     */
    update(id, data) {
      const machines = this.getAll();
      const index = machines.findIndex(m => m.id === id);

      if (index === -1) {
        throw new Error(Config.ERRORS.MACHINE_NOT_FOUND);
      }

      // Update machine while preserving id and createdAt
      const updated = {
        ...machines[index],
        name: data.name.trim(),
        parameters: data.parameters
      };

      // Validate
      const errors = Models.MachineModel.validate(updated);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      machines[index] = updated;
      Storage.set(Config.STORAGE_KEYS.MACHINES, machines);

      // Clear BO state for this machine since parameters changed
      try {
        BOService.clearOptimizersForMachine(id);
      } catch (e) {
        console.error('Failed to clear BO optimizers for machine:', e);
      }

      return updated;
    },

    /**
     * Delete a machine and cascade delete all associated runs
     * @param {string} id - Machine ID
     * @returns {object} Object with deleted machine and run count
     * @throws {Error} If machine not found
     */
    delete(id) {
      const machines = this.getAll();
      const filtered = machines.filter(m => m.id !== id);

      if (filtered.length === machines.length) {
        throw new Error(Config.ERRORS.MACHINE_NOT_FOUND);
      }

      // Cascade delete all runs for this machine
      const deletedRunCount = RunRepository.deleteByMachine(id);

      Storage.set(Config.STORAGE_KEYS.MACHINES, filtered);
      return { deletedRuns: deletedRunCount };
    },

    /**
     * Get count of runs for a machine
     * @param {string} id - Machine ID
     * @returns {number} Number of runs
     */
    getRunCount(id) {
      return RunRepository.getByMachine(id).length;
    }
  };

  /**
   * Bean Repository
   * Manages coffee bean data
   */
  const BeanRepository = {
    /**
     * Get all beans
     * @returns {Array} Array of bean objects
     */
    getAll() {
      return Storage.get(Config.STORAGE_KEYS.BEANS, []);
    },

    /**
     * Get bean by ID
     * @param {string} id - Bean ID
     * @returns {object|null} Bean object or null
     */
    getById(id) {
      const beans = this.getAll();
      return beans.find(b => b.id === id) || null;
    },

    /**
     * Create a new bean
     * @param {object} data - Bean data (name, purchaseDate, notes)
     * @returns {object} Created bean
     * @throws {Error} If validation fails or storage fails
     */
    create(data) {
      const bean = Models.BeanModel.create(
        data.name,
        data.purchaseDate,
        data.notes || ''
      );

      // Validate
      const errors = Models.BeanModel.validate(bean);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Save
      const beans = this.getAll();
      beans.push(bean);
      Storage.set(Config.STORAGE_KEYS.BEANS, beans);

      return bean;
    },

    /**
     * Update an existing bean
     * @param {string} id - Bean ID
     * @param {object} data - Updated bean data
     * @returns {object} Updated bean
     * @throws {Error} If bean not found or validation fails
     */
    update(id, data) {
      const beans = this.getAll();
      const index = beans.findIndex(b => b.id === id);

      if (index === -1) {
        throw new Error(Config.ERRORS.BEAN_NOT_FOUND);
      }

      // Update bean while preserving id and createdAt
      const updated = {
        ...beans[index],
        name: data.name.trim(),
        purchaseDate: data.purchaseDate,
        notes: (data.notes || '').trim()
      };

      // Validate
      const errors = Models.BeanModel.validate(updated);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      beans[index] = updated;
      Storage.set(Config.STORAGE_KEYS.BEANS, beans);

      return updated;
    },

    /**
     * Delete a bean and cascade delete all associated runs
     * @param {string} id - Bean ID
     * @returns {object} Object with deleted bean and run count
     * @throws {Error} If bean not found
     */
    delete(id) {
      const beans = this.getAll();
      const filtered = beans.filter(b => b.id !== id);

      if (filtered.length === beans.length) {
        throw new Error(Config.ERRORS.BEAN_NOT_FOUND);
      }

      // Cascade delete all runs for this bean
      const deletedRunCount = RunRepository.deleteByBean(id);

      Storage.set(Config.STORAGE_KEYS.BEANS, filtered);
      return { deletedRuns: deletedRunCount };
    },

    /**
     * Get count of runs for a bean
     * @param {string} id - Bean ID
     * @returns {number} Number of runs
     */
    getRunCount(id) {
      return RunRepository.getByBean(id).length;
    }
  };

  /**
   * Run Repository
   * Manages brewing run data with special logic for starring
   */
  const RunRepository = {
    /**
     * Get all runs
     * @returns {Array} Array of run objects
     */
    getAll() {
      return Storage.get(Config.STORAGE_KEYS.RUNS, []);
    },

    /**
     * Get run by ID
     * @param {string} id - Run ID
     * @returns {object|null} Run object or null
     */
    getById(id) {
      const runs = this.getAll();
      return runs.find(r => r.id === id) || null;
    },

    /**
     * Get all runs for a specific bean
     * @param {string} beanId - Bean ID
     * @returns {Array} Array of run objects
     */
    getByBean(beanId) {
      const runs = this.getAll();
      return runs.filter(r => r.beanId === beanId);
    },

    /**
     * Get all runs for a specific machine
     * @param {string} machineId - Machine ID
     * @returns {Array} Array of run objects
     */
    getByMachine(machineId) {
      const runs = this.getAll();
      return runs.filter(r => r.machineId === machineId);
    },

    /**
     * Get all runs for a specific bean and machine combination
     * @param {string} beanId - Bean ID
     * @param {string} machineId - Machine ID
     * @returns {Array} Array of run objects, sorted by timestamp (newest first)
     */
    getByBeanAndMachine(beanId, machineId) {
      const runs = this.getAll();
      const filtered = runs.filter(r => r.beanId === beanId && r.machineId === machineId);
      return Helpers.sortBy(filtered, 'timestamp', false); // Newest first
    },

    /**
     * Get the starred run for a bean and machine combination
     * @param {string} beanId - Bean ID
     * @param {string} machineId - Machine ID
     * @returns {object|null} Starred run or null
     */
    getStarredRun(beanId, machineId) {
      const runs = this.getByBeanAndMachine(beanId, machineId);
      return runs.find(r => r.starred === true) || null;
    },

    /**
     * Get recent runs across all beans and machines
     * @param {number} limit - Number of runs to return
     * @returns {Array} Array of run objects, sorted by timestamp (newest first)
     */
    getRecent(limit = Config.UI.RECENT_RUNS_LIMIT) {
      const runs = this.getAll();
      const sorted = Helpers.sortBy(runs, 'timestamp', false);
      return sorted.slice(0, limit);
    },

    /**
     * Create a new run
     * @param {object} data - Run data
     * @returns {object} Created run
     * @throws {Error} If validation fails or storage fails
     */
    create(data) {
      const run = Models.RunModel.create(
        data.beanId,
        data.machineId,
        data.parameterValues || {},
        data.rating,
        data.notes || '',
        data.starred || false
      );

      // Get machine for validation
      const machine = MachineRepository.getById(data.machineId);
      if (!machine) {
        throw new Error(Config.ERRORS.MACHINE_NOT_FOUND);
      }

      // Validate
      const errors = Models.RunModel.validate(run, machine);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // If starring this run, unstar any existing starred run for this bean-machine combo
      const runs = this.getAll();
      if (run.starred) {
        runs.forEach(r => {
          if (r.beanId === run.beanId && r.machineId === run.machineId && r.starred) {
            r.starred = false;
          }
        });
      }

      // Add new run
      runs.push(run);
      Storage.set(Config.STORAGE_KEYS.RUNS, runs);

      // Update Bayesian Optimization if run has a rating
      if (run.rating !== null && run.rating !== undefined) {
        try {
          BOService.updateWithRun(run.beanId, run.machineId, run);
        } catch (e) {
          console.error('Failed to update BO with run:', e);
        }
      }

      return run;
    },

    /**
     * Update an existing run
     * @param {string} id - Run ID
     * @param {object} data - Updated run data
     * @returns {object} Updated run
     * @throws {Error} If run not found or validation fails
     */
    update(id, data) {
      const runs = this.getAll();
      const index = runs.findIndex(r => r.id === id);

      if (index === -1) {
        throw new Error(Config.ERRORS.RUN_NOT_FOUND);
      }

      const existingRun = runs[index];

      // Update run while preserving id, createdAt, and timestamp
      const updated = {
        ...existingRun,
        parameterValues: data.parameterValues,
        rating: data.rating,
        notes: (data.notes || '').trim(),
        starred: data.starred || false
      };

      // Get machine for validation
      const machine = MachineRepository.getById(updated.machineId);
      if (!machine) {
        throw new Error(Config.ERRORS.MACHINE_NOT_FOUND);
      }

      // Validate
      const errors = Models.RunModel.validate(updated, machine);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // If starring this run, unstar any other starred run for this bean-machine combo
      if (updated.starred) {
        runs.forEach((r, i) => {
          if (i !== index &&
              r.beanId === updated.beanId &&
              r.machineId === updated.machineId &&
              r.starred) {
            r.starred = false;
          }
        });
      }

      runs[index] = updated;
      Storage.set(Config.STORAGE_KEYS.RUNS, runs);

      // Update Bayesian Optimization if run has a rating
      if (updated.rating !== null && updated.rating !== undefined) {
        try {
          // When updating a run, we need to rebuild the entire BO state
          // This is simpler than trying to update a specific observation
          BOService.clearOptimizer(updated.beanId, updated.machineId);
          const allRuns = this.getByBeanAndMachine(updated.beanId, updated.machineId);
          allRuns.forEach(r => {
            if (r.rating !== null && r.rating !== undefined) {
              BOService.updateWithRun(r.beanId, r.machineId, r);
            }
          });
        } catch (e) {
          console.error('Failed to update BO with run:', e);
        }
      }

      return updated;
    },

    /**
     * Delete a run
     * @param {string} id - Run ID
     * @returns {boolean} True if deleted
     * @throws {Error} If run not found
     */
    delete(id) {
      const runs = this.getAll();

      // Find the run before deleting to get bean/machine IDs for BO update
      const runToDelete = runs.find(r => r.id === id);
      if (!runToDelete) {
        throw new Error(Config.ERRORS.RUN_NOT_FOUND);
      }

      const filtered = runs.filter(r => r.id !== id);
      Storage.set(Config.STORAGE_KEYS.RUNS, filtered);

      // Update Bayesian Optimization by rebuilding from remaining runs
      // Only rebuild if the deleted run had a rating (was part of BO observations)
      if (runToDelete.rating !== null && runToDelete.rating !== undefined) {
        try {
          // Clear BO state and rebuild from all remaining rated runs
          BOService.clearOptimizer(runToDelete.beanId, runToDelete.machineId);
          const remainingRuns = this.getByBeanAndMachine(runToDelete.beanId, runToDelete.machineId);
          remainingRuns.forEach(r => {
            if (r.rating !== null && r.rating !== undefined) {
              BOService.updateWithRun(r.beanId, r.machineId, r);
            }
          });
        } catch (e) {
          console.error('Failed to update BO after run deletion:', e);
        }
      }

      return true;
    },

    /**
     * Toggle star status for a run
     * CRITICAL: Only one run can be starred per bean-machine combination
     * @param {string} id - Run ID
     * @param {boolean} starred - Star status
     * @returns {object} Updated run
     */
    setStar(id, starred) {
      const runs = this.getAll();
      const index = runs.findIndex(r => r.id === id);

      if (index === -1) {
        throw new Error(Config.ERRORS.RUN_NOT_FOUND);
      }

      const run = runs[index];

      // If starring this run, unstar any other run for same bean-machine combo
      if (starred) {
        runs.forEach((r, i) => {
          if (i !== index &&
              r.beanId === run.beanId &&
              r.machineId === run.machineId &&
              r.starred) {
            r.starred = false;
          }
        });
      }

      // Update this run's star status
      runs[index].starred = starred;

      // Save atomically
      Storage.set(Config.STORAGE_KEYS.RUNS, runs);

      return runs[index];
    },

    /**
     * Delete all runs for a specific bean (cascade delete)
     * @param {string} beanId - Bean ID
     * @returns {number} Number of runs deleted
     */
    deleteByBean(beanId) {
      const runs = this.getAll();
      const toDelete = runs.filter(r => r.beanId === beanId);
      const filtered = runs.filter(r => r.beanId !== beanId);
      const count = runs.length - filtered.length;

      if (count > 0) {
        Storage.set(Config.STORAGE_KEYS.RUNS, filtered);

        // Clear BO state for all affected bean-machine combinations
        try {
          const affectedMachines = new Set(toDelete.map(r => r.machineId));
          affectedMachines.forEach(machineId => {
            BOService.clearOptimizer(beanId, machineId);
          });
        } catch (e) {
          console.error('Failed to clear BO state after bean deletion:', e);
        }
      }

      return count;
    },

    /**
     * Delete all runs for a specific machine (cascade delete)
     * @param {string} machineId - Machine ID
     * @returns {number} Number of runs deleted
     */
    deleteByMachine(machineId) {
      const runs = this.getAll();
      const toDelete = runs.filter(r => r.machineId === machineId);
      const filtered = runs.filter(r => r.machineId !== machineId);
      const count = runs.length - filtered.length;

      if (count > 0) {
        Storage.set(Config.STORAGE_KEYS.RUNS, filtered);

        // Clear BO state for all affected bean-machine combinations
        try {
          const affectedBeans = new Set(toDelete.map(r => r.beanId));
          affectedBeans.forEach(beanId => {
            BOService.clearOptimizer(beanId, machineId);
          });
        } catch (e) {
          console.error('Failed to clear BO state after machine deletion:', e);
        }
      }

      return count;
    }
  };

  // Public API
  return {
    MachineRepository,
    BeanRepository,
    RunRepository
  };
})();
