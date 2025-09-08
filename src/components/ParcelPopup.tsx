import React, { useEffect, useRef } from 'react';
// @ts-expect-error - Externalized Mapbox GL JS from esm.sh
import mapboxgl from 'https://esm.sh/mapbox-gl@3.14.0';

interface ParcelPopupProps {
  map: mapboxgl.Map;
  lngLat: mapboxgl.LngLat;
  properties: Record<string, unknown>;
}

const ParcelPopup: React.FC<ParcelPopupProps> = ({
  map,
  lngLat,
  properties,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  const popupInstanceRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!popupRef.current) return;

    // Create popup instance
    const popup = new mapboxgl.Popup({
      closeButton: true,
      closeOnClick: false,
      maxWidth: '500px',
      className: 'parcel-popup',
    })
      .setLngLat(lngLat)
      .setDOMContent(popupRef.current)
      .addTo(map);

    // Store reference
    popupInstanceRef.current = popup;

    // Cleanup function
    return () => {
      if (popupInstanceRef.current) {
        popupInstanceRef.current.remove();
        popupInstanceRef.current = null;
      }
    };
  }, [map, lngLat]);

  // Get area measurements
  const areaSqUnits = (properties.SHAPE__Area as number) || 0;

  // Format coordinates
  const geometry = properties.geometry as { coordinates: number[][][] };
  const coordinates = geometry?.coordinates?.[0] || [];
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

  return (
    <div
      ref={popupRef}
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '12px',
      }}
    >
      <div
        style={{
          borderBottom: '2px solid #3b82f6',
          marginBottom: '16px',
          paddingBottom: '8px',
        }}
      >
        <h3
          style={{
            margin: '0 0 8px 0',
            color: '#1e40af',
            fontSize: '18px',
            fontWeight: '600',
          }}
        >
          🏠 Alexandria Parcel
        </h3>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>
            Parcel ID:
          </span>
          <span
            style={{
              color: '#6b7280',
              fontFamily: "'SF Mono', Monaco, monospace",
            }}
          >
            {(properties.PID_RE as string) || 'N/A'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>Address:</span>
          <span
            style={{
              color: '#6b7280',
              textAlign: 'right',
              maxWidth: '250px',
            }}
          >
            {(properties.ADDRESS_GIS as string) || 'N/A'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>Owner:</span>
          <span
            style={{
              color: '#6b7280',
              textAlign: 'right',
              maxWidth: '250px',
            }}
          >
            {(properties.OWN_NAME as string) || 'N/A'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>
            Property Name:
          </span>
          <span
            style={{
              color: '#6b7280',
              textAlign: 'right',
              maxWidth: '250px',
            }}
          >
            {(properties.PRP_NAME as string) || 'N/A'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>Zoning:</span>
          <span style={{ color: '#6b7280' }}>
            {(properties.ZONING as string) || 'N/A'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>
            Land Type:
          </span>
          <span
            style={{
              color: '#6b7280',
              textAlign: 'right',
              maxWidth: '250px',
            }}
          >
            {(properties.LANDDESC as string) || 'N/A'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontWeight: '600', color: '#374151' }}>
            Coordinates:
          </span>
          <span style={{ color: '#6b7280', fontSize: '12px' }}>
            {centerLat.toFixed(6)}, {centerLng.toFixed(6)}
          </span>
        </div>
      </div>

      <div
        style={{
          background: '#f3f4f6',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
        }}
      >
        <h4
          style={{
            margin: '0 0 8px 0',
            color: '#374151',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          📏 Area Measurements
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <div>
            <span style={{ color: '#6b7280' }}>Official Assessment:</span>
            <span
              style={{ fontWeight: '600', color: '#374151', marginLeft: '4px' }}
            >
              {(properties.LAND_SF as number)
                ? (properties.LAND_SF as number).toLocaleString()
                : 'N/A'}{' '}
              sq ft
            </span>
          </div>
          <div>
            <span style={{ color: '#6b7280' }}>Calculated Area:</span>
            <span
              style={{ fontWeight: '600', color: '#374151', marginLeft: '4px' }}
            >
              {areaSqUnits.toFixed(2)} sq units
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: '8px',
        }}
      >
        Click anywhere to close • Alexandria Parcels Dataset
      </div>
    </div>
  );
};

export default ParcelPopup;
