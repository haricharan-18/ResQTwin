import React from 'react';
import {
  Clock3,
  Users,
  ShieldAlert,
  Route,
  Activity,
  Timer,
} from 'lucide-react';

import { EvacuationTimeSummary } from '../lib/evacuationTimeEngine';

interface EvacuationTimePanelProps {
  summary: EvacuationTimeSummary;
}

export default function EvacuationTimePanel({
  summary,
}: EvacuationTimePanelProps) {
  const confidenceLabel =
    summary.confidence === 'high'
      ? 'HIGH CONFIDENCE'
      : summary.confidence === 'medium'
      ? 'MEDIUM CONFIDENCE'
      : 'LOW CONFIDENCE';

  const confidenceClass =
    summary.confidence === 'high'
      ? 'text-green-300 bg-green-500/20'
      : summary.confidence === 'medium'
      ? 'text-yellow-300 bg-yellow-500/20'
      : 'text-red-300 bg-red-500/20';

  return (
    <div className="card mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Timer className="w-5 h-5 text-blue-300" />
            Evacuation Time Intelligence
          </h2>

          <p className="text-gray-300 text-sm mt-1">
            Offline estimation based on live crowd and disaster conditions
          </p>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${confidenceClass}`}
        >
          {confidenceLabel}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 rounded-xl p-5">
          <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
            <Clock3 className="w-4 h-4" />
            Estimated Evacuation
          </div>

          <div className="text-3xl font-bold text-white">
            {summary.estimatedMinutes}
            <span className="text-base text-gray-400 ml-1">
              min
            </span>
          </div>

          <div className="text-xs text-gray-400 mt-1">
            {summary.estimatedSeconds.toLocaleString()} seconds
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5">
          <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
            <Users className="w-4 h-4" />
            Remaining
          </div>

          <div className="text-3xl font-bold text-blue-300">
            {summary.remainingPeople.toLocaleString()}
          </div>

          <div className="text-xs text-gray-400 mt-1">
            currently evacuating
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5">
          <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
            <ShieldAlert className="w-4 h-4" />
            Trapped
          </div>

          <div className="text-3xl font-bold text-red-300">
            {summary.trappedPeople.toLocaleString()}
          </div>

          <div className="text-xs text-gray-400 mt-1">
            require rescue
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-5">
          <div className="flex items-center gap-2 text-gray-300 text-sm mb-2">
            <Activity className="w-4 h-4" />
            Evacuated
          </div>

          <div className="text-3xl font-bold text-green-300">
            {summary.evacuatedPeople.toLocaleString()}
          </div>

          <div className="text-xs text-gray-400 mt-1">
            reached safety
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <div className="bg-blue-500/10 border border-blue-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-blue-200 text-sm">
            <Route className="w-4 h-4" />
            Bottleneck Delay
          </div>

          <div className="text-xl font-bold text-white mt-1">
            {summary.bottleneckDelaySeconds}s
          </div>
        </div>

        <div className="bg-orange-500/10 border border-orange-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-200 text-sm">
            <ShieldAlert className="w-4 h-4" />
            Disaster Delay
          </div>

          <div className="text-xl font-bold text-white mt-1">
            {summary.disasterDelaySeconds}s
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-400/20 rounded-xl p-4">
          <div className="flex items-center gap-2 text-purple-200 text-sm">
            <Activity className="w-4 h-4" />
            Congestion Delay
          </div>

          <div className="text-xl font-bold text-white mt-1">
            {summary.congestionDelaySeconds}s
          </div>
        </div>
      </div>

      <div className="mt-5 bg-slate-900/40 rounded-xl px-4 py-3 text-sm text-gray-300">
        <span className="text-blue-300 font-semibold">
          AI assessment:
        </span>{' '}
        {summary.message}
      </div>
    </div>
  );
}