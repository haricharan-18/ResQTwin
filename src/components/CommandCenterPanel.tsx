import React from 'react';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Clock3,
  Cross,
  ShieldAlert,
  Users,
} from 'lucide-react';

interface CommandScenario {
  type: string;
  severity: number;
  blockedRoads: string[];
  blockedExits: string[];
}

interface CommandCrowd {
  totalPeople: number;
  safe: number;
  evacuating: number;
  trapped: number;
  averageCongestion: number;
}

interface CommandRisk {
  overallScore: number;
  criticalBuildings: number;
  criticalZones: number;
  criticalRoads: number;
}

interface CommandRescue {
  assignments: unknown[];
  totalSupportCapacity: number;
}

interface CommandShelter {
  peopleAllocated: number;
  unallocatedPeople: number;
  allocations: unknown[];
}

interface CommandETA {
  estimatedMinutes: number;
  confidence: string;
}

interface CommandCenterPanelProps {
  scenario: CommandScenario;
  crowdSimulation: CommandCrowd;
  riskSummary: CommandRisk;
  rescueSummary: CommandRescue;
  shelterSummary: CommandShelter;
  evacuationTimeSummary: CommandETA;
}

export default function CommandCenterPanel({
  scenario,
  crowdSimulation,
  riskSummary,
  rescueSummary,
  shelterSummary,
  evacuationTimeSummary,
}: CommandCenterPanelProps) {
  const severity = Math.max(1, Math.min(5, scenario.severity));
  const riskScore = Math.round(riskSummary.overallScore);
  const evacuationPercent =
    crowdSimulation.totalPeople > 0
      ? Math.round(
          ((crowdSimulation.safe + crowdSimulation.evacuating) /
            crowdSimulation.totalPeople) *
            100
        )
      : 0;

  const operationalStatus =
    crowdSimulation.trapped > 0
      ? 'RESCUE ACTIVE'
      : crowdSimulation.evacuating > 0
      ? 'EVACUATION ACTIVE'
      : 'STABLE';

  const statusClass =
    operationalStatus === 'RESCUE ACTIVE'
      ? 'text-red-300 bg-red-400/10 border-red-400/20'
      : operationalStatus === 'EVACUATION ACTIVE'
      ? 'text-amber-300 bg-amber-400/10 border-amber-400/20'
      : 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20';

  return (
    <section className="mb-8 rounded-2xl border border-cyan-400/15 bg-slate-950/80 p-5 shadow-2xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-bold text-white">
              Emergency Command Center
            </h2>
            <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold uppercase text-cyan-300">
              LIVE
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            One-screen operational picture for disaster, population, evacuation,
            rescue and shelter decisions.
          </p>
        </div>

        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${statusClass}`}>
          STATUS: {operationalStatus}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CommandCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Active Disaster"
          value={`${scenario.type} · ${severity}/5`}
          detail={`${scenario.blockedRoads.length} roads · ${scenario.blockedExits.length} exits blocked`}
        />
        <CommandCard
          icon={<ShieldAlert className="h-4 w-4" />}
          label="AI Risk"
          value={`${riskScore}/100`}
          detail={`${riskSummary.criticalBuildings} critical buildings · ${riskSummary.criticalZones} critical zones`}
        />
        <CommandCard
          icon={<Users className="h-4 w-4" />}
          label="Population"
          value={crowdSimulation.totalPeople.toLocaleString()}
          detail={`${(crowdSimulation.trapped ?? 0).toLocaleString()} trapped · ${(crowdSimulation.evacuating ?? 0).toLocaleString()} evacuating`}
        />
        <CommandCard
          icon={<Clock3 className="h-4 w-4" />}
          label="Evacuation ETA"
          value={`${evacuationTimeSummary.estimatedMinutes} min`}
          detail={`${evacuationTimeSummary.confidence} confidence`}
        />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-4">
        <FlowCard label="EVACUATION" value={`${evacuationPercent}%`} sub={`${(crowdSimulation.safe ?? 0).toLocaleString()} safe`} />
        <FlowCard label="RESCUE TEAMS" value={`${rescueSummary.assignments.length}`} sub={`${(rescueSummary.totalSupportCapacity ?? 0).toLocaleString()} support capacity`} />
        <FlowCard label="SHELTER" value={`${(shelterSummary.peopleAllocated ?? 0).toLocaleString()}`} sub={`${(shelterSummary.unallocatedPeople ?? 0).toLocaleString()} unallocated`} />
        <FlowCard label="CONGESTION" value={`${Math.round(crowdSimulation.averageCongestion)}%`} sub={`${riskSummary.criticalRoads} critical roads`} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <Decision
          icon={<Ambulance className="h-4 w-4" />}
          title="Priority Action"
          text={
            crowdSimulation.trapped > 0
              ? `Deploy rescue resources to ${crowdSimulation.trapped.toLocaleString()} trapped people.`
              : crowdSimulation.evacuating > 0
              ? `Maintain evacuation flow for ${crowdSimulation.evacuating.toLocaleString()} people.`
              : 'Maintain monitoring and readiness.'
          }
        />
        <Decision
          icon={<Cross className="h-4 w-4" />}
          title="Shelter Action"
          text={
            shelterSummary.unallocatedPeople > 0
              ? `Activate additional shelter capacity for ${shelterSummary.unallocatedPeople.toLocaleString()} people.`
              : 'Current shelter allocation covers the evacuated population.'
          }
        />
        <Decision
          icon={<Activity className="h-4 w-4" />}
          title="Route Action"
          text={
            scenario.blockedRoads.length > 0
              ? `Use dynamic rerouting around ${scenario.blockedRoads.length} blocked road(s).`
              : 'Primary evacuation road network is currently available.'
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
        <span>OFFLINE-FIRST</span>
        <span>•</span>
        <span>LOCAL AI</span>
        <span>•</span>
        <span>DIGITAL TWIN</span>
        <span>•</span>
        <span>DECISION SUPPORT</span>
      </div>
    </section>
  );
}

function CommandCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-xl font-bold capitalize text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function FlowCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-4">
      <div className="text-[10px] font-bold tracking-widest text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-cyan-300">{value}</div>
      <div className="text-xs text-slate-500">{sub}</div>
    </div>
  );
}

function Decision({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        {icon}
        {title}
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
    </div>
  );
}
