import React, { useMemo, useState } from 'react';
import type { DisasterScenario } from '../lib/disasterEngine';
import type { CrowdSimulation } from '../lib/crowdEngine';
import type { DigitalTwinState } from '../lib/digitalTwinState';
import { CAMPUS_VIEWBOX } from '../data/digitalTwinModel';
import DigitalTwinOverlay from './DigitalTwinOverlay';

interface DisasterMapProps {
  onDisasterSelect?: (id: string) => void;
  scenario?: DisasterScenario;
  crowdSimulation?: CrowdSimulation;
  twinState: DigitalTwinState;
  onSelectFeature?: (id: string | null) => void;
}

function crowdColor(status: string, risk: number) {
  if (status === 'trapped') return '#ef4444';
  if (status === 'safe') return '#22c55e';
  if (status === 'evacuating') return '#38bdf8';
  if (risk >= 60) return '#ef4444';
  if (risk >= 40) return '#f59e0b';
  return '#22c55e';
}

function roadStroke(visual: string) {
  switch (visual) {
    case 'blocked':
    case 'critical':
      return '#ef4444';
    case 'congested':
      return '#f59e0b';
    case 'route':
      return '#38bdf8';
    default:
      return '#64748b';
  }
}

function buildingFill(visual: string) {
  switch (visual) {
    case 'critical':
      return '#7f1d1d';
    case 'affected':
      return '#991b1b';
    case 'high-risk':
      return '#7c2d12';
    default:
      return '#1e3a5f';
  }
}

