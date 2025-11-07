import { SYSTEM_CONFIG } from '../config/systemConfig';

export class EquityOptimizer {
  constructor() {
    this.weights = Array(10).fill(null).map(() => Math.random() * 0.5 + 0.5);
    this.learningRate = 0.01;
    this.trained = false;
  }

  softmax(values) {
    const max = Math.max(...values);
    const exps = values.map(v => Math.exp(v - max));
    const sum = exps.reduce((a, b) => a + b, 0);
    return exps.map(e => e / sum);
  }

  predict(totalAvailable, demands) {
    const adjustedWeights = demands.map((demand, i) => {
      const sector = SYSTEM_CONFIG.sectors[i];
      const lossFactor = 1 - (sector.currentLoss / 100);
      return this.weights[i] * demand * lossFactor;
    });

    const distribution = this.softmax(adjustedWeights);
    return distribution.map(ratio => ratio * totalAvailable);
  }

  train(totalAvailable, demands, epochs = 100) {
    for (let epoch = 0; epoch < epochs; epoch++) {
      const allocation = this.predict(totalAvailable, demands);
      
      const satisfactionRatios = allocation.map((alloc, i) => 
        demands[i] > 0 ? alloc / demands[i] : 1
      );
      
      const meanSatisfaction = satisfactionRatios.reduce((a, b) => a + b) / satisfactionRatios.length;
      
      this.weights = this.weights.map((w, i) => {
        const error = satisfactionRatios[i] - meanSatisfaction;
        return w - this.learningRate * error * 0.1;
      });
    }
    this.trained = true;
  }

  calculateEquityMetrics(allocation, demands) {
    const ratios = allocation.map((alloc, i) => 
      demands[i] > 0 ? (alloc / demands[i]) * 100 : 100
    );
    
    const mean = ratios.reduce((a, b) => a + b) / ratios.length;
    const variance = ratios.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratios.length;
    const stdDev = Math.sqrt(variance);
    const cv = (stdDev / mean) * 100;
    
    const sortedRatios = [...ratios].sort((a, b) => a - b);
    let giniSum = 0;
    sortedRatios.forEach((ratio, i) => {
      giniSum += (2 * (i + 1) - ratios.length - 1) * ratio;
    });
    const gini = giniSum / (ratios.length * ratios.reduce((a, b) => a + b));
    
    return {
      satisfactionRatios: ratios,
      mean,
      stdDev,
      cv,
      gini: Math.abs(gini),
      equityIndex: Math.max(0, 100 - cv)
    };
  }
}