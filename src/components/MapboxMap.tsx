import React, { useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { GeoJsonLoader } from '../utils/geoJsonLoader';

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
  const [currentPopup, setCurrentPopup] = useState<mapboxgl.Popup | null>(null);

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
        // Start loading data
        const loadPromise = geoJsonLoader.loadAllBatches();

        // Monitor progress
        const progressInterval = setInterval(() => {
          const progress = geoJsonLoader.getLoadingProgress();
          setDataProgress(progress);
        }, 100);

        // Wait for data to load
        const features = await loadPromise;
        clearInterval(progressInterval);

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

        // Add click handler for parcel interaction
        mapInstance.on('click', 'parcels-fill', (e) => {
          if (e.features && e.features.length > 0) {
            const feature = e.features[0];
            const properties = feature.properties || {};

            // Get area measurements
            const areaSqUnits = properties.SHAPE__Area || 0;

            // Format coordinates
            const geometry = feature.geometry as { coordinates: number[][][] };
            const coordinates = geometry.coordinates?.[0] || [];
            const centerLng =
              coordinates.length > 0
                ? coordinates.reduce(
                    (sum: number, coord: number[]) => sum + coord[0],
                    0
                  ) / coordinates.length
                : 0;
            const centerLat =
              coordinates.length > 0
                ? coordinates.reduce(
                    (sum: number, coord: number[]) => sum + coord[1],
                    0
                  ) / coordinates.length
                : 0;

            // Close any existing popup
            if (currentPopup) {
              currentPopup.remove();
              setCurrentPopup(null);
            }

            // Create new popup
            const newPopup = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: false,
              maxWidth: '500px',
              className: 'parcel-popup',
            })
              .setLngLat(e.lngLat)
              .setHTML(
                `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 12px;">
                <div style="border-bottom: 2px solid #3b82f6; margin-bottom: 16px; padding-bottom: 8px;">
                  <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 18px; font-weight: 600;">
                    🏠 Alexandria Parcel
                  </h3>
                </div>
                
                <div style="margin-bottom: 16px;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Parcel ID:</span>
                    <span style="color: #6b7280; font-family: 'SF Mono', Monaco, monospace;">${properties.PID_RE || 'N/A'}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Address:</span>
                    <span style="color: #6b7280; text-align: right; max-width: 250px;">${properties.ADDRESS_GIS || 'N/A'}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Owner:</span>
                    <span style="color: #6b7280; text-align: right; max-width: 250px;">${properties.OWN_NAME || 'N/A'}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Property Name:</span>
                    <span style="color: #6b7280; text-align: right; max-width: 250px;">${properties.PRP_NAME || 'N/A'}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Zoning:</span>
                    <span style="color: #6b7280;">${properties.ZONING || 'N/A'}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Land Type:</span>
                    <span style="color: #6b7280; text-align: right; max-width: 250px;">${properties.LANDDESC || 'N/A'}</span>
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: #374151;">Coordinates:</span>
                    <span style="color: #6b7280; font-size: 12px;">
                      ${centerLat.toFixed(6)}, ${centerLng.toFixed(6)}
                    </span>
                  </div>
                </div>
                
                <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
                  <h4 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600;">
                    📏 Area Measurements
                  </h4>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
                    <div>
                      <span style="color: #6b7280;">Official Assessment:</span>
                      <span style="font-weight: 600; color: #374151; margin-left: 4px;">
                        ${properties.LAND_SF ? properties.LAND_SF.toLocaleString() : 'N/A'} sq ft
                      </span>
                    </div>
                    <div>
                      <span style="color: #6b7280;">Calculated Area:</span>
                      <span style="font-weight: 600; color: #374151; margin-left: 4px;">
                        ${areaSqUnits.toFixed(2)} sq units
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style="font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                  Click anywhere to close • Alexandria Parcels Dataset
                </div>
              </div>
            `
              );

            // Add popup to map and store reference
            newPopup.addTo(mapInstance);
            setCurrentPopup(newPopup);

            // Handle popup close event
            newPopup.on('close', () => {
              setCurrentPopup(null);
            });
          }
        });

        // Change cursor on hover
        mapInstance.on('mouseenter', 'parcels-fill', () => {
          mapInstance.getCanvas().style.cursor = 'pointer';
        });

        mapInstance.on('mouseleave', 'parcels-fill', () => {
          mapInstance.getCanvas().style.cursor = '';
        });

        console.log(`Loaded ${features.length} parcel features`);
      } catch (error) {
        console.error('Error loading parcel data:', error);
        setError(`Failed to load parcel data: ${error}`);
      } finally {
        setDataLoading(false);
      }
    },
    [geoJsonLoader, currentPopup]
  );

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

    // Add navigation controls
    newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add fullscreen control
    newMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Wait for map to load
    newMap.on('load', () => {
      setLoading(false);
      console.log('Map loaded successfully');

      // Start loading parcel data after map is ready
      setTimeout(() => {
        loadParcelData(newMap);
      }, 500);
    });

    // Handle map errors
    newMap.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setLoading(false);
    });

    // Cleanup on unmount
    return () => {
      newMap.remove();
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
      <div id="map" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapboxMap;