export default function DisasterMap({
  onDisasterSelect,
  twinState,
  onSelectFeature,
}: DisasterMapProps) {
  const [localSelected, setLocalSelected] = useState<string | null>(null);
  const selected = twinState.selectedFeatureId ?? localSelected;

  const crowdSample = useMemo(() => {
    const agents = twinState.people;
    if (agents.length <= 400) return agents;
    const step = Math.ceil(agents.length / 400);
    return agents.filter((_, index) => index % step === 0);
  }, [twinState.people]);

  const select = (id: string) => {
    setLocalSelected(id);
    onSelectFeature?.(id);
    onDisasterSelect?.(id);
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-slate-950">
      <DigitalTwinOverlay twinState={twinState} compact />

      <svg
        viewBox={`0 0 ${CAMPUS_VIEWBOX.width} ${CAMPUS_VIEWBOX.height}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={CAMPUS_VIEWBOX.width} height={CAMPUS_VIEWBOX.height} fill="#0f172a" />
        <rect
          x="45"
          y="45"
          width="1010"
          height="590"
          rx="24"
          fill="none"
          stroke="#334155"
          strokeWidth="3"
          strokeDasharray="10 8"
        />

        {twinState.zones.map((zone) => (
          <rect
            key={zone.id}
            x={zone.bounds.minX}
            y={zone.bounds.minY}
            width={zone.bounds.maxX - zone.bounds.minX}
            height={zone.bounds.maxY - zone.bounds.minY}
            fill={
              zone.riskLevel === 'critical'
                ? '#ef4444'
                : zone.riskLevel === 'high'
                  ? '#f97316'
                  : zone.riskLevel === 'medium'
                    ? '#eab308'
                    : '#22c55e'
            }
            opacity="0.08"
          />
        ))}

        {twinState.roads.map((road) => {
          const from = road.polyline[0];
          const to = road.polyline[1];
          if (!from || !to) return null;
          const selectedRoad = selected === road.id;
          return (
            <g
              key={road.id}
              className="cursor-pointer"
              onClick={() => select(road.id)}
            >
              <line
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={selectedRoad ? '#e0f2fe' : roadStroke(road.visual)}
                strokeWidth={road.blocked ? 18 : road.onEvacuationRoute ? 16 : 14}
                strokeLinecap="round"
              />
              {(road.blocked || road.visual === 'critical') && (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 10}
                  textAnchor="middle"
                  fill="#f87171"
                  fontSize="13"
                  fontWeight="bold"
                >
                  {road.id} BLOCKED
                </text>
              )}
            </g>
          );
        })}

        {twinState.junctions.map((junction) => (
          <circle
            key={junction.id}
            cx={junction.x}
            cy={junction.y}
            r="7"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="3"
          />
        ))}

        {twinState.buildings.map((building) => {
          const isSelected = selected === building.id;
          return (
            <g
              key={building.id}
              className="cursor-pointer"
              onClick={() => select(building.id)}
            >
              <rect
                x={building.x}
                y={building.y}
                width={building.width}
                height={building.height}
                rx="10"
                fill={buildingFill(building.visual)}
                stroke={isSelected ? '#ffffff' : building.affected ? '#ff4444' : '#475569'}
                strokeWidth={isSelected ? 4 : 2}
              />
              {building.affected && (
                <text
                  x={building.center.x}
                  y={building.y + 18}
                  textAnchor="middle"
                  fill="#fecaca"
                  fontSize="10"
                  fontWeight="bold"
                >
                  AFFECTED
                </text>
              )}
              <text
                x={building.center.x}
                y={building.center.y - 8}
                textAnchor="middle"
                fill="white"
                fontSize="15"
                fontWeight="bold"
              >
                {building.name}
              </text>
              <text
                x={building.center.x}
                y={building.center.y + 14}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="12"
              >
                {building.occupants} occupants
              </text>
              <text
                x={building.center.x}
                y={building.center.y + 32}
                textAnchor="middle"
                fill={
                  building.riskLevel === 'critical' || building.riskLevel === 'high'
                    ? '#fca5a5'
                    : building.riskLevel === 'medium'
                      ? '#fcd34d'
                      : '#86efac'
                }
                fontSize="11"
                fontWeight="bold"
              >
                {building.id} RISK {building.riskScore}
              </text>
            </g>
          );
        })}

        {twinState.assemblyPoints.map((point) => (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.radius}
              fill="#14532d"
              opacity="0.9"
              stroke="#4ade80"
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={point.y - 4}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              ASSEMBLY
            </text>
            <text
              x={point.x}
              y={point.y + 12}
              textAnchor="middle"
              fill="#bbf7d0"
              fontSize="10"
            >
              {point.currentPopulation}/{point.capacity}
            </text>
          </g>
        ))}

        {twinState.exits.map((exit) => (
          <g key={exit.id} className="cursor-pointer" onClick={() => select(exit.id)}>
            <circle
              cx={exit.x}
              cy={exit.y}
              r="18"
              fill={exit.blocked ? '#991b1b' : '#166534'}
              stroke={exit.blocked ? '#f87171' : '#4ade80'}
              strokeWidth={selected === exit.id ? 4 : 3}
            />
            <text
              x={exit.x}
              y={exit.y - 26}
              textAnchor="middle"
              fill="#e2e8f0"
              fontSize="11"
              fontWeight="bold"
            >
              {exit.name}
            </text>
            <text
              x={exit.x}
              y={exit.y + 34}
              textAnchor="middle"
              fill={exit.blocked ? '#fca5a5' : '#86efac'}
              fontSize="9"
            >
              {exit.blocked ? 'BLOCKED' : 'OPEN'}
            </text>
          </g>
        ))}

        {crowdSample.map((person) => (
          <circle
            key={person.id}
            cx={person.x}
            cy={person.y}
            r="4"
            fill={crowdColor(person.status, person.risk)}
            stroke="#ffffff"
            strokeWidth="0.8"
          />
        ))}
      </svg>

      {selected && (
        <div className="absolute bottom-4 right-4 z-20 w-64 rounded-xl border border-slate-700 bg-slate-900/95 p-4 shadow-xl">
          {(() => {
            const building = twinState.buildings.find((item) => item.id === selected);
            const road = twinState.roads.find((item) => item.id === selected);
            const exit = twinState.exits.find((item) => item.id === selected);
            const feature = building ?? road ?? exit;
            if (!feature) return null;
            return (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-white">
                    {'name' in feature ? feature.name : feature.id} ({feature.id})
                  </h3>
                  <button
                    onClick={() => {
                      setLocalSelected(null);
                      onSelectFeature?.(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-1 text-xs text-slate-300">
                  {building && (
                    <>
                      <div>Occupants {building.occupants}/{building.capacity}</div>
                      <div>Risk {building.riskScore}/100</div>
                      <div>{building.affected ? 'Affected' : 'Operational'}</div>
                    </>
                  )}
                  {road && (
                    <>
                      <div>Capacity {road.capacity}</div>
                      <div>Congestion {Math.round(road.congestion)}%</div>
                      <div>{road.blocked ? 'Blocked' : 'Open'}</div>
                    </>
                  )}
                  {exit && (
                    <>
                      <div>Capacity {exit.capacity}</div>
                      <div>{exit.blocked ? 'Blocked' : 'Open'}</div>
                    </>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
