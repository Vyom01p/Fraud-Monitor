/**
 * Converts a raw transaction into the feature payload the ML service expects.
 *
 * CAVEAT: The Kaggle-trained model expects 28 anonymized "V" features that
 * came from the bank's own internal signals — they can't be recomputed for
 * a live transaction we generate ourselves. We zero-fill them here, which
 * means the model is mainly reacting to `amount` and `time` in this setup,
 * not the full feature set it was trained on.
 */
export async function buildFeature(tx) {
  const secondsSinceEpoch = Math.floor(Date.now() / 1000);
  return {
    amount: tx.amount,
    time: secondsSinceEpoch,
    v_features: new Array(28).fill(0),
  };
}
