/**
 * Kernel Functions for Gaussian Processes
 *
 * Provides kernel functions used in GP regression for Bayesian Optimization.
 */
const Kernels = (function() {
  'use strict';

  /**
   * Radial Basis Function (RBF) / Squared Exponential Kernel
   *
   * Computes similarity between points using:
   * k(x1, x2) = σ² * exp(-0.5 * ||x1-x2||² / l²)
   *
   * Where:
   * - σ² (outputScale): Controls output variance
   * - l (lengthScale): Controls how quickly similarity decreases with distance
   */
  class RBFKernel {
    /**
     * @param {number} lengthScale - Controls correlation distance (default: 1.0)
     * @param {number} outputScale - Controls output variance (default: 1.0)
     */
    constructor(lengthScale = 1.0, outputScale = 1.0) {
      this.lengthScale = lengthScale;
      this.outputScale = outputScale;
    }

    /**
     * Compute kernel value between two points
     * @param {number[]} x1 - First point (normalized parameter vector)
     * @param {number[]} x2 - Second point (normalized parameter vector)
     * @returns {number} Kernel similarity value
     */
    compute(x1, x2) {
      if (x1.length !== x2.length) {
        throw new Error('Kernel: x1 and x2 must have same dimensionality');
      }

      let squaredDist = 0;
      for (let i = 0; i < x1.length; i++) {
        const diff = x1[i] - x2[i];
        squaredDist += diff * diff;
      }

      return this.outputScale * Math.exp(
        -0.5 * squaredDist / (this.lengthScale * this.lengthScale)
      );
    }

    /**
     * Update kernel hyperparameters
     * @param {Object} params - New hyperparameters
     */
    setParams(params) {
      if (params.lengthScale !== undefined) {
        this.lengthScale = params.lengthScale;
      }
      if (params.outputScale !== undefined) {
        this.outputScale = params.outputScale;
      }
    }
  }

  return { RBFKernel };
})();
