import React, { useMemo, useState } from 'react';
import {
  Bot,
  Send,
  X,
  ShieldAlert,
  Users,
  Route,
  Clock3,
  Sparkles,
} from 'lucide-react';

type DisasterType = 'fire' | 'flood' | 'earthquake' | 'cyclone' | 'landslide';

export interface AIContext {
  disasterType?: DisasterType;
  severity?: number;
  riskScore?: number;
  trapped?: number;
  evacuating?: number;
  safe?: number;
  blockedRoads?: number;
  blockedExits?: number;
  estimatedMinutes?: number;
  peopleAllocated?: number;
}

interface AIChatProps {
  onClose?: () => void;
  context?: AIContext;
}

const label: Record<DisasterType, string> = {
  fire: 'Fire',
  flood: 'Flood',
  earthquake: 'Earthquake',
  cyclone: 'Cyclone',
  landslide: 'Landslide',
};

function formatNumber(value: number | undefined) {
  return (value ?? 0).toLocaleString();
}

function answerQuestion(question: string, context: AIContext): string {
  const q = question.toLowerCase();
  const disaster = label[context.disasterType ?? 'fire'];
  const severity = context.severity ?? 3;
  const risk = context.riskScore ?? 0;
  const trapped = context.trapped ?? 0;
  const evacuating = context.evacuating ?? 0;
  const safe = context.safe ?? 0;
  const blockedRoads = context.blockedRoads ?? 0;
  const blockedExits = context.blockedExits ?? 0;
  const eta = context.estimatedMinutes ?? 0;
  const allocated = context.peopleAllocated ?? 0;

  if (q.includes('risk') || q.includes('danger') || q.includes('safe')) {
    return `Current ${disaster} scenario is severity ${severity}/5 with an AI risk score of ${Math.round(risk)}/100. ${blockedRoads} road(s) and ${blockedExits} exit(s) are blocked. Priority should be given to high-risk zones and keeping evacuation routes clear.`;
  }

  if (q.includes('evacuat') || q.includes('route') || q.includes('exit')) {
    return `Evacuation status: ${formatNumber(safe)} safe, ${formatNumber(evacuating)} evacuating, and ${formatNumber(trapped)} trapped. The system uses safest-route scoring with disaster risk and congestion rather than simply choosing the shortest route.`;
  }

  if (q.includes('rescue') || q.includes('trapped')) {
    return `${formatNumber(trapped)} people are currently trapped in the Digital Twin simulation. Rescue operations should prioritize the highest-risk affected areas first, then move recovered people toward open exits.`;
  }

  if (q.includes('shelter') || q.includes('hospital') || q.includes('medical')) {
    return `${formatNumber(allocated)} people are currently allocated to emergency facilities. Trapped people are intentionally excluded from shelter counts until rescue recovery is completed.`;
  }

  if (q.includes('time') || q.includes('eta') || q.includes('how long')) {
    return `The current estimated evacuation time is about ${formatNumber(eta)} minute(s). The estimate accounts for disaster severity, blocked infrastructure, bottlenecks, and congestion.`;
  }

  if (q.includes('what if') || q.includes('scenario') || q.includes('severity')) {
    return `For ${disaster}, severity ${severity}/5 is active. Use the What-If Simulator to compare severity 1â€“5 and identify the point where trapped population, risk, blocked infrastructure, or evacuation time becomes critical.`;
  }

  if (q.includes('population') || q.includes('people') || q.includes('crowd')) {
    return `The live crowd state contains ${formatNumber(safe)} safe, ${formatNumber(evacuating)} evacuating, and ${formatNumber(trapped)} trapped people. Crowd congestion is fed back into movement speed and rerouting decisions.`;
  }

  if (q.includes('fire') || q.includes('flood') || q.includes('earthquake') || q.includes('cyclone') || q.includes('landslide')) {
    return `ResQTwin is currently simulating ${disaster} at severity ${severity}/5. I can explain the current risk, evacuation, rescue, shelter, ETA, or What-If state using the live local simulation.`;
  }

  return `I'm the offline ResQTwin AI Assistant. I can analyze the current ${disaster} scenario, risk (${Math.round(risk)}/100), evacuation, trapped people (${formatNumber(trapped)}), blocked routes, rescue, shelters, and ETA. Try asking: "What is the safest evacuation plan?"`;
}

export default function AIChat({ onClose, context = {} }: AIChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I am the ResQTwin Offline AI Assistant. Ask me about the current disaster, risk, evacuation, rescue, shelters, routes, or ETA.',
    },
  ]);

  const quickQuestions = useMemo(
    () => [
      'What is the safest evacuation plan?',
      'How many people are trapped?',
      'What is the current risk?',
      'How long will evacuation take?',
    ],
    []
  );

  const send = (text = input) => {
    const question = text.trim();
    if (!question) return;

    const reply = answerQuestion(question, context);
    setMessages((items) => [
      ...items,
      { role: 'user', text: question },
      { role: 'assistant', text: reply },
    ]);
    setInput('');
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/95 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-400/15 p-2">
            <Bot className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <div className="font-bold text-white">ResQTwin AI Assistant</div>
            <div className="flex items-center gap-1 text-xs text-emerald-300">
              <Sparkles className="h-3 w-3" />
              Offline Â· Live simulation context
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-800 bg-slate-950 p-3 text-xs">
        <div className="rounded-lg bg-slate-900 p-2 text-slate-300">
          <ShieldAlert className="mb-1 h-4 w-4 text-amber-300" />
          Risk <strong className="text-white">{Math.round(context.riskScore ?? 0)}/100</strong>
        </div>
        <div className="rounded-lg bg-slate-900 p-2 text-slate-300">
          <Users className="mb-1 h-4 w-4 text-red-300" />
          Trapped <strong className="text-white">{formatNumber(context.trapped)}</strong>
        </div>
        <div className="rounded-lg bg-slate-900 p-2 text-slate-300">
          <Route className="mb-1 h-4 w-4 text-cyan-300" />
          Blocked <strong className="text-white">{context.blockedRoads ?? 0} roads</strong>
        </div>
        <div className="rounded-lg bg-slate-900 p-2 text-slate-300">
          <Clock3 className="mb-1 h-4 w-4 text-violet-300" />
          ETA <strong className="text-white">{context.estimatedMinutes ?? 0} min</strong>
        </div>
      </div>

      <div className="max-h-72 space-y-3 overflow-y-auto p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`rounded-xl p-3 text-sm ${
              message.role === 'user'
                ? 'ml-8 bg-cyan-500/10 text-cyan-100'
                : 'mr-4 bg-slate-900 text-slate-200'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {quickQuestions.map((question) => (
          <button
            key={question}
            onClick={() => send(question)}
            className="rounded-full border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-cyan-400/40 hover:text-white"
          >
            {question}
          </button>
        ))}
      </div>

      <div className="flex gap-2 border-t border-slate-800 p-3">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
          placeholder="Ask about the current incident..."
          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
        />
        <button
          onClick={() => send()}
          className="rounded-xl bg-cyan-400 px-4 text-slate-950 hover:bg-cyan-300"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

