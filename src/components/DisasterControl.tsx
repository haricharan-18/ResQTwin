import React, { useState } from 'react';
import {
  simulateDisaster,
  DisasterScenario,
  DisasterType
} from '../lib/disasterEngine';

interface DisasterControlProps {
  onScenarioChange?: (scenario: DisasterScenario | null) => void;
}

const DisasterControl: React.FC<DisasterControlProps> = ({
  onScenarioChange
}) => {
  const [type, setType] = useState<DisasterType>('fire');
  const [severity, setSeverity] = useState(3);
  const [scenario, setScenario] = useState<DisasterScenario | null>(null);

  const handleSimulate = () => {
    const result = simulateDisaster(type, severity);
    setScenario(result);
    onScenarioChange?.(result);
  };

  const handleReset = () => {
    setScenario(null);
    onScenarioChange?.(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">🚨 Disaster Engine</h2>
          <p className="text-xs text-slate-400">
            Simulate an emergency on the campus
          </p>
        </div>

        {scenario && (
          <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
            SIMULATION ACTIVE
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Disaster Type */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Disaster Type
          </label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as DisasterType)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2"
          >
            <option value="fire">🔥 Fire</option>
            <option value="flood">🌊 Flood</option>
            <option value="earthquake">🌎 Earthquake</option>
            <option value="cyclone">🌀 Cyclone</option>
            <option value="landslide">⛰️ Landslide</option>
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">
            Severity: {severity}/5
          </label>

          <input
            type="range"
            min="1"
            max="5"
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-slate-500">
            <span>Low</span>
            <span>Extreme</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        <button
          onClick={handleSimulate}
          className="flex-1 bg-red-600 hover:bg-red-700 rounded-lg py-2.5 font-semibold transition"
        >
          ⚡ Simulate Disaster
        </button>

        <button
          onClick={handleReset}
          className="px-5 bg-slate-700 hover:bg-slate-600 rounded-lg py-2.5 font-semibold transition"
        >
          Reset
        </button>
      </div>

      {/* Results */}
      {scenario && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">

          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">
              Affected Buildings
            </div>
            <div className="text-2xl font-bold text-red-400">
              {scenario.affectedBuildings.length}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">
              Blocked Roads
            </div>
            <div className="text-2xl font-bold text-orange-400">
              {scenario.blockedRoads.length}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">
              Blocked Exits
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {scenario.blockedExits.length}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-3">
            <div className="text-xs text-slate-400">
              Highest Zone Risk
            </div>
            <div className="text-2xl font-bold text-red-400">
              {Math.max(...Object.values(scenario.zoneRisks))}%
            </div>
          </div>

        </div>
      )}

      {/* Zone Risk */}
      {scenario && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold mb-3">
            Zone Risk After Simulation
          </h3>

          <div className="space-y-2">
            {Object.entries(scenario.zoneRisks).map(
              ([zone, risk]) => (
                <div key={zone}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300">
                      {zone}
                    </span>
                    <span className="font-semibold">
                      {risk}%
                    </span>
                  </div>

                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${risk}%` }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DisasterControl;