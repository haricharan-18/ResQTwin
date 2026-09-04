import React, { useEffect, useState } from 'react';
import {
  createCrowdSimulation,
  advanceCrowdSimulation,
  rerouteCrowd,
  CrowdSimulation
} from '../lib/crowdEngine';

import { DisasterScenario } from '../lib/disasterEngine';

import {
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  Route
} from 'lucide-react';

interface CrowdPanelProps {
  scenario: DisasterScenario;
  simulation?: CrowdSimulation;
  onSimulationChange?: (simulation: CrowdSimulation) => void;
}

export default function CrowdPanel({
  scenario,
  simulation: externalSimulation,
  onSimulationChange
}: CrowdPanelProps) {

  const [localSimulation, setLocalSimulation] =
    useState<CrowdSimulation>(() =>
      createCrowdSimulation(scenario)
    );

  const simulation = externalSimulation ?? localSimulation;

  const [step, setStep] = useState(0);

  /*
   * Reset the simulation whenever
   * the disaster scenario changes.
   */
  useEffect(() => {

    const newSimulation =
      createCrowdSimulation(scenario);

    setLocalSimulation(newSimulation);
    setStep(0);

    onSimulationChange?.(newSimulation);

  }, [scenario]);

  /*
   * Update simulation state.
   */
  const updateSimulation = (
    nextSimulation: CrowdSimulation
  ) => {

    setLocalSimulation(nextSimulation);

    onSimulationChange?.(nextSimulation);
  };

  /*
   * Move the crowd one simulation step.
   */
  const handleSimulationStep = () => {

    const nextSimulation =
      advanceCrowdSimulation(
        simulation,
        scenario
      );

    updateSimulation(nextSimulation);

    setStep(current => current + 1);
  };

  /*
   * Recalculate routes.
   */
  const handleReroute = () => {

    const nextSimulation =
      rerouteCrowd(
        simulation,
        scenario
      );

    updateSimulation(nextSimulation);
  };

  /*
   * Restart simulation.
   */
  const handleReset = () => {

    const newSimulation =
      createCrowdSimulation(scenario);

    updateSimulation(newSimulation);

    setStep(0);
  };

  const evacuationProgress =
    simulation.totalPeople > 0
      ? Math.round(
          (simulation.safe /
            simulation.totalPeople) *
            100
        )
      : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">

        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-blue-400" />
            Crowd Simulation Engine
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Individual-agent evacuation and bottleneck detection
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={handleReroute}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-semibold text-white hover:bg-orange-500"
          >
            <Route size={16} />
            Reroute
          </button>

          <button
            onClick={handleSimulationStep}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-500"
          >
            <Play size={16} />
            Simulate Step
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600"
          >
            <RotateCcw size={16} />
            Reset
          </button>

        </div>

      </div>

      {/* Current scenario */}
      <div className="mb-5 rounded-lg border border-red-500/30 bg-red-500/10 p-4">

        <div className="flex items-center justify-between">

          <div>
            <div className="text-xs uppercase text-slate-400">
              Active Disaster
            </div>

            <div className="text-lg font-bold text-white capitalize">
              {scenario.type}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-400">
              Severity
            </div>

            <div className="text-lg font-bold text-red-400">
              {scenario.severity}/5
            </div>
          </div>

        </div>

      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <div className="rounded-lg bg-slate-800 p-4">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Users size={16} />
            Total People
          </div>

          <div className="text-2xl font-bold text-white mt-1">
            {simulation.totalPeople}
          </div>

        </div>

        <div className="rounded-lg bg-slate-800 p-4">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Activity size={16} />
            Evacuating
          </div>

          <div className="text-2xl font-bold text-blue-400 mt-1">
            {simulation.evacuating}
          </div>

        </div>

        <div className="rounded-lg bg-slate-800 p-4">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <CheckCircle size={16} />
            Safe
          </div>

          <div className="text-2xl font-bold text-green-400 mt-1">
            {simulation.safe}
          </div>

        </div>

        <div className="rounded-lg bg-slate-800 p-4">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <AlertTriangle size={16} />
            Trapped
          </div>

          <div className="text-2xl font-bold text-red-400 mt-1">
            {simulation.trapped}
          </div>

        </div>

      </div>

      {/* Progress */}
      <div className="mt-6">

        <div className="flex justify-between text-sm mb-2">

          <span className="text-slate-400">
            Evacuation Progress
          </span>

          <span className="text-white font-semibold">
            {evacuationProgress}%
          </span>

        </div>

        <div className="h-3 rounded-full bg-slate-700 overflow-hidden">

          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${evacuationProgress}%`
            }}
          />

        </div>

      </div>

      {/* Bottlenecks */}
      <div className="mt-6">

        <div className="flex items-center justify-between mb-3">

          <h3 className="text-white font-semibold">
            Detected Bottlenecks
          </h3>

          <span className="text-xs text-slate-400">
            {simulation.bottlenecks.length} detected
          </span>

        </div>

        {simulation.bottlenecks.length === 0 ? (

          <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-green-300">
            No critical bottlenecks detected.
          </div>

        ) : (

          <div className="space-y-2">

            {simulation.bottlenecks.map(
              (bottleneck) => (

                <div
                  key={
                    bottleneck.roadId ??
                    bottleneck.location
                  }
                  className="flex items-center justify-between rounded-lg bg-red-500/10 border border-red-500/30 p-3"
                >

                  <div>

                    <div className="text-white font-semibold">
                      {bottleneck.location}
                    </div>

                    <div className="text-xs text-slate-400 mt-1">
                      {bottleneck.people} people /{' '}
                      {bottleneck.capacity} capacity
                    </div>

                  </div>

                  <div className="text-right">

                    <div
                      className={
                        bottleneck.severity === 'critical'
                          ? 'text-red-400 font-bold'
                          : bottleneck.severity === 'high'
                          ? 'text-orange-400 font-bold'
                          : 'text-yellow-400 font-bold'
                      }
                    >
                      {bottleneck.congestion}%
                    </div>

                    <div className="text-xs text-slate-500 capitalize">
                      {bottleneck.severity}
                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* Simulation information */}
      <div className="mt-5 flex justify-between text-xs text-slate-500">

        <span>
          Simulation Step: {step}
        </span>

        <span>
          Average Congestion: {simulation.averageCongestion}%
        </span>

      </div>

    </div>
  );
}