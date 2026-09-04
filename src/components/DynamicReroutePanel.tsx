import React, { useMemo, useState } from 'react';
import { GitBranch, RefreshCw, Route, ShieldCheck, Users, Zap } from 'lucide-react';
import {
  CrowdSimulation,
  rerouteCrowd,
} from '../lib/crowdEngine';
import { DisasterScenario } from '../lib/disasterEngine';

interface DynamicReroutePanelProps {
  scenario: DisasterScenario;
  crowdSimulation: CrowdSimulation;
  onReroute: (simulation: CrowdSimulation) => void;
}

export default function DynamicReroutePanel({
  scenario,
  crowdSimulation,
  onReroute,
}: DynamicReroutePanelProps) {
  const [lastRerouted, setLastRerouted] = useState(0);

  const preview = useMemo(
    () => rerouteCrowd(crowdSimulation, scenario),
    [crowdSimulation, scenario]
  );

  const routeChanges = useMemo(() => {
    let changed = 0;

    crowdSimulation.agents.forEach((agent, index) => {
      const next = preview.agents[index];
      if (!next) return;

      if (
        agent.targetExitId !== next.targetExitId ||
        agent.route.join(',') !== next.route.join(',')
      ) {
        changed++;
      }
    });

    return changed;
  }, [crowdSimulation, preview]);

  const handleReroute = () => {
    onReroute(preview);
    setLastRerouted(routeChanges);
  };

  const blockedRoads = scenario.blockedRoads.length;
  const blockedExits = scenario.blockedExits.length;

  return (
    <section className="mb-8 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5 shadow-xl">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-cyan-300" />
            <h2 className="text-xl font-bold text-white">
              Dynamic Evacuation & Rerouting
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Recalculate safest routes when roads or exits become unavailable.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReroute}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
        >
          <RefreshCw className="h-4 w-4" />
          Reroute Crowd Now
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Metric
          icon={<Route className="h-4 w-4" />}
          label="Evacuating"
          value={crowdSimulation.evacuating.toLocaleString()}
        />
        <Metric
          icon={<Users className="h-4 w-4" />}
          label="Trapped"
          value={crowdSimulation.trapped.toLocaleString()}
        />
        <Metric
          icon={<Zap className="h-4 w-4" />}
          label="Routes changed"
          value={routeChanges.toLocaleString()}
        />
        <Metric
          icon={<ShieldCheck className="h-4 w-4" />}
          label="Blocked infra"
          value={(blockedRoads + blockedExits).toLocaleString()}
        />
      </div>

      <div className="mt-4 rounded-xl bg-slate-950/70 p-4 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-slate-300">
          <span>
            <strong className="text-white">{blockedRoads}</strong> blocked road(s)
          </span>
          <span>
            <strong className="text-white">{blockedExits}</strong> blocked exit(s)
          </span>
          <span>
            Current disaster:{' '}
            <strong className="capitalize text-white">
              {scenario.type}
            </strong>{' '}
            • severity {scenario.severity}/5
          </span>
        </div>

        <div className="mt-3 text-cyan-200">
          {lastRerouted > 0
            ? `${lastRerouted.toLocaleString()} agents received a new route in the latest reroute.`
            : routeChanges > 0
              ? `${routeChanges.toLocaleString()} agents can receive a different route right now.`
              : 'Current routes are already consistent with the active disaster conditions.'}
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  );
}
