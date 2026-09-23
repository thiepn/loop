export function dbToGain(db: number): number {
  return 10 ** (db / 20);
}

export function gainToDb(gain: number): number {
  if (gain <= 0) {
    return Number.NEGATIVE_INFINITY;
  }

  return 20 * Math.log10(gain);
}

export function metadataNormalizationGain(
  nominalDb: number,
  targetNominalDb = -18,
): number {
  const correctionDb = Math.min(6, Math.max(-9, targetNominalDb - nominalDb));
  return dbToGain(correctionDb);
}

export function headroomCompensation(activeVoiceCount: number): number {
  const count = Math.max(1, Math.floor(activeVoiceCount));
  return Math.max(0.35, 1 / Math.sqrt(count));
}

export function recommendedVoiceGain(
  nominalDb: number,
  activeVoiceCount: number,
  roleTrimDb = 0,
): number {
  return metadataNormalizationGain(nominalDb) *
    headroomCompensation(activeVoiceCount) *
    dbToGain(roleTrimDb);
}
