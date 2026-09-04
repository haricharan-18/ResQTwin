import React from 'react';
import {
  RiskSummary,
  RiskAssessment,
  RiskLevel
} from '../lib/riskEngine';

interface RiskPanelProps {
  riskSummary: RiskSummary;
}

const levelStyles: Record<
  RiskLevel,
  {
    label: string;
    className: string;
  }
> = {
  low: {
    label: 'LOW',
    className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },

  medium: {
    label: 'MEDIUM',
    className: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  },

  high: {
    label: 'HIGH',
    className: 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  },

  critical: {
    label: 'CRITICAL',
    className: 'text-red-400 bg-red-500/10 border-red-500/30'
  }
};


function getScoreBarClass(
  score: number
): string {

  if (score >= 80) {
    return 'bg-red-500';
  }

  if (score >= 60) {
    return 'bg-orange-500';
  }

  if (score >= 35) {
    return 'bg-yellow-500';
  }

  return 'bg-emerald-500';
}


function getIcon(
  type: RiskAssessment['type']
): string {

  if (type === 'building') {
    return '🏢';
  }

  if (type === 'zone') {
    return '📍';
  }

  if (type === 'road') {
    return '🛣️';
  }

  return '🚪';
}


function RiskCard({
  assessment
}: {
  assessment: RiskAssessment;
}) {

  const style =
    levelStyles[assessment.level];

  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/50 p-4">

      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
            {getIcon(assessment.type)}
          </div>

          <div className="min-w-0">

            <div className="truncate text-sm font-semibold text-white">
              {assessment.name}
            </div>

            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
              {assessment.type}
            </div>

          </div>

        </div>


        <div
          className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold ${style.className}`}
        >
          {style.label}
        </div>

      </div>


      <div className="mt-4">

        <div className="mb-1 flex items-center justify-between">

          <span className="text-[10px] text-slate-500">
            Risk score
          </span>

          <span className="text-sm font-bold text-white">
            {assessment.score}/100
          </span>

        </div>


        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

          <div
            className={`h-full rounded-full transition-all ${getScoreBarClass(
              assessment.score
            )}`}
            style={{
              width: `${assessment.score}%`
            }}
          />

        </div>

      </div>


      <div className="mt-4 space-y-2">

        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Why?
        </div>

        {assessment.reasons
          .slice(0, 3)
          .map(
            (reason, index) => (
              <div
                key={index}
                className="flex gap-2 text-xs text-slate-300"
              >
                <span className="mt-0.5 text-red-400">
                  •
                </span>

                <span>
                  {reason}
                </span>
              </div>
            )
          )}

      </div>


      <div className="mt-4 border-t border-white/5 pt-3">

        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Recommended action
        </div>

        <div className="space-y-1.5">

          {assessment.recommendations
            .slice(0, 2)
            .map(
              (recommendation, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-blue-500/5 px-3 py-2 text-[11px] leading-relaxed text-blue-200"
                >
                  {recommendation}
                </div>
              )
            )}

        </div>

      </div>

    </div>
  );
}


export default function RiskPanel({
  riskSummary
}: RiskPanelProps) {

  const topRisks =
    [...riskSummary.assessments]
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 6);


  return (

    <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-xl">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-2">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-xl">
              🧠
            </div>

            <div>

              <h2 className="text-lg font-bold text-white">
                AI Risk Intelligence
              </h2>

              <p className="text-xs text-slate-400">
                Offline explainable disaster risk analysis
              </p>

            </div>

          </div>

        </div>


        {/* OVERALL SCORE */}

        <div className="flex items-center gap-4">

          <div className="text-right">

            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Overall Risk
            </div>

            <div className="text-2xl font-bold text-white">
              {riskSummary.overallScore}
              <span className="text-sm text-slate-500">
                /100
              </span>
            </div>

          </div>


          <div
            className={`rounded-xl border px-4 py-2 text-xs font-bold ${
              levelStyles[
                riskSummary.overallLevel
              ].className
            }`}
          >
            {
              levelStyles[
                riskSummary.overallLevel
              ].label
            }
          </div>

        </div>

      </div>


      {/* RISK COUNTERS */}

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">

        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">

          <div className="text-[10px] uppercase tracking-wider text-red-300">
            Critical
          </div>

          <div className="mt-1 text-2xl font-bold text-red-400">
            {riskSummary.critical}
          </div>

        </div>


        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-3">

          <div className="text-[10px] uppercase tracking-wider text-orange-300">
            High
          </div>

          <div className="mt-1 text-2xl font-bold text-orange-400">
            {riskSummary.high}
          </div>

        </div>


        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">

          <div className="text-[10px] uppercase tracking-wider text-yellow-300">
            Medium
          </div>

          <div className="mt-1 text-2xl font-bold text-yellow-400">
            {riskSummary.medium}
          </div>

        </div>


        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">

          <div className="text-[10px] uppercase tracking-wider text-emerald-300">
            Low
          </div>

          <div className="mt-1 text-2xl font-bold text-emerald-400">
            {riskSummary.low}
          </div>

        </div>

      </div>


      {/* PRIORITY ACTIONS */}

      <div className="mt-5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">

        <div className="mb-3 flex items-center gap-2">

          <span className="text-sm">
            ⚡
          </span>

          <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
            AI Priority Actions
          </span>

        </div>


        <div className="grid gap-2 md:grid-cols-2">

          {riskSummary.priorityActions
            .slice(0, 6)
            .map(
              (action, index) => (

                <div
                  key={index}
                  className="rounded-lg border border-white/5 bg-slate-950/40 px-3 py-2.5 text-xs text-slate-300"
                >
                  <span className="mr-2 font-bold text-purple-400">
                    {index + 1}.
                  </span>

                  {action}

                </div>

              )
            )}

        </div>

      </div>


      {/* TOP RISKS */}

      <div className="mt-5">

        <div className="mb-3 flex items-center justify-between">

          <div>

            <h3 className="text-sm font-bold text-white">
              Highest Risk Locations
            </h3>

            <p className="text-[10px] text-slate-500">
              Ranked using disaster exposure, crowd pressure,
              infrastructure vulnerability and congestion.
            </p>

          </div>

          <div className="rounded-full bg-blue-500/10 px-3 py-1 text-[9px] font-semibold text-blue-300">
            OFFLINE AI
          </div>

        </div>


        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

          {topRisks.map(
            (assessment) => (

              <RiskCard
                key={`${assessment.type}-${assessment.id}`}
                assessment={assessment}
              />

            )
          )}

        </div>

      </div>


      {/* EXPLAINABILITY */}

      <div className="mt-5 rounded-xl border border-white/5 bg-slate-950/30 p-4">

        <div className="flex items-start gap-3">

          <div className="text-lg">
            🔍
          </div>

          <div>

            <div className="text-xs font-bold text-white">
              Explainable AI
            </div>

            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Risk scores are calculated locally from disaster
              severity, building vulnerability, population
              exposure, crowd pressure, road congestion and
              emergency infrastructure status. No cloud AI or
              internet connection is required.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}