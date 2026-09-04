import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock3,
  GitCompare,
  ShieldAlert,
  Users,
} from 'lucide-react';

import {
  calculateWhatIfComparison,
  WhatIfComparison,
} from '../lib/whatIfEngine';
import { DisasterType } from '../lib/disasterEngine';

interface WhatIfPanelProps {
  selectedDisaster?: DisasterType;
  severity?: number;
}

const disasterOptions: {
  value: DisasterType;
  label: string;
}[] = [
  { value: 'fire', label: 'Fire' },
  { value: 'flood', label: 'Flood' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'landslide', label: 'Landslide' },
];

function formatDisasterName(type: DisasterType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function WhatIfPanel({
  selectedDisaster = 'fire',
  severity = 3,
}: WhatIfPanelProps) {
  const [disasterType, setDisasterType] =
    useState<DisasterType>(selectedDisaster);

  const [baselineSeverity, setBaselineSeverity] =
    useState(Math.max(1, Math.min(5, severity)));

  const comparison: WhatIfComparison = useMemo(
    () =>
      calculateWhatIfComparison(
        disasterType,
        baselineSeverity
      ),
    [disasterType, baselineSeverity]
  );

  const baseline = comparison.baseline;
  const worst = comparison.worstCase;
  const best = comparison.bestCase;

  const maxTrapped = Math.max(
    1,
    ...comparison.scenarios.map(
      (item) => item.crowd.trapped
    )
  );

  return (
    <div className="card mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-300" />
            What-If Disaster Simulator
          </h2>

          <p className="text-gray-300 text-sm mt-1">
            Compare offline disaster severity scenarios before making an evacuation decision
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={disasterType}
            onChange={(event) =>
              setDisasterType(
                event.target.value as DisasterType
              )
            }
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            {disasterOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={baselineSeverity}
            onChange={(event) =>
              setBaselineSeverity(
                Number(event.target.value)
              )
            }
            className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
          >
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                Baseline Severity {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-5">
          <div className="text-sm text-blue-200 mb-2">
            Current Baseline
          </div>

          <div className="text-2xl font-bold text-white">
            Severity {baseline.severity}
          </div>

          <div className="text-sm text-gray-300 mt-2">
            {baseline.evacuationTime.estimatedMinutes} min estimated evacuation
          </div>

          <div className="text-sm text-red-300 mt-1">
            {baseline.crowd.trapped.toLocaleString()} trapped
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-400/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-green-200 text-sm mb-2">
            <ArrowDown className="w-4 h-4" />
            Best Case
          </div>

          <div className="text-2xl font-bold text-white">
            Severity {best.severity}
          </div>

          <div className="text-sm text-gray-300 mt-2">
            {best.evacuationTime.estimatedMinutes} min evacuation
          </div>

          <div className="text-sm text-green-300 mt-1">
            {best.crowd.trapped.toLocaleString()} trapped
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-400/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-red-200 text-sm mb-2">
            <ArrowUp className="w-4 h-4" />
            Worst Case
          </div>

          <div className="text-2xl font-bold text-white">
            Severity {worst.severity}
          </div>

          <div className="text-sm text-gray-300 mt-2">
            {worst.evacuationTime.estimatedMinutes} min evacuation
          </div>

          <div className="text-sm text-red-300 mt-1">
            {worst.crowd.trapped.toLocaleString()} trapped
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-white font-semibold mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-300" />
          Severity Impact Analysis
        </div>

        <div className="space-y-3">
          {comparison.scenarios.map((item) => {
            const isBaseline =
              item.severity === baseline.severity;

            const trappedRatio =
              item.crowd.trapped / maxTrapped;

            return (
              <div
                key={item.severity}
                className={`rounded-xl border p-4 ${
                  isBaseline
                    ? 'border-blue-400/40 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-900/40'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="w-28">
                    <div className="text-white font-semibold">
                      Severity {item.severity}
                    </div>

                    {isBaseline && (
                      <div className="text-xs text-blue-300 mt-1">
                        CURRENT
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 rounded-full"
                        style={{
                          width: `${Math.max(
                            2,
                            trappedRatio * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm min-w-[360px]">
                    <div>
                      <div className="text-gray-400">
                        Trapped
                      </div>
                      <div className="text-red-300 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {item.crowd.trapped.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        ETA
                      </div>
                      <div className="text-blue-300 font-semibold flex items-center gap-1">
                        <Clock3 className="w-3 h-3" />
                        {item.evacuationTime.estimatedMinutes} min
                      </div>
                    </div>

                    <div>
                      <div className="text-gray-400">
                        Blocked
                      </div>
                      <div className="text-orange-300 font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        {item.scenario.blockedRoads.length +
                          item.scenario.blockedExits.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 bg-slate-900/50 rounded-xl p-4">
        <div className="text-sm text-purple-300 font-semibold">
          Offline AI assessment
        </div>

        <div className="text-sm text-gray-300 mt-1">
          Increasing {formatDisasterName(disasterType).toLowerCase()} severity from{' '}
          <span className="text-white font-semibold">
            {baseline.severity}
          </span>{' '}
          to{' '}
          <span className="text-red-300 font-semibold">
            {worst.severity}
          </span>{' '}
          changes the simulated evacuation outcome from{' '}
          <span className="text-blue-300">
            {baseline.evacuationTime.estimatedMinutes} min
          </span>{' '}
          to{' '}
          <span className="text-red-300">
            {worst.evacuationTime.estimatedMinutes} min
          </span>.
        </div>
      </div>
    </div>
  );
}
