import React, { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Alexandria bounding box coordinates
const ALEXANDRIA_BOUNDS: [mapboxgl.LngLatLike, mapboxgl.LngLatLike] = [
  [-77.15216206049962, 38.79238855269405], // Southwest
  [-77.03046456387351, 38.84972857510591], // Northeast
];

const MapboxMap: React.FC = () => {
  const [, setMap] = useState<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    });

    // Handle map errors
    newMap.on('error', (e) => {
      console.error('Map error:', e);
      setError('Failed to load map');
      setLoading(false);
    });

    setMap(newMap);

    // Cleanup on unmount
    return () => {
      newMap.remove();
    };
  }, []);

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
      {loading && (
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
          }}
        >
          Loading Alexandria Parcels Map...
        </div>
      )}
      <div id="map" style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default MapboxMap;
