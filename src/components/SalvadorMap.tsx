import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SALVADOR_PREFEITURAS, findBairro, inferBairroFromText } from '../lib/salvador-bairros';

export interface ChurchMapItem {
  id: number;
  name: string;
  type?: string;
  pastor?: string;
  members?: number;
  students_count?: number;
  sector_id?: number;
  sector_name?: string;
  bairro?: string;
  address?: string;
  logo_url?: string;
}

interface SalvadorMapProps {
  churches: ChurchMapItem[];
  selectedPbId: number | null;
  onSelectPB: (pbId: number | null) => void;
  selectedSectorId: string | null;
}

export default function SalvadorMap({
  churches,
  selectedPbId,
  onSelectPB,
  selectedSectorId
}: SalvadorMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);

  // Inicializa o Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-12.935, -38.450],
      zoom: 12,
      minZoom: 10,
      zoomControl: true,
      maxBounds: [
        [-13.150, -38.700],
        [-12.650, -38.200]
      ]
    });

    // Dark Matter Map Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;
    circlesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Atualiza círculos e marcadores
  useEffect(() => {
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;
    const circlesLayer = circlesLayerRef.current;

    if (!map || !markersLayer || !circlesLayer) return;

    markersLayer.clearLayers();
    circlesLayer.clearLayers();

    // Filtra igrejas pelo setor selecionado se houver
    const filteredChurches = churches.filter(c => {
      if (!selectedSectorId) return true;
      return c.sector_id?.toString() === selectedSectorId || c.sector_name === selectedSectorId;
    });

    // 1. Desenha os Círculos das 10 Prefeituras-Bairro de Salvador
    SALVADOR_PREFEITURAS.forEach((pb) => {
      const igrejasNaPB = filteredChurches.filter((i) => {
        const bInfo = (i.bairro ? findBairro(i.bairro) : null) || inferBairroFromText(`${i.name} ${i.sector_name || ''}`);
        return bInfo && bInfo.pbId === pb.id;
      });

      const isSelected = selectedPbId === pb.id;
      const opacity = selectedPbId === null ? 0.22 : isSelected ? 0.45 : 0.05;
      const borderWeight = isSelected ? 3 : 1.2;

      const circle = L.circle([pb.lat, pb.lng], {
        color: pb.cor,
        fillColor: pb.cor,
        fillOpacity: opacity,
        weight: borderWeight,
        radius: 1200 + (igrejasNaPB.length * 180)
      });

      circle.bindTooltip(`
        <div style="font-family: system-ui, sans-serif; padding: 4px;">
          <p style="font-weight: 800; font-size: 11px; text-transform: uppercase; color: ${pb.cor}; margin: 0 0 4px 0;">${pb.nome}</p>
          <p style="font-size: 10px; color: #cbd5e1; margin: 0;">${igrejasNaPB.length} Congregação(ões) • ${igrejasNaPB.reduce((acc, curr) => acc + (curr.students_count || curr.members || 0), 0)} Alunos/Membros</p>
        </div>
      `, {
        permanent: false,
        direction: 'top',
        className: 'custom-leaflet-tooltip'
      });

      circle.on('click', () => {
        if (isSelected) {
          onSelectPB(null);
        } else {
          onSelectPB(pb.id);
          map.setView([pb.lat, pb.lng], 14, { animate: true });
        }
      });

      circle.addTo(circlesLayer);
    });

    // 2. Desenha os Marcadores dos Templos / Congregações
    filteredChurches.forEach((igreja) => {
      const bairroInfo = (igreja.bairro ? findBairro(igreja.bairro) : null) || inferBairroFromText(`${igreja.name} ${igreja.sector_name || ''}`);
      if (!bairroInfo) return; // Não geolocalizado

      // Se há filtro de PB e a igreja não pertence a ela, omite
      if (selectedPbId !== null && bairroInfo.pbId !== selectedPbId) return;

      const pbInfo = SALVADOR_PREFEITURAS.find(p => p.id === bairroInfo.pbId);
      const accentColor = pbInfo ? pbInfo.cor : '#10b981';

      // Pequeno jitter para não sobrepor congregações no mesmo bairro
      const jitterLat = (Math.random() - 0.5) * 0.003;
      const jitterLng = (Math.random() - 0.5) * 0.003;
      const lat = bairroInfo.lat + jitterLat;
      const lng = bairroInfo.lng + jitterLng;

      const totalCount = igreja.students_count || igreja.members || 0;

      const markerIcon = L.divIcon({
        html: `
          <div class="relative w-8 h-8 rounded-full border-2 bg-neutral-950 shadow-xl flex items-center justify-center transition-all hover:scale-125 cursor-pointer" 
               style="border-color: ${accentColor}; box-shadow: 0 0 12px ${accentColor}66;">
            ${
              igreja.logo_url 
                ? `<img src="${igreja.logo_url}" class="w-full h-full object-cover rounded-full" />` 
                : `<div class="font-black text-[9px] text-white uppercase tracking-tight">${igreja.name.substring(0, 2)}</div>`
            }
            <span class="absolute -bottom-1.5 -right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-neutral-900 border border-white/20 text-[8px] font-black text-white shadow">
              ${totalCount}
            </span>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const marker = L.marker([lat, lng], { icon: markerIcon });

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 220px; color: #f8fafc;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            <div style="width: 28px; height: 28px; border-radius: 8px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.4); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 10px; color: #34d399; text-transform: uppercase;">
              ${igreja.name.substring(0, 2)}
            </div>
            <div>
              <h4 style="font-weight: 800; font-size: 13px; color: #ffffff; text-transform: uppercase; margin: 0; line-height: 1.2;">${igreja.name}</h4>
              <span style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">${igreja.type || 'Congregação EBD'}</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; line-height: 1.5;">
            ${igreja.pastor ? `<p style="margin: 2px 0;"><strong>Pastor:</strong> ${igreja.pastor}</p>` : ''}
            <p style="margin: 2px 0;"><strong>Bairro:</strong> ${bairroInfo.nome} <span style="color: ${accentColor}; font-size: 10px;">(${pbInfo ? pbInfo.nome : 'Salvador'})</span></p>
            ${igreja.sector_name ? `<p style="margin: 2px 0;"><strong>Setor:</strong> ${igreja.sector_name}</p>` : ''}
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.1);">
              <span style="font-size: 10px; color: #94a3b8;">Alunos / Membros:</span>
              <span style="font-weight: 800; font-size: 12px; color: #34d399; background: rgba(16,185,129,0.15); padding: 2px 8px; border-radius: 6px;">${totalCount}</span>
            </div>
          </div>
        </div>
      `, {
        className: 'custom-leaflet-popup'
      });

      marker.addTo(markersLayer);
    });
  }, [churches, selectedPbId, selectedSectorId]);

  // Se houver alteração de PB externa, reposiciona a câmera do mapa
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedPbId === null) {
      map.setView([-12.935, -38.450], 12, { animate: true });
    } else {
      const pb = SALVADOR_PREFEITURAS.find(p => p.id === selectedPbId);
      if (pb) {
        map.setView([pb.lat, pb.lng], 14, { animate: true });
      }
    }
  }, [selectedPbId]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl bg-neutral-950">
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px]" />

      {/* Global CSS for Leaflet tooltips & popups */}
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: rgba(15, 23, 42, 0.95) !important;
          backdrop-filter: blur(16px) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 1.25rem !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7) !important;
          padding: 4px !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: rgba(15, 23, 42, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
        }
        .custom-leaflet-tooltip {
          background: rgba(10, 10, 15, 0.92) !important;
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 0.75rem !important;
          padding: 4px 8px !important;
          color: white !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
        }
        .leaflet-container {
          background: #0a0a0c !important;
          font-family: inherit !important;
        }
        .leaflet-bar {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          border-radius: 0.75rem !important;
          overflow: hidden !important;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4) !important;
        }
        .leaflet-bar a {
          background-color: rgba(23, 23, 23, 0.95) !important;
          color: #f1f5f9 !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
        }
        .leaflet-bar a:hover {
          background-color: rgba(16, 185, 129, 0.25) !important;
          color: #34d399 !important;
        }
      `}</style>
    </div>
  );
}
