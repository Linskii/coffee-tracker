/**
 * Acquisition Functions for Bayesian Optimization
 *
 * Acquisition functions balance exploration vs exploitation when selecting
 * the next point to sample.
 */
const AcquisitionFunctions = (function() {
  'use strict';

  /**
   * Upper Confidence Bound (UCB) acquisition function
   *
   * UCB(x) = mean(x) + β * stddev(x)
   *
   * Where β (exploration) controls the exploration-exploitation tradeoff:
   * - Higher β: More exploration (try uncertain areas)
   * - Lower β: More exploitation (try areas with high predicted values)
   *
   * @param {number} mean - Predicted mean at point x
   * @param {number} variance - Predicted variance at point x
   * @param {number} exploration - Exploration factor β (default: 2.0)
   * @returns {number} UCB acquisition value (higher is better)
   */
  function ucb(mean, variance, exploration = 2.0) {
    const stddev = Math.sqrt(Math.max(0, variance));
    return mean + exploration * stddev;
  }

  /**
   * Find the point with maximum UCB among candidates
   *
   * @param {number[]} means - Predicted means for candidate points
   * @param {number[]} variances - Predicted variances for candidate points
   * @param {number} exploration - Exploration factor
   * @returns {number} Index of best candidate
   */
  function findMaxUCB(means, variances, exploration = 2.0) {
    if (means.length === 0) {
      throw new Error('findMaxUCB: Empty candidates array');
    }

    let maxUCB = -Infinity;
    let maxIndex = 0;

    for (let i = 0; i < means.length; i++) {
      const ucbValue = ucb(means[i], variances[i], exploration);
      if (ucbValue > maxUCB) {
        maxUCB = ucbValue;
        maxIndex = i;
      }
    }

    return maxIndex;
  }

  return { ucb, findMaxUCB };
})();
