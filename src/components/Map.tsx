import React, { useState } from 'react';
import {
  buildings,
  exits,
  roads,
  assemblyPoints
} from '../data/campusData';

import { generateCampusCrowd } from '../lib/crowdGenerator';

import { DisasterScenario } from '../lib/disasterEngine';
import { CrowdSimulation } from '../lib/crowdEngine';

interface DisasterMapProps {
  onDisasterSelect?: (id: string) => void;
  scenario?: DisasterScenario;
  crowdSimulation?: CrowdSimulation;
}

const roadPositions: Record<string, [number, number, number, number]> = {
  r1: [350, 270, 500, 270],
  r2: [500, 270, 540, 70],
  r3: [500, 270, 850, 300],
  r4: [350, 450, 500, 560],
  r5: [580, 500, 850, 300],
  r6: [540, 70, 850, 300],
  r7: [580, 500, 850, 540]
};

export default function DisasterMap({
  onDisasterSelect,
  scenario,
  crowdSimulation
}: DisasterMapProps) {
  const [selectedBuilding, setSelectedBuilding] =
    useState<string | null>(null);

 const crowd =
  crowdSimulation?.agents ??
  generateCampusCrowd();
 const affectedBuildings = scenario?.affectedBuildings ?? [];
const blockedRoads = scenario?.blockedRoads ?? [];
const blockedExits = scenario?.blockedExits ?? [];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-slate-950">

      {/* Header */}
      <div className="absolute top-4 left-4 z-10 rounded-lg bg-slate-900/95 border border-slate-700 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <div>
            <h2 className="text-white font-bold text-lg">
              ResQTwin Digital Twin
            </h2>
            <p className="text-slate-400 text-xs">
              Offline Campus Simulation
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="absolute top-4 right-4 z-10 grid grid-cols-2 gap-2">
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2">
          <div className="text-slate-400 text-xs">Population</div>
          <div className="text-white font-bold">{2630}</div>
        </div>

        <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2">
          <div className="text-slate-400 text-xs">Buildings</div>
          <div className="text-white font-bold">{buildings.length}</div>
        </div>

        <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2">
          <div className="text-slate-400 text-xs">Exits</div>
          <div className="text-green-400 font-bold">{exits.length}</div>
        </div>

        <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2">
          <div className="text-slate-400 text-xs">Roads</div>
          <div className="text-white font-bold">{roads.length}</div>
        </div>
      </div>

      {/* Digital Twin Canvas */}
      <svg
        viewBox="0 0 1100 680"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >

        {/* Campus background */}
        <rect
          x="0"
          y="0"
          width="1100"
          height="680"
          fill="#0f172a"
        />

        {/* Campus boundary */}
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

        {/* Campus title */}
        <text
          x="550"
          y="65"
          textAnchor="middle"
          fill="#64748b"
          fontSize="16"
          fontWeight="bold"
        >
          RESQTWIN â€” FICTIONAL UNIVERSITY CAMPUS
        </text>

        {/* Roads */}
        {Object.entries(roadPositions).map(
          ([roadId, [x1, y1, x2, y2]]) => {
            const road = roads.find(r => r.id === roadId);
            if (!road) return null;

            return (
              <g key={road.id}>
                {/* road shadow */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#020617"
                  strokeWidth="22"
                  strokeLinecap="round"
                />

                {/* road */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                 stroke={
  road.blocked || blockedRoads.includes(road.id)
    ? "#ef4444"
    : "#475569"
}
                  strokeWidth="14"
                  strokeLinecap="round"
                />

                {/* road center */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                stroke={
  road.blocked || blockedRoads.includes(road.id)
    ? "#ef4444"
    : "#94a3b8"
}
                  strokeWidth="2"
                  strokeDasharray="12 8"
                />

                {/* blocked indicator */}
              {(road.blocked || blockedRoads.includes(road.id)) && (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 10}
                    textAnchor="middle"
                    fill="#f87171"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    BLOCKED
                  </text>
                )}
              </g>
            );
          }
        )}

        {/* Junctions */}
        {[
          [350, 270],
          [500, 270],
          [540, 70],
          [850, 300],
          [350, 450],
          [580, 500],
          [850, 540]
        ].map(([x, y], index) => (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="7"
            fill="#cbd5e1"
            stroke="#0f172a"
            strokeWidth="3"
          />
        ))}

        {/* Buildings */}
        {buildings.map(building => {
          const affected = affectedBuildings.includes(building.id);
const selected = selectedBuilding === building.id;

          return (
            <g
              key={building.id}
              onClick={() => {
                setSelectedBuilding(building.id);
                onDisasterSelect?.(building.id);
              }}
              className="cursor-pointer"
            >
              <rect
                x={building.x}
                y={building.y}
                width={building.width}
                height={building.height}
                rx="10"
                fill={
  affected
    ? "#991b1b"
    : building.risk >= 50
    ? "#7f1d1d"
    : building.risk >= 35
    ? "#78350f"
    : "#1e3a5f"
}
               stroke={
  selected
    ? "#ffffff"
    : affected
    ? "#ff4444"
    : building.risk >= 50
    ? "#ef4444"
    : "#475569"
}
                strokeWidth={selected ? 4 : 2}
              />

              {/* Building roof/detail */}
              <rect
                x={building.x + 12}
                y={building.y + 12}
                width={building.width - 24}
                height="8"
                rx="4"
                fill="#64748b"
                opacity="0.6"
              />

    {/* Building name */}
<text
  x={building.x + building.width / 2}
  y={building.y + building.height / 2 - 8}
  textAnchor="middle"
  fill="white"
  fontSize="15"
  fontWeight="bold"
>
  {building.name}
</text>

{/* Affected indicator */}
{affected && (
  <text
    x={building.x + building.width / 2}
    y={building.y + 18}
    textAnchor="middle"
    fill="#fecaca"
    fontSize="10"
    fontWeight="bold"
  >
    âš  AFFECTED
  </text>
)}

              {/* Occupants */}
              <text
                x={building.x + building.width / 2}
                y={building.y + building.height / 2 + 15}
                textAnchor="middle"
                fill="#cbd5e1"
                fontSize="12"
              >
                ðŸ‘¥ {building.occupants} occupants
              </text>

              {/* Risk */}
              <text
                x={building.x + building.width / 2}
                y={building.y + building.height / 2 + 35}
                textAnchor="middle"
                fill={
                  building.risk >= 50
                    ? "#fca5a5"
                    : building.risk >= 35
                    ? "#fcd34d"
                    : "#86efac"
                }
                fontSize="11"
                fontWeight="bold"
              >
                RISK {building.risk}%
              </text>
            </g>
          );
        })}

        {/* Assembly points */}
        {assemblyPoints.map(point => (
          <g key={point.id}>
            <circle
              cx={point.x}
              cy={point.y}
              r="32"
              fill="#14532d"
              opacity="0.9"
              stroke="#4ade80"
              strokeWidth="3"
            />

            <text
              x={point.x}
              y={point.y - 5}
              textAnchor="middle"
              fill="#86efac"
              fontSize="20"
            >
              âœ“
            </text>

            <text
              x={point.x}
              y={point.y + 12}
              textAnchor="middle"
              fill="white"
              fontSize="10"
              fontWeight="bold"
            >
              ASSEMBLY
            </text>

            <text
              x={point.x}
              y={point.y + 50}
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10"
            >
              {point.name}
            </text>
          </g>
        ))}

        {/* Emergency exits */}
        {exits.map(exit => (
          <g key={exit.id}>
            <circle
              cx={exit.x}
              cy={exit.y}
              r="18"
             fill={
  exit.status === "open" && !blockedExits.includes(exit.id)
    ? "#166534"
    : "#991b1b"
}
           stroke={
  exit.status === "open" && !blockedExits.includes(exit.id)
    ? "#4ade80"
    : "#f87171"
}
              strokeWidth="3"
            />

            <text
              x={exit.x}
              y={exit.y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
            >
              â†’
            </text>

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
      fill={
  exit.status === "open" && !blockedExits.includes(exit.id)
    ? "#86efac"
    : "#fca5a5"
}
              fontSize="9"
            >
            {blockedExits.includes(exit.id)
  ? "BLOCKED"
  : exit.status.toUpperCase()}
            </text>
          </g>
        ))}

        {/* People */}
       {crowd.map(person => (
          <g key={person.id}>
            <circle
              cx={person.x}
              cy={person.y}
              r="6"
              fill={
                person.risk >= 60
                  ? "#ef4444"
                  : person.risk >= 40
                  ? "#f59e0b"
                  : "#22c55e"
              }
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {/* Legend */}
        <g transform="translate(70 590)">
          <rect
            x="0"
            y="0"
            width="360"
            height="32"
            rx="8"
            fill="#020617"
            opacity="0.9"
          />

          <circle cx="20" cy="16" r="6" fill="#22c55e" />
          <text x="32" y="20" fill="#cbd5e1" fontSize="10">
            Low Risk
          </text>

          <circle cx="105" cy="16" r="6" fill="#f59e0b" />
          <text x="117" y="20" fill="#cbd5e1" fontSize="10">
            Medium Risk
          </text>

          <circle cx="205" cy="16" r="6" fill="#ef4444" />
          <text x="217" y="20" fill="#cbd5e1" fontSize="10">
            High Risk
          </text>

          <circle cx="305" cy="16" r="6" fill="#4ade80" />
          <text x="317" y="20" fill="#cbd5e1" fontSize="10">
            Exit
          </text>
        </g>
      </svg>

      {/* Selected building panel */}
      {selectedBuilding && (
        <div className="absolute bottom-4 right-4 z-10 w-64 rounded-xl bg-slate-900/95 border border-slate-700 p-4 shadow-xl">
          {(() => {
            const building = buildings.find(
              b => b.id === selectedBuilding
            );

            if (!building) return null;

            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">
                    {building.name}
                  </h3>

                  <button
                    onClick={() => setSelectedBuilding(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Ã—
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacity</span>
                    <span className="text-white">
                      {building.capacity}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Occupants</span>
                    <span className="text-white">
                      {building.occupants}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk</span>
                    <span
                      className={
                        building.risk >= 50
                          ? "text-red-400"
                          : building.risk >= 35
                          ? "text-yellow-400"
                          : "text-green-400"
                      }
                    >
                      {building.risk}%
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
