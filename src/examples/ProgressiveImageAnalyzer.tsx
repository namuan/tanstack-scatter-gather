import { useState } from 'react';
import { useParallelScatterGather } from '../useParallelScatterGather';

const analysisWorkers = {
  objectDetection: async (url: string) => {
    const res = await fetch('/api/analyze/detect-objects', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
  textExtraction: async (url: string) => {
    const res = await fetch('/api/analyze/extract-text', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
  colorAnalysis: async (url: string) => {
    const res = await fetch('/api/analyze/colors', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
  qualityCheck: async (url: string) => {
    const res = await fetch('/api/analyze/quality', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
    return res.json();
  },
};

export const ProgressiveImageAnalyzer = () => {
  const [imageUrl, setImageUrl] = useState('');

  const { results, progress, isComplete, isPartial } = useParallelScatterGather({
    workers: analysisWorkers,
    input: imageUrl,
    batchSize: 2,
    enabled: !!imageUrl,
  });

  return (
    <div>
      <input
        type="text"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Enter image URL"
      />

      {isPartial && (
        <div className="progress">
          <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
          <p>Analyzing image... {Math.round(progress * 100)}% complete</p>
        </div>
      )}

      {isComplete && (
        <div className="analysis-results">
          {Array.from(results.entries()).map(([analyzer, result]: [string, any]) => (
            <div key={analyzer} className="analysis-result">
              <h3>{analyzer}</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
