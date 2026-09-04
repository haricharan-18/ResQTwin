import React, { useMemo, useState } from 'react';
import { Navigation, ShieldCheck, AlertTriangle, Route, Users } from 'lucide-react';
import { buildings, roads } from '../data/campusData';
import { findSafestRoute } from '../lib/routeEngine';
import type { DisasterScenario } from '../lib/disasterEngine';

interface EvacuationPanelProps {
  scenario: DisasterScenario;
}

export default function EvacuationPanel({
  scenario
}: EvacuationPanelProps) {
  const [selectedBuilding, setSelectedBuilding] = useState(
    buildings[0]?.id ?? ''
  );

  const route = useMemo(() => {
    if (!selectedBuilding) {
      return null;
    }

    return findSafestRoute(
      selectedBuilding,
      scenario
    );
  }, [selectedBuilding, scenario]);

  const selectedBuildingData = buildings.find(
    (building) => building.id === selectedBuilding
  );

  return (
    <div className="glass rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Navigation className="w-6 h-6 text-blue-400" />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Safest Evacuation Route
              </h2>

              <p className="text-gray-400 text-sm">
                Safety-first routing using live disaster conditions
              </p>
            </div>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-sm">
          OFFLINE ENGINE
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-300 mb-2">
          Select Building
        </label>

        <select
          value={selectedBuilding}
          onChange={(event) =>
            setSelectedBuilding(event.target.value)
          }
          className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white"
        >
          {buildings.map((building) => (
            <option
              key={building.id}
              value={building.id}
            >
              {building.name} — {building.occupants} occupants
            </option>
          ))}
        </select>
      </div>

      {selectedBuildingData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/70 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              Occupants
            </p>

            <p className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              {selectedBuildingData.occupants}
            </p>
          </div>

          <div className="bg-slate-800/70 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              Building Risk
            </p>

            <p className="text-2xl font-bold text-yellow-400">
              {selectedBuildingData.risk}%
            </p>
          </div>

          <div className="bg-slate-800/70 rounded-lg p-4">
            <p className="text-gray-400 text-sm">
              Current Disaster
            </p>

            <p className="text-lg font-bold capitalize">
              {scenario.type}
            </p>

            <p className="text-gray-400 text-sm">
              Severity {scenario.severity}/5
            </p>
          </div>
        </div>
      )}

      {!route ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" />

            <div>
              <h3 className="font-semibold text-red-300">
                No Safe Route Available
              </h3>

              <p className="text-gray-400 text-sm">
                All available evacuation paths are blocked.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-7 h-7 text-green-400" />

              <div>
                <p className="text-gray-400 text-sm">
                  Recommended Exit
                </p>

                <h3 className="text-2xl font-bold text-green-300">
                  {route.exitName}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-400 text-xs">
                  Distance
                </p>

                <p className="font-bold">
                  {route.distance} m
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">
                  Risk
                </p>

                <p className="font-bold">
                  {route.risk}%
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">
                  Congestion
                </p>

                <p className="font-bold">
                  {route.congestion}%
                </p>
              </div>

              <div>
                <p className="text-gray-400 text-xs">
                  Safety Score
                </p>

                <p className="font-bold">
                  {route.score}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Route className="w-5 h-5 text-blue-400" />

              <h3 className="font-semibold">
                Recommended Path
              </h3>
            </div>

            <div className="space-y-2">
              {route.roads.length === 0 ? (
                <div className="text-sm text-slate-300">
                  Direct access to {route.exitName}
                </div>
              ) : (
                route.roads.map((roadId, index) => (
                  <div
                    key={`${roadId}-${index}`}
                    className="flex items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 text-sm">
                      {index + 1}
                    </div>

                    <span>
                      {roads.find((item) => item.id === roadId)?.name ?? roadId}
                    </span>
                  </div>
                ))
              )}

              <div className="flex items-center gap-3 mt-3">
                <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                  ✓
                </div>

                <span className="text-green-300 font-semibold">
                  {route.exitName}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            <strong className="text-gray-300">
              Why this route?
            </strong>{' '}
            {route.reason}. The engine considers road distance,
            disaster risk, blocked roads, blocked exits and
            congestion instead of simply choosing the shortest path.
          </div>
        </>
      )}
    </div>
  );
}