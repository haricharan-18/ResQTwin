import React from 'react';
import {
  Building2,
  Cross,
  Users,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Route,
} from 'lucide-react';

import {
  ShelterSummary,
  ShelterAllocation,
} from '../lib/shelterEngine';

type ShelterPanelProps = {
  shelterSummary: ShelterSummary;
};

const typeIcon = (
  type: ShelterAllocation['targetType']
) => type === 'hospital' ? Cross : Building2;

const typeLabel = (
  type: ShelterAllocation['targetType']
) =>
  type === 'hospital'
    ? 'HOSPITAL'
    : 'EMERGENCY SHELTER';

const riskClass = (risk: number) => {
  if (risk >= 75) return 'text-red-300';
  if (risk >= 50) return 'text-orange-300';
  return 'text-green-300';
};

const AllocationCard = ({
  allocation,
}: {
  allocation: ShelterAllocation;
}) => {
  const Icon = typeIcon(allocation.targetType);

  return (
    <div className="glass rounded-xl p-5 border border-slate-700/60 hover:border-emerald-400/30 transition-all">
      <div className="flex items-start justify-between gap-4">

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/20">
            <Icon className="w-6 h-6 text-emerald-300" />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {allocation.targetName}
            </h3>

            <span className="text-xs text-slate-400">
              {typeLabel(allocation.targetType)}
            </span>
          </div>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            allocation.priority >= 75
              ? 'bg-red-500/20 text-red-300'
              : allocation.priority >= 50
              ? 'bg-orange-500/20 text-orange-300'
              : 'bg-green-500/20 text-green-300'
          }`}
        >
          PRIORITY {allocation.priority}
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">

        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Users className="w-4 h-4" />
            People
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {allocation.people.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4" />
            Capacity
          </div>
          <p className="text-lg font-bold text-white mt-1">
            {allocation.capacityAvailable.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <AlertTriangle className="w-4 h-4" />
            Risk
          </div>
          <p
            className={`text-lg font-bold mt-1 ${riskClass(
              allocation.riskScore
            )}`}
          >
            {allocation.riskScore}/100
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Route className="w-4 h-4" />
            Route
          </div>
          <p className="text-lg font-bold text-white mt-1">
            +{allocation.routePenalty}
          </p>
        </div>

      </div>

      <div className="flex items-start gap-2 mt-4">
        <MapPin className="w-4 h-4 text-emerald-300 mt-0.5 shrink-0" />
        <p className="text-sm text-slate-300">
          {allocation.reason}
        </p>
      </div>

    </div>
  );
};

export default function ShelterPanel({
  shelterSummary,
}: ShelterPanelProps) {

  return (
    <div className="glass rounded-xl p-6">

      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-2xl font-semibold text-white">
            Shelter & Medical Intelligence
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Offline AI allocation of evacuated people to
            emergency shelters and medical facilities
          </p>
        </div>

        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
          OFFLINE AI
        </span>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400">
            People to Place
          </p>
          <p className="text-2xl font-bold text-white mt-1">
            {shelterSummary.totalPeopleToPlace.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400">
            Allocated
          </p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">
            {shelterSummary.peopleAllocated.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400">
            Unallocated
          </p>
          <p className="text-2xl font-bold text-orange-300 mt-1">
            {shelterSummary.unallocatedPeople.toLocaleString()}
          </p>
        </div>

        <div className="bg-slate-900/50 rounded-lg p-4">
          <p className="text-xs text-slate-400">
            Facilities Used
          </p>
          <p className="text-2xl font-bold text-blue-300 mt-1">
            {shelterSummary.allocations.length}
          </p>
        </div>

      </div>

      {shelterSummary.allocations.length > 0 ? (

        <div className="space-y-4">

          {shelterSummary.allocations.map(
            (allocation) => (
              <AllocationCard
                key={allocation.targetId}
                allocation={allocation}
              />
            )
          )}

        </div>

      ) : (

        <div className="rounded-lg bg-slate-900/50 border border-slate-700 p-6 text-center">
          <Building2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />

          <p className="text-slate-300">
            No shelter allocation is currently required.
          </p>
        </div>

      )}

      {shelterSummary.recommendations.length > 0 && (

        <div className="mt-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-5">

          <h3 className="font-semibold text-emerald-300 mb-3">
            AI Recommendations
          </h3>

          <div className="space-y-2">

            {shelterSummary.recommendations.map(
              (recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-300"
                >
                  <span className="text-emerald-300">
                    •
                  </span>

                  <span>
                    {recommendation}
                  </span>
                </div>
              )
            )}

          </div>

        </div>

      )}

    </div>
  );
}