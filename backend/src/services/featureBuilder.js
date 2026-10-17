const DATASET_SPAN_SECONDS = 172800;

export function buildFeatures(tx, mlFeatures) {
  if (mlFeatures) {
    return {
      amount: tx.amount,
      time: mlFeatures.time,
      v_features: mlFeatures.v,
    };
  }
  return {
    amount: tx.amount,
    time: Math.floor(Date.now() / 1000) % DATASET_SPAN_SECONDS,
    v_features: new Array(28).fill(0),
  };
}
