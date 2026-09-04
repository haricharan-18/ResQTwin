import { DisasterScenario, simulateDisaster } from './disasterEngine';

export type SensorReading = {
  smoke: number;
  temperature: number;
  waterLevel: number;
  vibration: number;
  windSpeed: number;
};

export type SensorStatus = {
  label: string;
  value: number;
  unit: string;
  dangerAt: number;
  icon: string;
};

export function generateSensorReading(
  scenario: DisasterScenario,
  tick: number
): SensorReading {
  const wave = (offset: number, amplitude: number) =>
    Math.sin(tick * 0.65 + offset) * amplitude;

  const base = scenario.severity * 12;

  switch (scenario.type) {
    case 'fire':
      return {
        smoke: clamp(18 + base + wave(0, 10), 0, 100),
        temperature: clamp(28 + scenario.severity * 14 + wave(1, 7), 20, 120),
        waterLevel: clamp(8 + wave(2, 4), 0, 100),
        vibration: clamp(10 + scenario.severity * 5 + wave(3, 5), 0, 100),
        windSpeed: clamp(12 + scenario.severity * 4 + wave(4, 6), 0, 120),
      };

    case 'flood':
      return {
        smoke: clamp(8 + wave(0, 4), 0, 100),
        temperature: clamp(27 + wave(1, 4), 20, 120),
        waterLevel: clamp(18 + scenario.severity * 15 + wave(2, 10), 0, 100),
        vibration: clamp(12 + scenario.severity * 4 + wave(3, 5), 0, 100),
        windSpeed: clamp(14 + scenario.severity * 3 + wave(4, 5), 0, 120),
      };

    case 'earthquake':
      return {
        smoke: clamp(12 + scenario.severity * 5 + wave(0, 7), 0, 100),
        temperature: clamp(28 + wave(1, 4), 20, 120),
        waterLevel: clamp(10 + scenario.severity * 4 + wave(2, 5), 0, 100),
        vibration: clamp(20 + scenario.severity * 15 + wave(3, 12), 0, 100),
        windSpeed: clamp(10 + wave(4, 5), 0, 120),
      };

    case 'cyclone':
      return {
        smoke: clamp(8 + scenario.severity * 3 + wave(0, 5), 0, 100),
        temperature: clamp(26 + wave(1, 5), 20, 120),
        waterLevel: clamp(15 + scenario.severity * 9 + wave(2, 8), 0, 100),
        vibration: clamp(15 + scenario.severity * 6 + wave(3, 7), 0, 100),
        windSpeed: clamp(25 + scenario.severity * 18 + wave(4, 14), 0, 160),
      };

    case 'landslide':
      return {
        smoke: clamp(6 + scenario.severity * 2 + wave(0, 4), 0, 100),
        temperature: clamp(25 + wave(1, 4), 20, 120),
        waterLevel: clamp(22 + scenario.severity * 12 + wave(2, 9), 0, 100),
        vibration: clamp(18 + scenario.severity * 13 + wave(3, 10), 0, 100),
        windSpeed: clamp(12 + scenario.severity * 3 + wave(4, 5), 0, 120),
      };
  }
}

export function calculateSensorSeverity(
  type: DisasterScenario['type'],
  reading: SensorReading
): number {
  const signals: Record<DisasterScenario['type'], number> = {
    fire: Math.max(
      reading.smoke / 18,
      reading.temperature / 42
    ),
    flood: reading.waterLevel / 28,
    earthquake: reading.vibration / 28,
    cyclone: reading.windSpeed / 58,
    landslide: Math.max(
      reading.waterLevel / 30,
      reading.vibration / 28
    ),
  };

  const signal = signals[type];

  if (signal >= 3.8) return 5;
  if (signal >= 3.0) return 4;
  if (signal >= 2.1) return 3;
  if (signal >= 1.35) return 2;
  return 1;
}

export function getSensorStatuses(
  type: DisasterScenario['type'],
  reading: SensorReading
): SensorStatus[] {
  const config = {
    fire: [
      ['Smoke', reading.smoke, '%', 70, 'smoke'],
      ['Temperature', reading.temperature, '°C', 70, 'temperature'],
      ['Water Level', reading.waterLevel, '%', 70, 'water'],
      ['Vibration', reading.vibration, '%', 70, 'vibration'],
      ['Wind Speed', reading.windSpeed, 'km/h', 90, 'wind'],
    ],
    flood: [
      ['Smoke', reading.smoke, '%', 70, 'smoke'],
      ['Temperature', reading.temperature, '°C', 70, 'temperature'],
      ['Water Level', reading.waterLevel, '%', 70, 'water'],
      ['Vibration', reading.vibration, '%', 70, 'vibration'],
      ['Wind Speed', reading.windSpeed, 'km/h', 90, 'wind'],
    ],
    earthquake: [
      ['Smoke', reading.smoke, '%', 70, 'smoke'],
      ['Temperature', reading.temperature, '°C', 70, 'temperature'],
      ['Water Level', reading.waterLevel, '%', 70, 'water'],
      ['Vibration', reading.vibration, '%', 70, 'vibration'],
      ['Wind Speed', reading.windSpeed, 'km/h', 90, 'wind'],
    ],
    cyclone: [
      ['Smoke', reading.smoke, '%', 70, 'smoke'],
      ['Temperature', reading.temperature, '°C', 70, 'temperature'],
      ['Water Level', reading.waterLevel, '%', 70, 'water'],
      ['Vibration', reading.vibration, '%', 70, 'vibration'],
      ['Wind Speed', reading.windSpeed, 'km/h', 90, 'wind'],
    ],
    landslide: [
      ['Smoke', reading.smoke, '%', 70, 'smoke'],
      ['Temperature', reading.temperature, '°C', 70, 'temperature'],
      ['Water Level', reading.waterLevel, '%', 70, 'water'],
      ['Vibration', reading.vibration, '%', 70, 'vibration'],
      ['Wind Speed', reading.windSpeed, 'km/h', 90, 'wind'],
    ],
  }[type];

  return config.map(([label, value, unit, dangerAt, icon]) => ({
    label,
    value: Number(value),
    unit,
    dangerAt: Number(dangerAt),
    icon,
  }));
}

export function escalateScenarioFromSensors(
  scenario: DisasterScenario,
  reading: SensorReading
): DisasterScenario {
  const sensorSeverity = calculateSensorSeverity(scenario.type, reading);

  if (sensorSeverity <= scenario.severity || scenario.severity >= 5) {
    return scenario;
  }

  return simulateDisaster(scenario.type, sensorSeverity);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
