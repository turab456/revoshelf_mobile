import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS, RADIUS } from '../../constants/theme';

interface LocationPickerMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  draggable?: boolean;
  onLocationSelect?: (lat: number, lng: number) => void;
  height?: number;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  center,
  zoom = 15,
  draggable = true,
  onLocationSelect,
  height = 200,
}) => {
  const webViewRef = useRef<WebView>(null);

  const validLat = typeof center.lat === 'number' && !isNaN(center.lat) ? center.lat : 20.5937;
  const validLng = typeof center.lng === 'number' && !isNaN(center.lng) ? center.lng : 78.9629;

  // HTML content rendering OpenStreetMap via Leaflet
  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            background-color: #f8fafc;
          }
          .custom-pin {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .pin-badge {
            position: absolute;
            bottom: -18px;
            left: 50%;
            transform: translateX(-50%);
            background: #038F78;
            color: #ffffff;
            font-size: 10px;
            font-weight: 700;
            font-family: -apple-system, sans-serif;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.25);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const lat = ${validLat};
          const lng = ${validLng};
          const isDraggable = ${draggable ? 'true' : 'false'};

          const map = L.map('map', {
            center: [lat, lng],
            zoom: ${zoom},
            zoomControl: false,
            attributionControl: false
          });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          const svgPinHtml = \`
            <div class="custom-pin">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#038F78" stroke="#FFFFFF" stroke-width="1.5" style="width: 32px; height: 32px; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
                <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3" fill="#FFFFFF"/>
              </svg>
              \${isDraggable ? '<div class="pin-badge">Drag Pin</div>' : ''}
            </div>
          \`;

          const pinIcon = L.divIcon({
            html: svgPinHtml,
            className: '',
            iconSize: [32, 32],
            iconAnchor: [16, 32]
          });

          const marker = L.marker([lat, lng], {
            draggable: isDraggable,
            icon: pinIcon
          }).addTo(map);

          function postCoords(newLat, newLng) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locationSelect',
                lat: newLat,
                lng: newLng
              }));
            }
          }

          if (isDraggable) {
            marker.on('dragend', function() {
              const pos = marker.getLatLng();
              postCoords(pos.lat, pos.lng);
            });
          }

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            postCoords(e.latlng.lat, e.latlng.lng);
          });

          window.updateCenter = function(nLat, nLng) {
            map.setView([nLat, nLng], ${zoom});
            marker.setLatLng([nLat, nLng]);
          };
        </script>
      </body>
    </html>
  `;

  // Update map when center changes
  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.updateCenter) {
          window.updateCenter(${validLat}, ${validLng});
        }
        true;
      `);
    }
  }, [validLat, validLng]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelect' && onLocationSelect) {
        onLocationSelect(data.lat, data.lng);
      }
    } catch (err) {
      console.error('[Map Message Error]', err);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: leafletHtml }}
        style={styles.webView}
        onMessage={handleMessage}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: '#F8FAFC',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
});
