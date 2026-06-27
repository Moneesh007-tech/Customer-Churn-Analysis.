/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface NotebookCell {
  cellType: 'code' | 'markdown';
  source: string;
  executionCount?: number;
  outputs?: Array<{
    outputType: string;
    text?: string[];
    data?: {
      'text/plain'?: string[];
      'text/html'?: string[];
      'image/png'?: string;
    };
  }>;
}

export interface ChurnFeature {
  name: string;
  label: string;
  type: 'categorical' | 'numerical';
  description: string;
  options?: string[];
  min?: number;
  max?: number;
  defaultValue: string | number;
  importance: number; // Scale of 0 to 1
}

export interface NotebookAnalysis {
  notebookName: string;
  modelName: string;
  accuracy: number;
  features: ChurnFeature[];
  keyInsights: {
    title: string;
    description: string;
    metric?: string;
  }[];
  methodologySummary: string;
  codeCellsAnalyzed: number;
  isFallback?: boolean;
}

export interface PredictionResult {
  churnProbability: number; // 0 to 100
  riskLevel: 'Low' | 'Medium' | 'High';
  reasons: {
    feature: string;
    effect: 'increases_risk' | 'decreases_risk';
    description: string;
  }[];
  retentionStrategy: {
    offerName: string;
    discountDetails: string;
    actionability: string;
    impactPotential: 'High' | 'Medium' | 'Low';
  }[];
  isFallback?: boolean;
}
