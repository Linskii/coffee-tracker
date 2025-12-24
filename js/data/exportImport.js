/**
 * Export/Import Module
 * Handles exporting and importing of all localStorage data
 */

const ExportImport = (function() {
  'use strict';

  /**
   * Export all app data to JSON file
   * Creates a downloadable JSON file with all beans, machines, and runs
   */
  function exportData() {
    try {
      // Get all app data
      const data = {
        version: Config.APP_VERSION,
        exportDate: new Date().toISOString(),
        machines: Repository.MachineRepository.getAll(),
        beans: Repository.BeanRepository.getAll(),
        runs: Repository.RunRepository.getAll()
      };

      // Convert to JSON string with formatting
      const jsonString = JSON.stringify(data, null, 2);

      // Create blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `coffee-tracker-backup-${getTimestamp()}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      AppState.showSuccess(Config.MESSAGES.DATA_EXPORTED);
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      AppState.showError('Failed to export data: ' + error.message);
      return false;
    }
  }

  /**
   * Import data from JSON file
   * @param {File} file - File object from input element
   * @param {boolean} merge - If true, merge with existing data; if false, replace
   */
  function importData(file, merge = false) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // Check file type
      if (!file.name.endsWith('.json')) {
        reject(new Error('Please select a JSON file'));
        return;
      }

      const reader = new FileReader();

      reader.onload = function(e) {
        try {
          // Parse JSON
          const content = e.target.result;
          const data = JSON.parse(content);

          // Validate data structure
          if (!validateImportData(data)) {
            reject(new Error('Invalid backup file format'));
            return;
          }

          // Import the data
          if (merge) {
            mergeData(data);
          } else {
            replaceData(data);
          }

          AppState.showSuccess(Config.MESSAGES.DATA_IMPORTED);

          // Reload state from storage
          AppState.reloadData();

          resolve(true);
        } catch (error) {
          console.error('Import failed:', error);
          reject(new Error('Failed to import data: ' + error.message));
        }
      };

      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Validate imported data structure
   * @param {object} data - Imported data object
   * @returns {boolean} True if valid
   */
  function validateImportData(data) {
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for required fields
    if (!Array.isArray(data.machines) ||
        !Array.isArray(data.beans) ||
        !Array.isArray(data.runs)) {
      return false;
    }

    return true;
  }

  /**
   * Replace all existing data with imported data
   * @param {object} data - Imported data object
   */
  function replaceData(data) {
    // Clear existing data
    Storage.set(Config.STORAGE_KEYS.MACHINES, []);
    Storage.set(Config.STORAGE_KEYS.BEANS, []);
    Storage.set(Config.STORAGE_KEYS.RUNS, []);

    // Import new data
    Storage.set(Config.STORAGE_KEYS.MACHINES, data.machines);
    Storage.set(Config.STORAGE_KEYS.BEANS, data.beans);
    Storage.set(Config.STORAGE_KEYS.RUNS, data.runs);
  }

  /**
   * Merge imported data with existing data
   * Prevents duplicate IDs by regenerating IDs for imported items if conflicts exist
   * @param {object} data - Imported data object
   */
  function mergeData(data) {
    const existingMachines = Repository.MachineRepository.getAll();
    const existingBeans = Repository.BeanRepository.getAll();
    const existingRuns = Repository.RunRepository.getAll();

    // Create ID mapping for machines and beans
    const machineIdMap = new Map();
    const beanIdMap = new Map();

    // Merge machines
    const mergedMachines = [...existingMachines];
    data.machines.forEach(machine => {
      const existingIds = mergedMachines.map(m => m.id);
      if (existingIds.includes(machine.id)) {
        // Generate new ID if conflict
        const newId = Helpers.generateUUID();
        machineIdMap.set(machine.id, newId);
        machine.id = newId;
      }
      mergedMachines.push(machine);
    });

    // Merge beans
    const mergedBeans = [...existingBeans];
    data.beans.forEach(bean => {
      const existingIds = mergedBeans.map(b => b.id);
      if (existingIds.includes(bean.id)) {
        // Generate new ID if conflict
        const newId = Helpers.generateUUID();
        beanIdMap.set(bean.id, newId);
        bean.id = newId;
      }
      mergedBeans.push(bean);
    });

    // Merge runs and update foreign keys if needed
    const mergedRuns = [...existingRuns];
    data.runs.forEach(run => {
      const existingIds = mergedRuns.map(r => r.id);
      if (existingIds.includes(run.id)) {
        // Generate new ID if conflict
        run.id = Helpers.generateUUID();
      }

      // Update foreign keys if machine or bean IDs were changed
      if (machineIdMap.has(run.machineId)) {
        run.machineId = machineIdMap.get(run.machineId);
      }
      if (beanIdMap.has(run.beanId)) {
        run.beanId = beanIdMap.get(run.beanId);
      }

      mergedRuns.push(run);
    });

    // Save merged data
    Storage.set(Config.STORAGE_KEYS.MACHINES, mergedMachines);
    Storage.set(Config.STORAGE_KEYS.BEANS, mergedBeans);
    Storage.set(Config.STORAGE_KEYS.RUNS, mergedRuns);
  }

  /**
   * Get formatted timestamp for filename
   * @returns {string} Timestamp in YYYYMMDD-HHMMSS format
   */
  function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}-${hours}${minutes}${seconds}`;
  }

  /**
   * Get statistics about current data
   * @returns {object} Object with counts and size info
   */
  function getDataStats() {
    const machines = Repository.MachineRepository.getAll();
    const beans = Repository.BeanRepository.getAll();
    const runs = Repository.RunRepository.getAll();
    const usage = Storage.getUsage();

    return {
      machines: machines.length,
      beans: beans.length,
      runs: runs.length,
      totalItems: machines.length + beans.length + runs.length,
      storageUsed: usage.usedKB,
      storagePercentage: usage.percentage.toFixed(1)
    };
  }

  // Public API
  return {
    exportData,
    importData,
    getDataStats
  };
})();
