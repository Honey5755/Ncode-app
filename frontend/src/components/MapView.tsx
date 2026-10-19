import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import './MapView.css';

export interface MapMarker { id: string | number; lat: number; lng: number; label: string; color?: string; onClick?: () => void }

/**
 * Map provider abstraction: pages only use <MapView markers path />.
 * Leaflet + OpenStreetMap tiles (no API key), with a glassmorphism floating status
 * panel and custom avatar markers layered on top. To move to Mapbox / Google Maps
 * (or MapLibre GL), replace this file only — the <MapView> props stay the same.
 * Note: OSM's public tile server is for light/dev use; use a hosted tile provider in production.
 */
function initials(label: string): string {
  const name = label.split('(')[0].split(':').pop()?.trim() || label;
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function avatarIcon(label: string, color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div class="mapview-avatar-marker" style="background:${color}">${initials(label)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function MapView({ markers, path, height = 420 }: { markers: MapMarker[]; path?: [number, number][]; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitKey = useRef('');
  const [tilesOk, setTilesOk] = useState(true);

  useEffect(() => {
    const m = L.map(el.current!, { attributionControl: false }).setView([20.59, 78.96], 5);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19,
    }).addTo(m);
    tiles.on('tileerror', () => setTilesOk(false));
    tiles.on('tileload', () => setTilesOk(true));
    L.control.attribution({ prefix: false }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const g = layer.current, m = map.current;
    if (!g || !m) return;
    g.clearLayers();
    const pts: L.LatLngTuple[] = [];
    if (path && path.length > 1) {
      L.polyline(path, { color: '#2563eb', weight: 3 }).addTo(g);
      path.forEach((p) => pts.push(p));
    }
    markers.forEach((mk) => {
      const c = mk.color ?? '#16a34a';
      const marker = L.marker([mk.lat, mk.lng], { icon: avatarIcon(mk.label, c) }).addTo(g);
      const tip = document.createElement('div');
      tip.textContent = mk.label; // textContent: labels contain user-controlled names
      marker.bindPopup(tip);
      if (mk.onClick) marker.on('click', mk.onClick);
      pts.push([mk.lat, mk.lng]);
    });
    const key = `${markers.length}:${path?.length ?? 0}`;
    if (pts.length && key !== fitKey.current) {
      fitKey.current = key;
      m.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 16 });
    }
  }, [markers, path]);

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={el} style={{ height: '100%' }} className="w-full h-full rounded-xl border border-slate-200 z-0" />
      <div className="mapview-glass-panel">
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${tilesOk ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${tilesOk ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </span>
        <span>{markers.length} {markers.length === 1 ? 'location' : 'locations'}</span>
      </div>
    </div>
  );
}
