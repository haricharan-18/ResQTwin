import React from 'react';
import {
  Ambulance,
  Clock,
  MapPin,
  ShieldAlert,
  Users,
  Route,
  Activity,
  Siren,
} from 'lucide-react';
import { RescueSummary, RescueAssignment } from '../lib/rescueEngine';

type RescuePanelProps = {
  rescueSummary: RescueSummary;
};

const resourceIcon = (type: RescueAssignment['resourceType']) => {
  if (type === 'ambulance') return Ambulance;
  if (type === 'medical-team') return Activity;
  if (type === 'supply-unit') return ShieldAlert;
  return Siren;
};

const resourceLabel = (type: RescueAssignment['resourceType']) => {
  if (type === 'ambulance') return 'AMBULANCE';
  if (type === 'medical-team') return 'MEDICAL TEAM';
  if (type === 'supply-unit') return 'SUPPLY UNIT';
  return 'RESCUE TEAM';
};

const priorityClass = (priority: number) => {
  if (priority >= 80) return 'bg-red-500/20 text-red-300 border-red-500/30';
  if (priority >= 60) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  if (priority >= 35) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  return 'bg-green-500/20 text-green-300 border-green-500/30';
};

const AssignmentCard = ({
  assignment,
}: {
  assignment: RescueAssignment;
}) => {
  const Icon = resourceIcon(assignment.resourceType);

  return (
    <div className="glass rounded-xl p-5 border border-slate-700/60 hover:border-red-400/30 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-3 rounded-lg bg-red-500/15">
            <Icon className="w-5 h-5 text-red-300" />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              {resourceLabel(assignment.resourceType)}
            </p>
            <h3 className="text-base font-semibold text-white truncate">
              {assignment.resourceName}
            </h3>
          </div>
        </div>

        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border ${priorityClass(
            assignment.priority
          )}`}
        >
          P{assignment.priority}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-900/60 p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MapPin className="w-3.5 h-3.5" />
            Target
          </div>
          <p className="mt-1 text-sm font-medium text-white truncate">
            {assignment.targetName}
          </p>
        </div>

        <div className="rounded-lg bg-slate-900/60 p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Users className="w-3.5 h-3.5" />
            Trapped
          </div>
          <p className="mt-1 text-sm font-medium text-white">
            {assignment.trappedPeople.toLocaleString()}
          </p>
        </div>

        <div className="rounded-lg bg-slate-900/60 p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ShieldAlert className="w-3.5 h-3.5" />
            Risk
          </div>
          <p className="mt-1 text-sm font-medium text-white">
            {assignment.riskScore}/100
          </p>
        </div>

        <div className="rounded-lg bg-slate-900/60 p-3">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Clock className="w-3.5 h-3.5" />
            ETA
          </div>
          <p className="mt-1 text-sm font-medium text-white">
            ~{assignment.estimatedResponseMinutes} min
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-blue-500/10 border border-blue-500/15 p-3">
        <p className="text-xs text-slate-300">
          <span className="text-blue-300 font-semibold">WHY: </span>
          {assignment.reason}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
        <Route className="w-3.5 h-3.5" />
        Recommended deployment · Offline decision engine
      </div>
    </div>
  );
};

export default function RescuePanel({
  rescueSummary,
}: RescuePanelProps) {
  return (
    <div className="glass rounded-xl p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Siren className="w-5 h-5 text-red-300" />
            <h2 className="text-xl font-semibold text-white">
              Rescue & Resource Intelligence
            </h2>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            Offline AI prioritization of rescue resources using live risk and crowd conditions.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 border border-red-500/20">
          OFFLINE AI
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">TRAPPED PEOPLE</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {rescueSummary.totalTrapped.toLocaleString()}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">CRITICAL TARGETS</p>
          <p className="mt-1 text-2xl font-bold text-red-300">
            {rescueSummary.criticalTargets}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">RESOURCES ASSIGNED</p>
          <p className="mt-1 text-2xl font-bold text-blue-300">
            {rescueSummary.assignments.length}
          </p>
        </div>

        <div className="rounded-xl bg-slate-900/60 p-4">
          <p className="text-xs text-slate-400">PEOPLE SUPPORTED</p>
          <p className="mt-1 text-2xl font-bold text-green-300">
            {rescueSummary.estimatedPeopleSupported.toLocaleString()}
          </p>
        </div>
      </div>

      {rescueSummary.recommendations.length > 0 && (
        <div className="mb-6 rounded-xl bg-red-500/5 border border-red-500/15 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-orange-300" />
            <h3 className="text-sm font-semibold text-orange-200">
              AI Rescue Recommendations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {rescueSummary.recommendations.map((recommendation, index) => (
              <div
                key={`${recommendation}-${index}`}
                className="rounded-lg bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
              >
                <span className="text-orange-300 font-semibold mr-2">
                  {index + 1}.
                </span>
                {recommendation}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-white">
            Recommended Deployments
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Activity className="w-3.5 h-3.5" />
            Live simulation
          </div>
        </div>

        {rescueSummary.assignments.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rescueSummary.assignments.map((assignment) => (
              <AssignmentCard
                key={`${assignment.resourceId}-${assignment.targetId}`}
                assignment={assignment}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/60 p-8 text-center">
            <Siren className="w-8 h-8 mx-auto text-green-300 mb-3" />
            <p className="text-white font-semibold">
              No immediate rescue deployment required
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Continue monitoring the live disaster and crowd conditions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
