import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Clock3,
  Database,
  Download,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { DisasterScenario } from '../engines/disasterEngine';
import { CrowdSimulation } from '../engines/crowdEngine';
import { RiskSummary } from '../engines/riskEngine';
import { RescueSummary } from '../engines/rescueEngine';
import { ShelterSummary } from '../engines/shelterEngine';
import { EvacuationTimeSummary } from '../engines/evacuationTimeEngine';

const STORAGE_KEY = 'resqtwin_incident_history_v1';

type IncidentRecord = {
  id: string;
  timestamp: string;
  disaster: DisasterScenario['type'];
  severity: number;
  blockedRoads: number;
  blockedExits: number;
  totalPeople: number;
  trapped: number;
  evacuating: number;
  evacuated: number;
  riskScore: number;
  estimatedMinutes: number;
  rescuedSupported: number;
  peopleAllocated: number;
};

interface IncidentHistoryPanelProps {
  scenario: DisasterScenario;
  crowdSimulation: CrowdSimulation;
  riskSummary: RiskSummary;
  rescueSummary: RescueSummary;
  shelterSummary: ShelterSummary;
  evacuationTimeSummary: EvacuationTimeSummary;
}

function readHistory(): IncidentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(records: IncidentRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(0, 12)));
}

export default function IncidentHistoryPanel({
  scenario,
  crowdSimulation,
  riskSummary,
  rescueSummary,
  shelterSummary,
  evacuationTimeSummary,
}: IncidentHistoryPanelProps) {
  const [records, setRecords] = useState<IncidentRecord[]>(readHistory);
  const [savedMessage, setSavedMessage] = useState('');

  const currentRecord = useMemo<IncidentRecord>(() => ({
    id: `${Date.now()}-${scenario.type}-${scenario.severity}`,
    timestamp: new Date().toISOString(),
    disaster: scenario.type,
    severity: scenario.severity,
    blockedRoads: scenario.blockedRoads.length,
    blockedExits: scenario.blockedExits.length,
    totalPeople: crowdSimulation.totalPeople,
    trapped: crowdSimulation.trapped,
    evacuating: crowdSimulation.evacuating,
    evacuated: crowdSimulation.safe,
    riskScore: Math.round(riskSummary.overallScore),
    estimatedMinutes: evacuationTimeSummary.estimatedMinutes,
    rescuedSupported: rescueSummary.totalSupportCapacity,
    peopleAllocated: shelterSummary.peopleAllocated,
  }), [
    scenario,
    crowdSimulation,
    riskSummary,
    rescueSummary,
    shelterSummary,
    evacuationTimeSummary,
  ]);

  const saveIncident = () => {
    const next = [
      currentRecord,
      ...records.filter(
        (record) =>
          !(
            record.disaster === currentRecord.disaster &&
            record.severity === currentRecord.severity &&
            record.trapped === currentRecord.trapped &&
            record.blockedRoads === currentRecord.blockedRoads &&
            record.blockedExits === currentRecord.blockedExits
          )
      ),
    ].slice(0, 12);

    writeHistory(next);
    setRecords(next);
    setSavedMessage('Incident snapshot saved locally.');
    window.setTimeout(() => setSavedMessage(''), 2200);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const existing = readHistory();
      const latest = existing[0];

      const materiallyChanged =
        !latest ||
        latest.disaster !== currentRecord.disaster ||
        latest.severity !== currentRecord.severity ||
        latest.blockedRoads !== currentRecord.blockedRoads ||
        latest.blockedExits !== currentRecord.blockedExits ||
        latest.trapped !== currentRecord.trapped;

      if (materiallyChanged) {
        const next = [currentRecord, ...existing].slice(0, 12);
        writeHistory(next);
        setRecords(next);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [currentRecord]);

  const clearHistory = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecords([]);
  };

  const exportHistory = () => {
    const blob = new Blob(
      [JSON.stringify(records, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resqtwin-incident-history.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreLatest = () => {
    setSavedMessage(
      records.length
        ? 'Latest snapshot is stored locally. Use it as the incident record for recovery.'
        : 'No saved incident is available.'
    );
    window.setTimeout(() => setSavedMessage(''), 2600);
  };

  return (
    <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900/80 p-5 shadow-lg">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xl font-bold text-white">
            <Archive className="h-5 w-5 text-cyan-300" />
            Offline Incident History
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Local incident snapshots survive browser refresh and work without internet.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveIncident}
            className="flex items-center gap-2 rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950"
          >
            <Save className="h-4 w-4" />
            Save Snapshot
          </button>

          <button
            onClick={exportHistory}
            disabled={!records.length}
            className="flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            Export
          </button>

          <button
            onClick={clearHistory}
            disabled={!records.length}
            className="flex items-center gap-2 rounded-lg bg-red-900/70 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="mb-4 rounded-lg border border-cyan-800 bg-cyan-950/40 px-4 py-3 text-sm text-cyan-200">
          {savedMessage}
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl bg-slate-800 p-4">
          <div className="text-xs text-slate-400">Stored Incidents</div>
          <div className="mt-1 text-2xl font-bold text-white">{records.length}</div>
        </div>
        <div className="rounded-xl bg-slate-800 p-4">
          <div className="text-xs text-slate-400">Current Severity</div>
          <div className="mt-1 text-2xl font-bold text-orange-300">
            {scenario.severity}/5
          </div>
        </div>
        <div className="rounded-xl bg-slate-800 p-4">
          <div className="text-xs text-slate-400">Current Trapped</div>
          <div className="mt-1 text-2xl font-bold text-red-300">
            {crowdSimulation.trapped.toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl bg-slate-800 p-4">
          <div className="text-xs text-slate-400">Storage</div>
          <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-emerald-300">
            <Database className="h-4 w-4" />
            Browser Local
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
          No incident snapshots yet. The current incident will be saved automatically when its disaster state changes.
        </div>
      ) : (
        <div className="space-y-3">
          {records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="grid gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4 md:grid-cols-6"
            >
              <div>
                <div className="text-xs text-slate-400">Incident</div>
                <div className="font-semibold capitalize text-white">{record.disaster}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Severity</div>
                <div className="font-semibold text-orange-300">{record.severity}/5</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Trapped</div>
                <div className="font-semibold text-red-300">{record.trapped.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">ETA</div>
                <div className="font-semibold text-blue-300">{record.estimatedMinutes} min</div>
              </div>
              <div>
                <div className="text-xs text-slate-400">Risk</div>
                <div className="font-semibold text-yellow-300">{record.riskScore}/100</div>
              </div>
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock3 className="h-3 w-3" />
                  Saved
                </div>
                <div className="text-sm text-slate-300">
                  {new Date(record.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <RotateCcw className="h-3.5 w-3.5" />
        Offline recovery record • localStorage • no cloud dependency
      </div>
    </section>
  );
}
