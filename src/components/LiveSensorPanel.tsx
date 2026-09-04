import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Flame,
  Pause,
  Play,
  Radio,
  ShieldAlert,
  Thermometer,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import { DisasterType } from '../engines/disasterEngine';
import {
  createLiveSensorReading,
  LiveSensorReading,
} from '../engines/liveSensorEngine';

interface LiveSensorPanelProps {
  disasterType: DisasterType;
  currentSeverity: number;
  onSeverityEscalate: (severity: number) => void;
}

const EMPTY_READING: LiveSensorReading = {
  smoke: 0,
  temperature: 25,
  waterLevel: 0,
  vibration: 0,
  windSpeed: 0,
  sensorSeverity: 1,
  timestamp: Date.now(),
};

export default function LiveSensorPanel({
  disasterType,
  currentSeverity,
  onSeverityEscalate,
}: LiveSensorPanelProps) {
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  const reading = useMemo(
    () => createLiveSensorReading(disasterType, currentSeverity, tick),
    [disasterType, currentSeverity, tick]
  );

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1200);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    setTick(0);
  }, [disasterType, currentSeverity]);

  const canEscalate = reading.sensorSeverity > currentSeverity;
  const targetSeverity = Math.min(5, Math.max(currentSeverity + 1, reading.sensorSeverity));

  const sensorCards = [
    {
      label: 'Smoke',
      value: `${reading.smoke}%`,
      icon: <Flame size={18} />,
      active: disasterType === 'fire',
    },
    {
      label: 'Temperature',
      value: `${reading.temperature}Â°C`,
      icon: <Thermometer size={18} />,
      active: disasterType === 'fire',
    },
    {
      label: 'Water Level',
      value: `${reading.waterLevel} m`,
      icon: <Waves size={18} />,
      active: disasterType === 'flood' || disasterType === 'landslide',
    },
    {
      label: 'Vibration',
      value: `${reading.vibration}`,
      icon: <Activity size={18} />,
      active: disasterType === 'earthquake' || disasterType === 'landslide',
    },
    {
      label: 'Wind Speed',
      value: `${reading.windSpeed} km/h`,
      icon: <Wind size={18} />,
      active: disasterType === 'cyclone',
    },
  ];

  return (
    <section className="mb-8 rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-5 shadow-xl">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Radio size={20} className={running ? 'text-cyan-300 animate-pulse' : 'text-slate-400'} />
            <h2 className="text-xl font-bold text-white">Live Sensor Intelligence</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${running ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
              {running ? 'LIVE' : 'PAUSED'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Offline simulated sensors feeding the active disaster engine in real time.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setRunning((value) => !value)}
            className="flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {running ? <Pause size={17} /> : <Play size={17} />}
            {running ? 'Pause Sensors' : 'Start Live Sensors'}
          </button>

          <button
            onClick={() => onSeverityEscalate(targetSeverity)}
            disabled={!canEscalate}
            className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Zap size={17} />
            Escalate to Severity {targetSeverity}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {sensorCards.map((sensor) => (
          <div
            key={sensor.label}
            className={`rounded-xl border p-4 ${
              sensor.active
                ? 'border-cyan-400/30 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-900/70'
            }`}
          >
            <div className="mb-2 flex items-center gap-2 text-slate-400">
              {sensor.icon}
              <span className="text-xs font-medium uppercase tracking-wide">{sensor.label}</span>
            </div>
            <div className="text-2xl font-bold text-white">{sensor.value}</div>
            <div className="mt-1 text-xs text-slate-500">
              {sensor.active ? 'Primary signal' : 'Background signal'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
            <ShieldAlert size={18} />
            Sensor Severity
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-4xl font-black text-white">{reading.sensorSeverity}/5</span>
            <span className="pb-1 text-sm text-slate-400">
              Active disaster: {disasterType}
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${reading.sensorSeverity * 20}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 lg:min-w-[290px]">
          <div className="text-xs uppercase tracking-wide text-slate-500">Control status</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-200">
            <Zap size={16} className="text-cyan-300" />
            Current dashboard severity: <strong>{currentSeverity}/5</strong>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {canEscalate
              ? `Sensor feed recommends escalation to ${targetSeverity}/5.`
              : 'Current severity already matches or exceeds sensor recommendation.'}
          </div>
        </div>
      </div>
    </section>
  );
}

