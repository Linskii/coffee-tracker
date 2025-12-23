/**
 * Gaussian Process Regression
 *
 * Implements GP regression for Bayesian Optimization with RBF kernel.
 * Uses Cholesky decomposition for numerical stability.
 */
const GaussianProcess = (function() {
  'use strict';

  /**
   * Gaussian Process Regressor
   */
  class GP {
    /**
     * @param {RBFKernel} kernel - Kernel function
     * @param {number} noise - Observation noise level (default: 0.1)
     */
    constructor(kernel, noise = 0.1) {
      this.kernel = kernel;
      this.noise = noise;

      // Training data
      this.X_train = null;  // Input observations (N x D)
      this.y_train = null;  // Output observations (N x 1)

      // Cached values for prediction
      this.K_inv = null;    // Inverse of kernel matrix
      this.alpha = null;    // K_inv * y_train
    }

    /**
     * Train the GP on observations
     * @param {number[][]} X - Training inputs (N x D array)
     * @param {number[]} y - Training outputs (N-length array)
     */
    fit(X, y) {
      if (X.length !== y.length) {
        throw new Error('GP.fit: X and y must have same length');
      }
      if (X.length === 0) {
        throw new Error('GP.fit: Cannot fit with zero observations');
      }

      this.X_train = X;
      this.y_train = y;

      const N = X.length;

      // Compute kernel matrix K + noise*I
      const K = this._computeKernelMatrix(X, X);

      // Add noise to diagonal for numerical stability
      for (let i = 0; i < N; i++) {
        K[i][i] += this.noise;
      }

      // Compute K_inv using Cholesky decomposition
      try {
        this.K_inv = this._choleskyInverse(K);
      } catch (e) {
        // Fallback: add more jitter
        console.warn('GP: Cholesky failed, adding jitter');
        for (let i = 0; i < N; i++) {
          K[i][i] += 0.01;
        }
        this.K_inv = this._choleskyInverse(K);
      }

      // Compute alpha = K_inv * y
      this.alpha = this._matvec(this.K_inv, y);
    }

    /**
     * Predict mean and variance at test points
     * @param {number[][]} X_test - Test inputs (M x D array)
     * @returns {Object} {mean: number[], variance: number[]}
     */
    predict(X_test) {
      if (!this.X_train) {
        throw new Error('GP.predict: Must call fit() before predict()');
      }

      const M = X_test.length;
      const mean = new Array(M);
      const variance = new Array(M);

      // Compute K_star (kernel between test and train)
      const K_star = this._computeKernelMatrix(X_test, this.X_train);

      for (let i = 0; i < M; i++) {
        // Mean: k(x_test, X_train) * alpha
        mean[i] = 0;
        for (let j = 0; j < this.y_train.length; j++) {
          mean[i] += K_star[i][j] * this.alpha[j];
        }

        // Variance: k(x_test, x_test) - k(x_test, X_train) * K_inv * k(X_train, x_test)
        const k_test_test = this.kernel.compute(X_test[i], X_test[i]);

        // Compute k * K_inv
        const k_Kinv = new Array(this.X_train.length);
        for (let j = 0; j < this.X_train.length; j++) {
          k_Kinv[j] = 0;
          for (let k = 0; k < this.X_train.length; k++) {
            k_Kinv[j] += K_star[i][k] * this.K_inv[k][j];
          }
        }

        // Compute k * K_inv * k^T
        let k_Kinv_k = 0;
        for (let j = 0; j < this.X_train.length; j++) {
          k_Kinv_k += k_Kinv[j] * K_star[i][j];
        }

        variance[i] = Math.max(0, k_test_test - k_Kinv_k);
      }

      return { mean, variance };
    }

    /**
     * Compute kernel matrix K[i,j] = kernel(X1[i], X2[j])
     * @private
     */
    _computeKernelMatrix(X1, X2) {
      const N1 = X1.length;
      const N2 = X2.length;
      const K = new Array(N1);

      for (let i = 0; i < N1; i++) {
        K[i] = new Array(N2);
        for (let j = 0; j < N2; j++) {
          K[i][j] = this.kernel.compute(X1[i], X2[j]);
        }
      }

      return K;
    }

    /**
     * Compute matrix inverse using Cholesky decomposition
     * @private
     */
    _choleskyInverse(A) {
      const N = A.length;

      // Cholesky decomposition: A = L * L^T
      const L = this._cholesky(A);

      // Solve L * L^T * inv = I
      // First solve L * Y = I for Y
      const Y = this._forwardSubstitution(L);

      // Then solve L^T * inv = Y for inv
      const inv = this._backwardSubstitution(L, Y);

      return inv;
    }

    /**
     * Cholesky decomposition
     * @private
     */
    _cholesky(A) {
      const N = A.length;
      const L = new Array(N);

      for (let i = 0; i < N; i++) {
        L[i] = new Array(N).fill(0);
      }

      for (let i = 0; i < N; i++) {
        for (let j = 0; j <= i; j++) {
          let sum = 0;
          for (let k = 0; k < j; k++) {
            sum += L[i][k] * L[j][k];
          }

          if (i === j) {
            const val = A[i][i] - sum;
            if (val <= 0) {
              throw new Error('Matrix not positive definite');
            }
            L[i][j] = Math.sqrt(val);
          } else {
            L[i][j] = (A[i][j] - sum) / L[j][j];
          }
        }
      }

      return L;
    }

    /**
     * Forward substitution: solve L * Y = I
     * @private
     */
    _forwardSubstitution(L) {
      const N = L.length;
      const Y = new Array(N);

      for (let i = 0; i < N; i++) {
        Y[i] = new Array(N);
        for (let j = 0; j < N; j++) {
          if (i === j) {
            Y[i][j] = 1.0 / L[i][i];
          } else if (i > j) {
            let sum = 0;
            for (let k = j; k < i; k++) {
              sum += L[i][k] * Y[k][j];
            }
            Y[i][j] = -sum / L[i][i];
          } else {
            Y[i][j] = 0;
          }
        }
      }

      return Y;
    }

    /**
     * Backward substitution: solve L^T * inv = Y
     * @private
     */
    _backwardSubstitution(L, Y) {
      const N = L.length;
      const inv = new Array(N);

      for (let i = 0; i < N; i++) {
        inv[i] = new Array(N);
      }

      for (let i = N - 1; i >= 0; i--) {
        for (let j = N - 1; j >= 0; j--) {
          let sum = Y[i][j];
          for (let k = i + 1; k < N; k++) {
            sum -= L[k][i] * inv[k][j];
          }
          inv[i][j] = sum / L[i][i];
        }
      }

      return inv;
    }

    /**
     * Matrix-vector multiplication
     * @private
     */
    _matvec(A, v) {
      const N = A.length;
      const result = new Array(N);

      for (let i = 0; i < N; i++) {
        result[i] = 0;
        for (let j = 0; j < v.length; j++) {
          result[i] += A[i][j] * v[j];
        }
      }

      return result;
    }
  }

  return { GP };
})();
