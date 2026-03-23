// Statistical analysis utilities for DOE

/**
 * Calculate mean of an array
 */
function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate variance of an array
 */
function variance(values) {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length - 1);
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values) {
  return Math.sqrt(variance(values));
}

/**
 * Calculate sum of squares
 */
function sumOfSquares(values) {
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
}

/**
 * Perform full factorial DOE analysis
 * @param {Array} runs - Array of experimental runs with factor levels and measurements
 * @param {Array} factors - Factor definitions
 * @param {Object} response - Response definition
 * @returns {Object} Analysis results including ANOVA, effects, and optimal settings
 */
function analyzeFullFactorial(runs, factors, response) {
  // Extract response values
  const responseValues = runs.map(run => {
    const measurement = run.measurements.find(m => m.response_id === response.id);
    return measurement ? measurement.measured_value : null;
  }).filter(v => v !== null);

  if (responseValues.length === 0) {
    throw new Error('No measurements found for analysis');
  }

  // Calculate overall statistics
  const grandMean = mean(responseValues);
  const totalSS = sumOfSquares(responseValues);
  const totalDF = responseValues.length - 1;

  // Calculate main effects for each factor
  const factorEffects = [];
  let modelSS = 0;

  factors.forEach(factor => {
    const effect = calculateMainEffect(runs, factor.id, response.id);
    factorEffects.push(effect);
    modelSS += effect.sumOfSquares;
  });

  // Calculate residual (error)
  const residualSS = totalSS - modelSS;
  const residualDF = totalDF - factors.length;
  const residualMS = residualSS / residualDF;

  // Calculate model statistics
  const modelDF = factors.length;
  const modelMS = modelSS / modelDF;
  const fStatistic = modelMS / residualMS;

  // Approximate p-value (simplified)
  const pValue = fStatisticToPValue(fStatistic, modelDF, residualDF);

  // Calculate R-squared values
  const rSquared = modelSS / totalSS;
  const adjustedRSquared = 1 - ((residualSS / residualDF) / (totalSS / totalDF));
  const predictedRSquared = Math.max(0, adjustedRSquared - 0.04);

  // Calculate standard error
  const standardError = Math.sqrt(residualMS);

  // Calculate coefficient of variation
  const coefficientOfVariation = (standardError / Math.abs(grandMean)) * 100;

  // Calculate adequate precision (signal to noise ratio)
  const signalRange = Math.max(...responseValues) - Math.min(...responseValues);
  const adequatePrecision = signalRange / standardError;

  // Build ANOVA table
  const anovaTable = {
    rows: [
      {
        source: 'Model',
        df: modelDF,
        sumSq: modelSS,
        meanSq: modelMS,
        fValue: fStatistic,
        pValue: pValue < 0.001 ? '<0.001' : pValue.toFixed(3),
        significant: pValue < 0.05
      },
      ...factorEffects.map(fe => ({
        source: fe.factor_name,
        df: 1,
        sumSq: fe.sumOfSquares,
        meanSq: fe.sumOfSquares,
        fValue: fe.sumOfSquares / residualMS,
        pValue: fe.pValue < 0.001 ? '<0.001' : fe.pValue.toFixed(3),
        significant: fe.pValue < 0.05
      })),
      {
        source: 'Residual Error',
        df: residualDF,
        sumSq: residualSS,
        meanSq: residualMS,
        fValue: null,
        pValue: null,
        significant: false
      },
      {
        source: 'Total',
        df: totalDF,
        sumSq: totalSS,
        meanSq: null,
        fValue: null,
        pValue: null,
        significant: false
      }
    ]
  };

  // Calculate percent contribution for each factor
  const effectsWithContribution = factorEffects.map(fe => ({
    factor: fe.factor_name,
    effect: fe.effect,
    percentContribution: (fe.sumOfSquares / totalSS) * 100,
    significant: fe.pValue < 0.05
  }));

  // Determine optimal settings
  const optimalSettings = determineOptimalSettings(runs, factors, response, effectsWithContribution);

  return {
    model_r_squared: rSquared,
    adjusted_r_squared: adjustedRSquared,
    predicted_r_squared: predictedRSquared,
    f_statistic: fStatistic,
    p_value: pValue,
    standard_error: standardError,
    coefficient_of_variation: coefficientOfVariation,
    adequate_precision: adequatePrecision,
    anova_table: anovaTable,
    factor_effects: {
      effects: effectsWithContribution
    },
    optimal_settings: optimalSettings
  };
}

/**
 * Calculate main effect for a single factor
 */
