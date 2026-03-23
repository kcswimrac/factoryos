// DOE Design Matrix Generation

/**
 * Generate full factorial design runs
 * @param {Array} factors - Array of factor objects with lowLevel, highLevel, centerPoint
 * @param {boolean} includeCenterPoints - Whether to include center point runs
 * @returns {Array} Array of runs with factor levels
 */
function generateFullFactorial(factors, includeCenterPoints = false) {
  const runs = [];
  const numFactors = factors.length;
  const numRuns = Math.pow(2, numFactors);

  for (let i = 0; i < numRuns; i++) {
    const run = {
      runNumber: i + 1,
      runType: 'standard',
      factorLevels: []
    };

    for (let j = 0; j < numFactors; j++) {
      const factor = factors[j];
      const isHigh = (i >> j) & 1;

      run.factorLevels.push({
        factorId: factor.id || factor.factor_id || (j + 1),
        levelValue: isHigh ? factor.highLevel || factor.high_level : factor.lowLevel || factor.low_level,
        levelCoded: isHigh ? '+1' : '-1'
      });
    }

    runs.push(run);
  }

  if (includeCenterPoints) {
    const centerPointRuns = 4;
    for (let i = 0; i < centerPointRuns; i++) {
      const run = {
        runNumber: numRuns + i + 1,
        runType: 'center_point',
        factorLevels: []
      };

      for (let j = 0; j < numFactors; j++) {
        const factor = factors[j];
        const centerValue = factor.centerPoint || factor.center_point ||
                           ((factor.lowLevel || factor.low_level) + (factor.highLevel || factor.high_level)) / 2;

        run.factorLevels.push({
          factorId: factor.id || factor.factor_id || (j + 1),
          levelValue: centerValue,
          levelCoded: '0'
        });
      }

      runs.push(run);
    }
  }

  return randomizeRuns(runs);
}

/**
 * Generate fractional factorial design
 */
function generateFractionalFactorial(factors, fraction = 2) {
  const numFactors = factors.length;
  const p = Math.log2(fraction);
  const numRuns = Math.pow(2, numFactors - p);

  const runs = [];

  for (let i = 0; i < numRuns; i++) {
    const run = {
      runNumber: i + 1,
      runType: 'standard',
      factorLevels: []
    };

    for (let j = 0; j < numFactors; j++) {
      const factor = factors[j];
      let isHigh;

      if (j < numFactors - 1) {
        isHigh = (i >> j) & 1;
      } else {
        isHigh = 0;
        for (let k = 0; k < numFactors - 1; k++) {
          isHigh ^= (i >> k) & 1;
        }
      }

      run.factorLevels.push({
        factorId: factor.id || factor.factor_id || (j + 1),
        levelValue: isHigh ? factor.highLevel || factor.high_level : factor.lowLevel || factor.low_level,
        levelCoded: isHigh ? '+1' : '-1'
      });
    }

    runs.push(run);
  }

  return randomizeRuns(runs);
}

/**
 * Generate Plackett-Burman design
 */
function generatePlackettBurman(factors) {
  const numFactors = factors.length;
  const numRuns = Math.ceil((numFactors + 1) / 4) * 4;

  const pbGenerators = {
    8: [1, 1, 1, -1, 1, -1, -1],
    12: [1, 1, -1, 1, 1, 1, -1, -1, -1, 1, -1],
    16: [1, 1, 1, 1, -1, 1, -1, 1, 1, -1, -1, 1, -1, -1, -1],
    20: [1, 1, -1, -1, 1, 1, 1, 1, -1, 1, -1, 1, -1, -1, -1, -1, 1, 1, -1]
  };

  const generator = pbGenerators[numRuns] || pbGenerators[12];
  const runs = [];

  for (let i = 0; i < numRuns; i++) {
    const run = {
      runNumber: i + 1,
      runType: 'standard',
      factorLevels: []
    };

    for (let j = 0; j < numFactors; j++) {
      const factor = factors[j];
      const idx = (i + j) % generator.length;
      const isHigh = generator[idx] === 1;

      run.factorLevels.push({
        factorId: factor.id || factor.factor_id || (j + 1),
        levelValue: isHigh ? factor.highLevel || factor.high_level : factor.lowLevel || factor.low_level,
        levelCoded: isHigh ? '+1' : '-1'
      });
    }

    runs.push(run);
  }

  return randomizeRuns(runs);
}

/**
 * Randomize run order (Fisher-Yates shuffle)
 */
function randomizeRuns(runs) {
  const randomized = [...runs];
  for (let i = randomized.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [randomized[i], randomized[j]] = [randomized[j], randomized[i]];
  }
  return randomized;
}

/**
 * Generate experimental design based on type
 */
function generateDesign(designType, factors) {
  const includeCenterPoints = designType === 'full_factorial_with_center';

  switch (designType) {
    case 'full_factorial':
    case 'full_factorial_with_center':
      return generateFullFactorial(factors, includeCenterPoints);

    case 'fractional_factorial':
      return generateFractionalFactorial(factors);

    case 'plackett_burman':
      return generatePlackettBurman(factors);

    case 'central_composite':
    case 'box_behnken':
      return generateFullFactorial(factors, true);

    default:
      return generateFullFactorial(factors);
  }
}

module.exports = {
  generateFullFactorial,
  generateFractionalFactorial,
  generatePlackettBurman,
  generateDesign
};
