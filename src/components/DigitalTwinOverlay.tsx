import type { DigitalTwinState } from '../lib/digitalTwinState';

const LEGEND = [
  { color: '#334155', label: 'Building' },
  { color: '#ef4444', label: 'Affected Building' },
  { color: '#64748b', label: 'Open Road' },
  { color: '#dc2626', label: 'Blocked Road' },
  { color: '#38bdf8', label: 'Evacuation Route' },
  { color: '#22c55e', label: 'Low Risk' },
  { color: '#eab308', label: 'Medium Risk' },
  { color: '#f97316', label: 'High Risk' },
  { color: '#ef4444', label: 'Critical Risk' },
  { color: '#7dd3fc', label: 'People' },
  { color: '#22c55e', label: 'Exit' },
  { color: '#eab308', label: 'Assembly Point' },
];

export default function DigitalTwinOverlay({
  twinState,
  compact = false,
}: {
  twinState: DigitalTwinState;
  compact?: boolean;
}) {
  const { scenario, crowd } = twinState;

  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 max-w-[220px] rounded-lg border border-cyan-400/20 bg-slate-950/88 px-3 py-2 shadow-xl backdrop-blur-sm">
        <div className="text-[11px] font-semibold tracking-wide text-cyan-200">
          ResQTwin Digital Twin
        </div>
        <div className="text-[10px] text-slate-400">
          Shared campus model · live
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-lg border border-red-400/25 bg-slate-950/88 px-3 py-2 shadow-xl backdrop-blur-sm">
        <div className="text-[9px] uppercase tracking-wider text-slate-400">
          Active Disaster
        </div>
        <div className="text-sm font-bold uppercase text-white">
          {scenario.type}
        </div>
        <div className="text-[11px] text-red-300">
          Severity {scenario.severity}/5
        </div>
      </div>

      <div className="pointer-events-none absolute right-3 top-24 z-20 w-[132px] rounded-lg border border-slate-700/80 bg-slate-950/88 px-3 py-2 text-[11px] shadow-xl backdrop-blur-sm">
        <Row label="Population" value={twinState.totalPopulation} />
        <Row label="Buildings" value={twinState.buildings.length} />
        <Row label="Exits" value={twinState.exits.length} />
        <Row label="Roads" value={twinState.roads.length} />
        <Row label="Evacuating" value={crowd.evacuating} accent="text-sky-300" />
        <Row label="Trapped" value={crowd.trapped} accent="text-red-300" />
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-lg border border-slate-700/80 bg-slate-950/88 px-3 py-2 shadow-xl backdrop-blur-sm">
        <div className="mb-1 text-[10px] font-semibold text-white">Legend</div>
        <div className={`grid gap-x-4 gap-y-0.5 ${compact ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {LEGEND.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: item.color }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Row({
  label,
  value,
  accent = 'text-white',
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="text-slate-400">{label}</span>
      <span className={`font-semibold ${accent}`}>{value}</span>
    </div>
  );
}