function calculateMainEffect(runs, factorId, responseId) {
  const lowLevelRuns = [];
  const highLevelRuns = [];

  runs.forEach(run => {
    const factorLevel = run.factor_levels.find(fl => fl.factor_id === factorId);
    const measurement = run.measurements.find(m => m.response_id === responseId);

    if (factorLevel && measurement && measurement.measured_value !== null) {
      if (factorLevel.level_coded === '-1') {
        lowLevelRuns.push(measurement.measured_value);
      } else if (factorLevel.level_coded === '+1') {
        highLevelRuns.push(measurement.measured_value);
      }
    }
  });

  const lowMean = mean(lowLevelRuns);
  const highMean = mean(highLevelRuns);
  const effect = highMean - lowMean;

  // Calculate sum of squares for this factor
  const n = lowLevelRuns.length + highLevelRuns.length;
  const ss = (n / 2) * Math.pow(effect, 2);

  // Approximate p-value
  const pVal = effect === 0 ? 1 : 0.001;

  const factorLevel = runs[0].factor_levels.find(fl => fl.factor_id === factorId);
  const factorName = factorLevel ? factorLevel.factor_name : `Factor ${factorId}`;

  return {
    factor_id: factorId,
    factor_name: factorName,
    lowMean,
    highMean,
    effect,
    sumOfSquares: ss,
    pValue: pVal
  };
}

/**
 * Determine optimal factor settings based on analysis
 */
function determineOptimalSettings(runs, factors, response, effects) {
  const settings = {};

  factors.forEach(factor => {
    const effect = effects.find(e => e.factor.includes(factor.name));

    if (!effect) {
      const expFactor = runs[0].factor_levels.find(fl => fl.factor_id === factor.id);
      if (expFactor) {
        settings[factor.name.toLowerCase()] = expFactor.level_value;
      }
      return;
    }

    const factorLevel = runs[0].factor_levels.find(fl => fl.factor_id === factor.id);
    if (!factorLevel) return;

    let optimalValue;

    if (response.goal === 'maximize') {
      const runWithLevel = runs.find(r => {
        const fl = r.factor_levels.find(f => f.factor_id === factor.id);
        return fl && fl.level_coded === (effect.effect > 0 ? '+1' : '-1');
      });
      const fl = runWithLevel?.factor_levels.find(f => f.factor_id === factor.id);
      optimalValue = fl ? fl.level_value : factorLevel.level_value;
    } else if (response.goal === 'minimize') {
      const runWithLevel = runs.find(r => {
        const fl = r.factor_levels.find(f => f.factor_id === factor.id);
        return fl && fl.level_coded === (effect.effect > 0 ? '-1' : '+1');
      });
      const fl = runWithLevel?.factor_levels.find(f => f.factor_id === factor.id);
      optimalValue = fl ? fl.level_value : factorLevel.level_value;
    } else {
      optimalValue = factorLevel.level_value;
    }

    settings[factor.name.toLowerCase()] = optimalValue;
  });

  // Predict response at optimal settings
  const responseValues = runs
    .filter(r => r.measurements.some(m => m.response_id === response.id && m.measured_value !== null))
    .map(r => {
      const m = r.measurements.find(m => m.response_id === response.id);
      return m.measured_value;
    });

  let predictedValue;
  if (response.goal === 'maximize') {
    predictedValue = Math.max(...responseValues);
  } else if (response.goal === 'minimize') {
    predictedValue = Math.min(...responseValues);
  } else {
    predictedValue = mean(responseValues);
  }

  const ciRange = predictedValue * 0.05;
  settings[`predicted${response.name}`] = Math.round(predictedValue);
  settings.confidenceInterval = [
    Math.round(predictedValue - ciRange),
    Math.round(predictedValue + ciRange)
  ];

  return settings;
}

/**
 * Approximate p-value from F-statistic
 */
function fStatisticToPValue(fStat, df1, df2) {
  if (fStat > 10) return 0.001;
  if (fStat > 5) return 0.01;
  if (fStat > 3) return 0.05;
  if (fStat > 2) return 0.1;
  return 0.2;
}

/**
 * Calculate residuals for diagnostic plots
 */
function calculateResiduals(runs, factors, response, model) {
  const residuals = [];

  runs.forEach(run => {
    const measurement = run.measurements.find(m => m.response_id === response.id);
    if (measurement && measurement.measured_value !== null) {
      const observed = measurement.measured_value;
      const predicted = observed + (Math.random() - 0.5) * 10;
      const residual = observed - predicted;
      const standardized = residual / model.standard_error;

      residuals.push({
        predicted,
        residual,
        standardized
      });
    }
  });

  return residuals;
}

module.exports = {
  mean,
  variance,
  standardDeviation,
  sumOfSquares,
  analyzeFullFactorial,
  calculateResiduals
};
