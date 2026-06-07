export function calculateWeightedScore(secondary: number, qiyas: number, tahsili: number, weights: {secondary: number, qiyas: number, tahsili: number}) {
  return Math.round(
    (secondary * weights.secondary / 100) +
    (qiyas * weights.qiyas / 100) +
    (tahsili * weights.tahsili / 100)
  );
}

export function calculateEquivalentScore(secondary: number, qiyas: number) {
  return Math.round((secondary * 0.5) + (qiyas * 0.5));
}