'use client';

import { useState } from 'react';
import FeatureList from '@/components/features/FeatureList';
import FeatureSpecViewer from '@/components/features/FeatureSpecViewer';
import { FeatureMetadata } from '@/lib/features/parser';

export default function FeaturesPage() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureMetadata | null>(null);
  const [specToLoad, setSpecToLoad] = useState<string | null>(null);

  const handleFeatureSelect = (feature: FeatureMetadata) => {
    setSelectedFeature(feature);
  };

  const handleLoadIntoChat = (spec: string) => {
    setSpecToLoad(spec);
    setSelectedFeature(null);
    // Navigate to home page with spec loaded (encode the full spec)
    const encodedSpec = encodeURIComponent(spec);
    window.location.href = `/?spec=${encodedSpec}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          Feature Specifications
        </h1>

        <FeatureList onFeatureSelect={handleFeatureSelect} />

        {selectedFeature && (
          <FeatureSpecViewer
            feature={selectedFeature}
            onLoadIntoChat={handleLoadIntoChat}
            onClose={() => setSelectedFeature(null)}
          />
        )}
      </div>
    </div>
  );
}

