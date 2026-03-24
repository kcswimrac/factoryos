// Statistical analysis utilities for DOE
//
// Implements: ANOVA (main effects + 2-way interactions), F-distribution p-values,
// residual diagnostics, optimal settings, and confidence intervals.

// ═══════════════════════════════════════════════════════════════════════════════
// Basic Statistics
// ═══════════════════════════════════════════════════════════════════════════════

function mean(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function variance(values) {
  if (values.length === 0) return 0;
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / (values.length - 1);
}

function standardDeviation(values) {
  return Math.sqrt(variance(values));
}

function sumOfSquares(values) {
  const avg = mean(values);
  return values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// F-Distribution P-Value (Regularized Incomplete Beta Function)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Compute p-value from F-statistic using the regularized incomplete beta function.
 * P(F > fStat | df1, df2) = 1 - I_x(df1/2, df2/2) where x = df1*fStat / (df1*fStat + df2)
 *
 * Uses continued fraction expansion (Lentz's method) for numerical stability.
 */
function fDistributionPValue(fStat, df1, df2) {
  if (fStat <= 0 || df1 <= 0 || df2 <= 0) return 1;
  if (!isFinite(fStat)) return 0;

  const x = (df1 * fStat) / (df1 * fStat + df2);
  const a = df1 / 2;
  const b = df2 / 2;

  // P-value = 1 - I_x(a, b) = I_{1-x}(b, a)
  return 1 - regularizedBeta(x, a, b);
}

/**
 * Regularized incomplete beta function I_x(a, b) via continued fraction (Lentz).
 */
function regularizedBeta(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry: if x > (a+1)/(a+b+2), compute 1 - I_{1-x}(b,a) for convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }

  const lnBeta = lnGamma(a) + lnGamma(b) - lnGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lnBeta) / a;

  // Continued fraction (Lentz's method)
  const maxIter = 200;
  const eps = 1e-14;
  let f = 1, c = 1, d = 0;

  for (let m = 0; m <= maxIter; m++) {
    let numerator;
    if (m === 0) {
      numerator = 1;
    } else {
      const k = m;
      const isEven = k % 2 === 0;
      const halfK = Math.floor(k / 2);
      if (isEven) {
        // even term: d_m = m(b-m)x / ((a+2m-1)(a+2m))
        numerator = (halfK * (b - halfK) * x) / ((a + 2 * halfK - 1) * (a + 2 * halfK));
      } else {
        // odd term: d_m = -((a+m)(a+b+m)x) / ((a+2m)(a+2m+1))
        numerator = -((a + halfK) * (a + b + halfK) * x) / ((a + 2 * halfK) * (a + 2 * halfK + 1));
      }
    }

    d = 1 + numerator * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;

    c = 1 + numerator / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;

    f *= c * d;
    if (Math.abs(c * d - 1) < eps) break;
  }

  return front * (f - 1);
}

/**
 * Log-gamma via Stirling's approximation (Lanczos coefficients).
 */
function lnGamma(z) {
  if (z <= 0) return Infinity;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Effect Calculation
// ═══════════════════════════════════════════════════════════════════════════════

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

  const n = lowLevelRuns.length + highLevelRuns.length;
  const ss = n > 0 ? (n / 4) * Math.pow(effect, 2) : 0;

  const factorLevel = runs[0]?.factor_levels.find(fl => fl.factor_id === factorId);
  const factorName = factorLevel ? factorLevel.factor_name : `Factor ${factorId}`;

  return {
    factor_id: factorId,
    factor_name: factorName,
    lowMean,
    highMean,
    effect,
    sumOfSquares: ss,
    // p-value computed after we know residual MS
    pValue: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2-Way Interaction Effects
// ═══════════════════════════════════════════════════════════════════════════════

function calculateInteractionEffect(runs, factorIdA, factorIdB, responseId) {
  // Group runs by combined coded level of both factors
  const groups = { '++': [], '+-': [], '-+': [], '--': [] };

  runs.forEach(run => {
    const flA = run.factor_levels.find(fl => fl.factor_id === factorIdA);
    const flB = run.factor_levels.find(fl => fl.factor_id === factorIdB);
    const measurement = run.measurements.find(m => m.response_id === responseId);

    if (flA && flB && measurement && measurement.measured_value !== null) {
      const codedA = flA.level_coded === '+1' ? '+' : (flA.level_coded === '-1' ? '-' : null);
      const codedB = flB.level_coded === '+1' ? '+' : (flB.level_coded === '-1' ? '-' : null);
      if (codedA && codedB) {
        const key = codedA + codedB;
        groups[key].push(measurement.measured_value);
      }
    }
  });

  // Interaction effect = 0.5 * [(mean(++) + mean(--)) - (mean(+-) + mean(-+))]
  const meanPP = mean(groups['++']);
  const meanPM = mean(groups['+-']);
  const meanMP = mean(groups['-+']);
  const meanMM = mean(groups['--']);

  const interactionEffect = 0.5 * ((meanPP + meanMM) - (meanPM + meanMP));

  const totalN = Object.values(groups).reduce((s, g) => s + g.length, 0);
  const ss = totalN > 0 ? (totalN / 4) * Math.pow(interactionEffect, 2) : 0;

  const flA = runs[0]?.factor_levels.find(fl => fl.factor_id === factorIdA);
  const flB = runs[0]?.factor_levels.find(fl => fl.factor_id === factorIdB);
  const nameA = flA ? flA.factor_name : `F${factorIdA}`;
  const nameB = flB ? flB.factor_name : `F${factorIdB}`;

  return {
    factor_ids: [factorIdA, factorIdB],
    interaction_name: `${nameA} × ${nameB}`,
    effect: interactionEffect,
    sumOfSquares: ss,
    pValue: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Full Factorial ANOVA (Main Effects + 2-Way Interactions)
// ═══════════════════════════════════════════════════════════════════════════════

function analyzeFullFactorial(runs, factors, response) {
  const responseValues = runs.map(run => {
    const measurement = run.measurements.find(m => m.response_id === response.id);
    return measurement ? measurement.measured_value : null;
  }).filter(v => v !== null);

  if (responseValues.length === 0) {
    throw new Error('No measurements found for analysis');
  }

  const grandMean = mean(responseValues);
  const totalSS = sumOfSquares(responseValues);
  const totalDF = responseValues.length - 1;

  // ── Main effects ───────────────────────────────────────────────────────────
  const factorEffects = [];
  let modelSS = 0;

  factors.forEach(factor => {
    const effect = calculateMainEffect(runs, factor.id, response.id);
    factorEffects.push(effect);
    modelSS += effect.sumOfSquares;
  });

  // ── 2-way interactions ─────────────────────────────────────────────────────
  const interactionEffects = [];
  for (let i = 0; i < factors.length; i++) {
    for (let j = i + 1; j < factors.length; j++) {
      const interaction = calculateInteractionEffect(
        runs, factors[i].id, factors[j].id, response.id
      );
      interactionEffects.push(interaction);
      modelSS += interaction.sumOfSquares;
    }
  }

  // ── Residual (error) ──────────────────────────────────────────────────────
  const numInteractions = interactionEffects.length;
  const modelDF = factors.length + numInteractions;
  const residualSS = Math.max(0, totalSS - modelSS);
  const residualDF = Math.max(1, totalDF - modelDF);
  const residualMS = residualSS / residualDF;

  const modelMS = modelDF > 0 ? modelSS / modelDF : 0;
  const fStatistic = residualMS > 0 ? modelMS / residualMS : 0;

  // ── P-values using proper F-distribution ──────────────────────────────────
  const pValue = fDistributionPValue(fStatistic, modelDF, residualDF);

  // Compute per-factor p-values
  factorEffects.forEach(fe => {
    const fVal = residualMS > 0 ? fe.sumOfSquares / residualMS : 0;
    fe.fValue = fVal;
    fe.pValue = fDistributionPValue(fVal, 1, residualDF);
  });

  interactionEffects.forEach(ie => {
    const fVal = residualMS > 0 ? ie.sumOfSquares / residualMS : 0;
    ie.fValue = fVal;
    ie.pValue = fDistributionPValue(fVal, 1, residualDF);
  });

  // ── R-squared ─────────────────────────────────────────────────────────────
  const rSquared = totalSS > 0 ? modelSS / totalSS : 0;
  const adjustedRSquared = totalDF > 0
    ? 1 - ((residualSS / residualDF) / (totalSS / totalDF))
    : 0;
  // PRESS-based approximation for predicted R²
  const predictedRSquared = Math.max(0, 1 - ((residualSS * (totalDF + 1)) / (totalSS * residualDF)));

  const standardError = Math.sqrt(residualMS);
  const coefficientOfVariation = grandMean !== 0 ? (standardError / Math.abs(grandMean)) * 100 : 0;

  const signalRange = Math.max(...responseValues) - Math.min(...responseValues);
  const adequatePrecision = standardError > 0 ? signalRange / standardError : 0;

  // ── ANOVA table ───────────────────────────────────────────────────────────
  const formatP = (p) => p < 0.001 ? '<0.001' : p.toFixed(4);

  const anovaTable = {
    rows: [
      {
        source: 'Model',
        df: modelDF,
        sumSq: modelSS,
        meanSq: modelMS,
        fValue: fStatistic,
        pValue: formatP(pValue),
        significant: pValue < 0.05
      },
      ...factorEffects.map(fe => ({
        source: fe.factor_name,
        df: 1,
        sumSq: fe.sumOfSquares,
        meanSq: fe.sumOfSquares,
        fValue: fe.fValue,
        pValue: formatP(fe.pValue),
        significant: fe.pValue < 0.05
      })),
      ...interactionEffects.map(ie => ({
        source: ie.interaction_name,
        df: 1,
        sumSq: ie.sumOfSquares,
        meanSq: ie.sumOfSquares,
        fValue: ie.fValue,
        pValue: formatP(ie.pValue),
        significant: ie.pValue < 0.05
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

  // ── Effects with percent contribution ──────────────────────────────────────
  const allEffects = [
    ...factorEffects.map(fe => ({
      factor: fe.factor_name,
      type: 'main',
      effect: fe.effect,
      percentContribution: totalSS > 0 ? (fe.sumOfSquares / totalSS) * 100 : 0,
      significant: fe.pValue < 0.05
    })),
    ...interactionEffects.map(ie => ({
      factor: ie.interaction_name,
      type: 'interaction',
      effect: ie.effect,
      percentContribution: totalSS > 0 ? (ie.sumOfSquares / totalSS) * 100 : 0,
      significant: ie.pValue < 0.05
    }))
  ];

  const optimalSettings = determineOptimalSettings(runs, factors, response, allEffects, grandMean, factorEffects);

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
      effects: allEffects
    },
    optimal_settings: optimalSettings
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Optimal Settings (model-based prediction)
// ═══════════════════════════════════════════════════════════════════════════════

function determineOptimalSettings(runs, factors, response, effects, grandMean, mainEffects) {
  const settings = {};

  factors.forEach(factor => {
    const me = mainEffects.find(e => e.factor_id === factor.id);
    if (!me) return;

    const factorLevel = runs[0]?.factor_levels.find(fl => fl.factor_id === factor.id);
    if (!factorLevel) return;

    let optimalCoded;
    if (response.goal === 'maximize') {
      optimalCoded = me.effect > 0 ? '+1' : '-1';
    } else if (response.goal === 'minimize') {
      optimalCoded = me.effect > 0 ? '-1' : '+1';
    } else {
      optimalCoded = '0';
    }

    const runWithLevel = runs.find(r => {
      const fl = r.factor_levels.find(f => f.factor_id === factor.id);
      return fl && fl.level_coded === optimalCoded;
    });
    const fl = runWithLevel?.factor_levels.find(f => f.factor_id === factor.id);
    settings[factor.name.toLowerCase()] = fl ? fl.level_value : factorLevel.level_value;
  });

  // Model-based prediction: y = grandMean + sum(0.5 * effect_i * coded_i)
  let predictedValue = grandMean;
  mainEffects.forEach(me => {
    const optimalCoded = (response.goal === 'maximize')
      ? (me.effect > 0 ? 1 : -1)
      : (response.goal === 'minimize')
        ? (me.effect > 0 ? -1 : 1)
        : 0;
    predictedValue += 0.5 * me.effect * optimalCoded;
  });

  // Confidence interval from standard error and t-approximation
  const responseValues = runs
    .filter(r => r.measurements.some(m => m.response_id === response.id && m.measured_value !== null))
    .map(r => r.measurements.find(m => m.response_id === response.id).measured_value);

  const se = standardDeviation(responseValues) / Math.sqrt(responseValues.length);
  const tValue = 2.0; // ~95% CI approximation for typical DOE df
  const ciHalf = tValue * se;

  settings[`predicted_${response.name || 'response'}`] = Math.round(predictedValue * 1000) / 1000;
  settings.confidenceInterval = [
    Math.round((predictedValue - ciHalf) * 1000) / 1000,
    Math.round((predictedValue + ciHalf) * 1000) / 1000
  ];

  return settings;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Residual Diagnostics (actual model-based predictions)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate residuals using a linear model built from main effects.
 * predicted_i = grandMean + sum(0.5 * effect_j * coded_level_ij)
 */
function calculateResiduals(runs, factors, response, model) {
  const responseValues = runs.map(run => {
    const m = run.measurements.find(m => m.response_id === response.id);
    return m ? m.measured_value : null;
  }).filter(v => v !== null);

  const grandMean = mean(responseValues);
  const residuals = [];

  // Build effect map from model's factor_effects
  const effectMap = {};
  if (model && model.factor_effects && model.factor_effects.effects) {
    model.factor_effects.effects
      .filter(e => e.type === 'main' || !e.type)
      .forEach(e => { effectMap[e.factor] = e.effect; });
  }

  runs.forEach(run => {
    const measurement = run.measurements.find(m => m.response_id === response.id);
    if (!measurement || measurement.measured_value === null) return;

    const observed = measurement.measured_value;

    // Compute predicted from linear model
    let predicted = grandMean;
    run.factor_levels.forEach(fl => {
      if (fl.level_coded === '0') return; // skip center points
      const coded = fl.level_coded === '+1' ? 1 : -1;
      const effectName = fl.factor_name;
      if (effectMap[effectName]) {
        predicted += 0.5 * effectMap[effectName] * coded;
      }
    });

    const residual = observed - predicted;
    const se = model && model.standard_error > 0 ? model.standard_error : 1;
    const standardized = residual / se;

    residuals.push({
      runNumber: run.run_number,
      observed,
      predicted,
      residual,
      standardized
    });
  });

  return residuals;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  mean,
  variance,
  standardDeviation,
  sumOfSquares,
  analyzeFullFactorial,
  calculateResiduals,
  fDistributionPValue
};
