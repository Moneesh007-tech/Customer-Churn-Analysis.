/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { NotebookCell } from '../types';

export function parseNotebook(rawJson: string): NotebookCell[] {
  try {
    const data = JSON.parse(rawJson);
    if (!data || !Array.isArray(data.cells)) {
      throw new Error('Invalid notebook format: cells array not found.');
    }

    return data.cells.map((cell: any) => {
      // Extract cell source text
      const sourceLines = Array.isArray(cell.source) ? cell.source : [cell.source || ''];
      const sourceText = sourceLines.join('');

      // Normalize outputs for code cells
      let parsedOutputs: NotebookCell['outputs'] = [];
      if (cell.cell_type === 'code' && Array.isArray(cell.outputs)) {
        parsedOutputs = cell.outputs.map((out: any) => {
          const textLines = out.text ? (Array.isArray(out.text) ? out.text : [out.text]) : undefined;
          return {
            outputType: out.output_type || 'unknown',
            text: textLines,
            data: out.data ? {
              'text/plain': out.data['text/plain'] ? (Array.isArray(out.data['text/plain']) ? out.data['text/plain'] : [out.data['text/plain']]) : undefined,
              'text/html': out.data['text/html'] ? (Array.isArray(out.data['text/html']) ? out.data['text/html'] : [out.data['text/html']]) : undefined,
              'image/png': out.data['image/png'] || undefined
            } : undefined
          };
        });
      }

      return {
        cellType: cell.cell_type === 'code' ? 'code' : 'markdown',
        source: sourceText,
        executionCount: cell.execution_count || undefined,
        outputs: cell.cell_type === 'code' ? parsedOutputs : undefined
      };
    });
  } catch (error) {
    console.log("[ERROR_HANDLED] Failed to parse notebook JSON:", error);
    throw new Error(error instanceof Error ? error.message : 'Invalid JSON format');
  }
}
