import React, { useEffect, useMemo, useState } from 'react';
import { Bot, ShieldAlert, Users, Activity } from 'lucide-react';

import { useDisasterStore } from '../store/disaster';

import Map from './Map';
import AIChat from './AIChat';
import CrowdPanel from './CrowdPanel';
import EvacuationPanel from './EvacuationPanel';
import DisasterControl from './DisasterControl';
import DigitalTwin3D from './DigitalTwin3D';
import RescuePanel from './RescuePanel';
import RescueOperationPanel from './RescueOperationPanel';
import RiskPanel from './RiskPanel';
import EvacuationTimePanel from './EvacuationTimePanel';
import WhatIfPanel from './WhatIfPanel';
import IncidentHistoryPanel from './IncidentHistoryPanel';
import LiveSensorPanel from './LiveSensorPanel';
import DynamicReroutePanel from './DynamicReroutePanel';
import LiveEscalationPanel from './LiveEscalationPanel';
import CommandCenterPanel from './CommandCenterPanel';
import ShelterPanel from './ShelterPanel';
import EvacuationPlaybackPanel from './EvacuationPlaybackPanel';

import { simulateDisaster } from '../lib/disasterEngine';
import { calculateRescueAllocation } from '../lib/rescueEngine';
import { calculateRiskAssessment } from '../lib/riskEngine';
import { calculateEvacuationTime } from '../lib/evacuationTimeEngine';
import { calculateShelterAllocation } from '../lib/shelterEngine';

import { createCrowdSimulation, CrowdSimulation } from '../lib/crowdEngine';

const StatCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) => (
  <div className="card hover-lift">
    <div className="flex items-center space-x-4">
      <div className="p-3 rounded-lg bg-slate-800/80 backdrop-blur-sm">
        <Icon className="w-6 h-6 text-cyan-300" />
      </div>
      <div>
        <p className="text-gray-300 text-sm">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const { loading, error } = useDisasterStore();
  const [showChat, setShowChat] = useState(false);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  const [evacuationScenario, setEvacuationScenario] = useState(() =>
    simulateDisaster('fire', 3)
  );

  const [crowdSimulation, setCrowdSimulation] =
    useState<CrowdSimulation>(() => createCrowdSimulation(evacuationScenario));

  const handleLiveSensorSeverity = (nextSeverity: number) => {
    const safeSeverity = Math.max(1, Math.min(5, Math.round(nextSeverity)));
    const nextScenario = simulateDisaster(evacuationScenario.type, safeSeverity);
    setEvacuationScenario(nextScenario);
    setCrowdSimulation(createCrowdSimulation(nextScenario));
  };

  const riskSummary = useMemo(
    () => calculateRiskAssessment(evacuationScenario, crowdSimulation),
    [evacuationScenario, crowdSimulation]
  );

  const rescueSummary = useMemo(
    () => calculateRescueAllocation(evacuationScenario, crowdSimulation, riskSummary),
    [evacuationScenario, crowdSimulation, riskSummary]
  );

  const shelterSummary = useMemo(
    () => calculateShelterAllocation(evacuationScenario, crowdSimulation, riskSummary),
    [evacuationScenario, crowdSimulation, riskSummary]
  );

  const evacuationTimeSummary = useMemo(
    () => calculateEvacuationTime(evacuationScenario, crowdSimulation),
    [evacuationScenario, crowdSimulation]
  );

  useEffect(() => {
    setCrowdSimulation(createCrowdSimulation(evacuationScenario));
  }, [evacuationScenario]);

  if (loading) {
    return (
      <div className="min-h-screen bg-animate flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-animate flex items-center justify-center">
        <div className="glass p-6 rounded-lg text-white" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  const totalPopulation = crowdSimulation.totalPeople;
  const safePeople = crowdSimulation.safe;
  const evacuatingPeople = crowdSimulation.evacuating;
  const trappedPeople = crowdSimulation.trapped;

  return (
    <div className="min-h-screen bg-animate pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-cyan-400/10 p-3 border border-cyan-400/20">
                <ShieldAlert className="h-7 w-7 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">ResQTwin</h1>
                <p className="text-sm text-slate-400">
                  AI-Powered Disaster Management & Digital Twin
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowChat(true)}
            className="group flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-slate-900/80 px-5 py-3 text-left transition hover:border-cyan-300/40 hover:bg-slate-800"
          >
            <div className="rounded-lg bg-cyan-400/10 p-2">
              <Bot className="h-5 w-5 text-cyan-300" />
            </div>
            <div>
              <div className="font-semibold text-white">ResQTwin AI Assistant</div>
              <div className="text-xs text-emerald-300">Offline · Live simulation context</div>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard icon={Users} label="Total Population" value={totalPopulation.toLocaleString()} />
          <StatCard icon={Activity} label="Evacuating" value={evacuatingPeople.toLocaleString()} />
          <StatCard icon={ShieldAlert} label="Trapped" value={trappedPeople.toLocaleString()} />
          <StatCard icon={Bot} label="AI Risk Score" value={`${Math.round(riskSummary.overallScore)}/100`} />
        </div>

        <div className="mb-8">
          <DisasterControl
            onScenarioChange={(scenario) => {
              if (scenario) setEvacuationScenario(scenario);
            }}
          />
        </div>

        <div className="glass mb-8 rounded-xl overflow-hidden" style={{ height: '600px' }}>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-700">
            <div>
              <h2 className="text-lg font-bold text-white">Digital Twin</h2>
              <p className="text-xs text-slate-400">Live campus disaster visualization</p>
            </div>

            <div className="flex rounded-lg bg-slate-800 p-1">
              <button
                onClick={() => setViewMode('2d')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  viewMode === '2d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                2D
              </button>
              <button
                onClick={() => setViewMode('3d')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  viewMode === '3d' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                3D
              </button>
            </div>
          </div>

          <div className="h-[calc(100%-61px)] min-h-0">
            {viewMode === '2d' ? (
              <Map onDisasterSelect={() => {}} scenario={evacuationScenario} crowdSimulation={crowdSimulation} />
            ) : (
              <DigitalTwin3D scenario={evacuationScenario} crowdSimulation={crowdSimulation} />
            )}
          </div>
        </div>

        <div className="mb-8">
          <EvacuationPanel scenario={evacuationScenario} />
        </div>

        <div className="mb-8">
          <CrowdPanel
            scenario={evacuationScenario}
            simulation={crowdSimulation}
            onSimulationChange={setCrowdSimulation}
          />
        </div>

        <div className="mb-8">
          <EvacuationPlaybackPanel
            scenario={evacuationScenario}
            simulation={crowdSimulation}
            onSimulationChange={setCrowdSimulation}
          />
        </div>

        <div className="mb-8">
          <RiskPanel riskSummary={riskSummary} />
        </div>

        <div className="mb-8">
          <RescuePanel rescueSummary={rescueSummary} />
          <RescueOperationPanel
            trappedPeople={crowdSimulation.trapped}
            resourceCount={rescueSummary.assignments.length}
            simulation={crowdSimulation}
            onCrowdChange={setCrowdSimulation}
          />
        </div>

        <div className="mb-8">
          <ShelterPanel shelterSummary={shelterSummary} />
        </div>

        <div className="mb-8">
          <EvacuationTimePanel summary={evacuationTimeSummary} />
        </div>

        <div className="mb-8">
          <DynamicReroutePanel
            scenario={evacuationScenario}
            crowdSimulation={crowdSimulation}
            onReroute={setCrowdSimulation}
          />
        </div>

        <div className="mb-8">
          <CommandCenterPanel
            scenario={evacuationScenario}
            crowdSimulation={crowdSimulation}
            riskSummary={riskSummary}
            rescueSummary={rescueSummary}
            shelterSummary={shelterSummary}
            evacuationTimeSummary={evacuationTimeSummary}
          />
        </div>

        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveEscalationPanel
            scenario={evacuationScenario}
            crowdSimulation={crowdSimulation}
            onScenarioChange={setEvacuationScenario}
            onCrowdChange={setCrowdSimulation}
          />

          <LiveSensorPanel
            disasterType={evacuationScenario.type}
            currentSeverity={evacuationScenario.severity}
            onSeverityEscalate={handleLiveSensorSeverity}
          />
        </div>

        <div className="mb-8">
          <WhatIfPanel
            selectedDisaster={evacuationScenario.type}
            severity={evacuationScenario.severity}
          />
        </div>

        <div className="mb-8">
          <IncidentHistoryPanel
            scenario={evacuationScenario}
            crowdSimulation={crowdSimulation}
            riskSummary={riskSummary}
            rescueSummary={rescueSummary}
            shelterSummary={shelterSummary}
            evacuationTimeSummary={evacuationTimeSummary}
          />
        </div>
      </div>

      {showChat && (
        <div className="fixed bottom-8 right-8 w-[min(420px,calc(100vw-2rem))] z-50 shadow-2xl">
          <AIChat
            onClose={() => setShowChat(false)}
            context={{
              disasterType: evacuationScenario.type,
              severity: evacuationScenario.severity,
              riskScore: riskSummary.overallScore,
              trapped: crowdSimulation.trapped,
              evacuating: crowdSimulation.evacuating,
              safe: crowdSimulation.safe,
              blockedRoads: evacuationScenario.blockedRoads.length,
              blockedExits: evacuationScenario.blockedExits.length,
              estimatedMinutes: evacuationTimeSummary.estimatedMinutes,
              peopleAllocated: shelterSummary.peopleAllocated,
            }}
          />
        </div>
      )}
    </div>
  );
}
