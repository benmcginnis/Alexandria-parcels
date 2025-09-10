import React, { useEffect, useState, useCallback, useRef } from 'react';
// @ts-expect-error - Externalized Mapbox GL JS from esm.sh
import mapboxgl from 'https://esm.sh/mapbox-gl@3.14.0';
import { GeoJsonLoader } from '../utils/geoJsonLoader';
import ParcelPopup from './ParcelPopup';

// Alexandria bounding box coordinates
const ALEXANDRIA_BOUNDS: [mapboxgl.LngLatLike, mapboxgl.LngLatLike] = [
  [-77.15216206049962, 38.79238855269405], // Southwest
  [-77.03046456387351, 38.84972857510591], // Northeast
];

const MapboxMap: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataProgress, setDataProgress] = useState({
    loadedBatches: 0,
    totalBatches: 50,
    loadedFeatures: 0,
    currentBatch: 0,
    isComplete: false,
    errors: [] as string[],
  });
  const [geoJsonLoader] = useState(() => new GeoJsonLoader());
  const [selectedParcel, setSelectedParcel] = useState<{
    id: string;
    properties: Record<string, unknown>;
    lngLat: mapboxgl.LngLat;
  } | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Function to load GeoJSON data and add to map
  const loadParcelData = useCallback(
    async (mapInstance: mapboxgl.Map) => {
      setDataLoading(true);
      setDataProgress({
        loadedBatches: 0,
        totalBatches: 50,
        loadedFeatures: 0,
        currentBatch: 0,
        isComplete: false,
        errors: [],
      });

      try {
        console.log('[MapboxMap] Starting to load parcel data...');
        // Start loading data
        const loadPromise = geoJsonLoader.loadAllBatches();

        // Monitor progress
        const progressInterval = setInterval(() => {
          const progress = geoJsonLoader.getLoadingProgress();
          setDataProgress(progress);
          console.log('[MapboxMap] Loading progress:', progress);
        }, 100);

        // Wait for data to load
        console.log('[MapboxMap] Waiting for data to load...');
        const features = await loadPromise;
        clearInterval(progressInterval);
        console.log(
          '[MapboxMap] Data loading completed. Features loaded:',
          features.length
        );

        // Create GeoJSON FeatureCollection
        const geoJsonData = {
          type: 'geojson' as const,
          data: {
            type: 'FeatureCollection' as const,
            features: features as mapboxgl.GeoJSONFeature[],
          },
        };

        // Add data source to map
        if (mapInstance.getSource('parcels')) {
          mapInstance.removeSource('parcels');
        }
        mapInstance.addSource('parcels', geoJsonData);

        // Add parcel layer
        if (mapInstance.getLayer('parcels-fill')) {
          mapInstance.removeLayer('parcels-fill');
        }
        if (mapInstance.getLayer('parcels-stroke')) {
          mapInstance.removeLayer('parcels-stroke');
        }

        // Add fill layer
        mapInstance.addLayer({
          id: 'parcels-fill',
          type: 'fill',
          source: 'parcels',
          paint: {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.3,
          },
        });

        // Add stroke layer
        mapInstance.addLayer({
          id: 'parcels-stroke',
          type: 'line',
          source: 'parcels',
          paint: {
            'line-color': '#1e40af',
            'line-width': 1,
          },
        });

        // Change cursor on hover
        mapInstance.on('mouseenter', 'parcels-fill', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'parcels-fill', () => {
          mapInstance.getCanvas().style.cursor = '';
        });

        console.log(`Loaded ${features.length} parcel features`);

        // Add data attribute to map container for testing
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
          mapContainer.setAttribute('data-parcels-loaded', 'true');
          mapContainer.setAttribute(
            'data-parcel-count',
            features.length.toString()
          );
        }
      } catch (error) {
        console.error('[MapboxMap] Error loading parcel data:', error);
        console.error('[MapboxMap] Error details:', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : 'No stack trace',
          progress: geoJsonLoader.getLoadingProgress(),
        });
        setError(`Failed to load parcel data: ${error}`);
      } finally {
        console.log(
          '[MapboxMap] Data loading finished, setting loading to false'
        );
        setDataLoading(false);
      }
    },
    [geoJsonLoader]
  );

  // Initialize map - runs once on mount
  useEffect(() => {
    // Get Mapbox access token from environment variable
    const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      setError(
        'Mapbox access token not found. Please set VITE_MAPBOX_ACCESS_TOKEN in your .env file.'
      );
      setLoading(false);
      return;
    }

    // Set Mapbox access token
    mapboxgl.accessToken = accessToken;

    // Initialize map
    const newMap = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-77.09131331218656, 38.82105856390023], // Center of Alexandria
      zoom: 12,
      bounds: ALEXANDRIA_BOUNDS,
      fitBoundsOptions: {
        padding: 20,
      },
    });

    // Store map reference
    mapRef.current = newMap;

    // Expose map globally for testing
    (window as unknown as { map: mapboxgl.Map }).map = newMap;

    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Handle map errors
    newMap.on('error', (e: Error) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      newMap.remove();
    };
  }, []);

  // Add event listeners when map is ready
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    // Add click handler for parcel interaction
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['parcels-fill'],
      });

      if (features.length > 0) {
        const feature = features[0];
        const parcelId = feature.properties?.PID_RE || feature.id;

        // Set the selected parcel
        setSelectedParcel({
          id: parcelId,
          properties: feature.properties || {},
          lngLat: e.lngLat,
        });
      } else {
        // Clicked on empty area, clear selection
        setSelectedParcel(null);
      }
    };

    map.on('click', handleMapClick);

    // Cleanup event listeners
    return () => {
      map.off('click', handleMapClick);
    };
  }, [selectedParcel]);

  // Load parcel data when map loads
  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;

    const handleMapLoad = () => {
      setLoading(false);
      console.log('Map loaded successfully');

      // Start loading parcel data after map is ready
      setTimeout(() => {
        loadParcelData(map);
      }, 500);
    };

    map.on('load', handleMapLoad);

    // Cleanup
    return () => {
      map.off('load', handleMapLoad);
    };
  }, [loadParcelData]);

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'red',
          fontSize: '18px',
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {(loading || dataLoading) && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '8px',
            fontSize: '18px',
            minWidth: '300px',
            textAlign: 'center',
          }}
        >
          {loading ? (
            'Loading Alexandria Parcels Map...'
          ) : (
            <div>
              <div style={{ marginBottom: '10px' }}>Loading Parcel Data...</div>
              <div style={{ marginBottom: '10px' }}>
                Batch {dataProgress.currentBatch} of {dataProgress.totalBatches}
              </div>
              <div
                style={{
                  width: '100%',
                  height: '20px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '10px',
                }}
              >
                <div
                  style={{
                    width: `${(dataProgress.loadedBatches / dataProgress.totalBatches) * 100}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <div style={{ fontSize: '14px', opacity: 0.8 }}>
                {dataProgress.loadedFeatures.toLocaleString()} features loaded
              </div>
              {dataProgress.errors.length > 0 && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#fca5a5',
                    marginTop: '5px',
                  }}
                >
                  {dataProgress.errors.length} errors
                </div>
              )}
            </div>
          )}
        </div>
      )}
      <>
        <div id="map" style={{ width: '100%', height: '100%' }} />
        {mapRef.current && selectedParcel && (
          <ParcelPopup
            map={mapRef.current}
            lngLat={selectedParcel.lngLat}
            properties={selectedParcel.properties}
          />
        )}
      </>
    </div>
  );
};

export default MapboxMap;
