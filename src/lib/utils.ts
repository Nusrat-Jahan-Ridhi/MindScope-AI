/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Emotion labels and their scores as defined in the Python reference code.
 */
export const EMOTION_SCORES: Record<string, number> = {
  sadness: -1.0,
  joy: 1.0,
  love: 0.9,
  anger: -1.0,
  fear: -0.7,
  surprise: 0.4,
};

export const EMOTION_LABELS = Object.keys(EMOTION_SCORES);

export interface AnalysisResult {
  sentence: string;
  emotions: {
    roberta: string;
    distilbert: string;
    electra: string;
  };
  scores: {
    roberta: number;
    distilbert: number;
    electra: number;
  };
}

/**
 * Calculates risk level based on a sequence of emotion scores.
 * Formula from Python code:
 * risk_score = ((1 - avg_emotion) * 0.4) + (volatility * 0.3) + (max(0, -trend) * 0.3)
 */
export function calculateRisk(scores: number[]) {
  if (scores.length === 0) return { score: 0, level: 'LOW' as const };

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  const trend = scores.length > 1 ? scores[scores.length - 1] - scores[0] : 0;
  
  const variance = scores.reduce((a, b) => a + Math.pow(b - average, 2), 0) / scores.length;
  const volatility = Math.sqrt(variance);

  let riskScore = ((1 - average) * 0.4) + (volatility * 0.3) + (Math.max(0, -trend) * 0.3);
  
  // Clamp between 0 and 1
  riskScore = Math.max(0, Math.min(riskScore, 1));

  let level: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  if (riskScore > 0.7) level = 'HIGH';
  else if (riskScore > 0.4) level = 'MEDIUM';

  return {
    score: riskScore,
    level,
    stats: {
      average,
      trend,
      volatility
    }
  };
}
