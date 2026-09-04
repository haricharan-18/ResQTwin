import { DisasterType } from './disasterEngine';

export type LiveSensorReading = {
  smoke: number;
  temperature: number;
  waterLevel: number;
  vibration: number;
  windSpeed: number;
  sensorSeverity: number;
  timestamp: number;
};

export function createLiveSensorReading(
  disasterType: DisasterType,
  severity: number,
  tick = 0
): LiveSensorReading {
  const level = Math.max(1, Math.min(5, Math.round(severity)));
  const wave = Math.sin(tick * 0.55) * 0.08;
  const pulse = Math.sin(tick * 0.31 + 1.2) * 0.05;

  const base = {
    smoke: 8,
    temperature: 29,
    waterLevel: 0.2,
    vibration: 4,
    windSpeed: 12,
  };

  if (disasterType === 'fire') {
    base.smoke = 18 + level * 13;
    base.temperature = 28 + level * 11;
    base.waterLevel = 0.2;
    base.vibration = 4 + level * 1.5;
    base.windSpeed = 12 + level * 4;
  } else if (disasterType === 'flood') {
    base.smoke = 5;
    base.temperature = 27;
    base.waterLevel = 0.6 + level * 0.75;
    base.vibration = 5 + level * 1.5;
    base.windSpeed = 15 + level * 5;
  } else if (disasterType === 'earthquake') {
    base.smoke = 8 + level * 3;
    base.temperature = 29 + level * 2;
    base.waterLevel = 0.3 + level * 0.15;
    base.vibration = 15 + level * 16;
    base.windSpeed = 12 + level * 3;
  } else if (disasterType === 'cyclone') {
    base.smoke = 4;
    base.temperature = 25 - level * 0.8;
    base.waterLevel = 0.5 + level * 0.55;
    base.vibration = 7 + level * 3;
    base.windSpeed = 25 + level * 17;
  } else if (disasterType === 'landslide') {
    base.smoke = 6;
    base.temperature = 26;
    base.waterLevel = 0.7 + level * 0.65;
    base.vibration = 12 + level * 12;
    base.windSpeed = 15 + level * 4;
  }

  const smoke = clamp(base.smoke * (1 + wave), 0, 100);
  const temperature = Math.max(0, base.temperature * (1 + pulse));
  const waterLevel = Math.max(0, base.waterLevel * (1 + wave));
  const vibration = clamp(base.vibration * (1 + pulse), 0, 100);
  const windSpeed = Math.max(0, base.windSpeed * (1 + wave));

  const sensorSeverity = calculateSensorSeverity(
    disasterType,
    smoke,
    temperature,
    waterLevel,
    vibration,
    windSpeed
  );

  return {
    smoke: round(smoke, 1),
    temperature: round(temperature, 1),
    waterLevel: round(waterLevel, 2),
    vibration: round(vibration, 1),
    windSpeed: round(windSpeed, 1),
    sensorSeverity,
    timestamp: Date.now(),
  };
}

function calculateSensorSeverity(
  disasterType: DisasterType,
  smoke: number,
  temperature: number,
  waterLevel: number,
  vibration: number,
  windSpeed: number
): number {
  let score = 1;

  if (smoke >= 65) score++;
  else if (smoke >= 40) score += 0.5;

  if (temperature >= 70) score++;
  else if (temperature >= 50) score += 0.5;

  if (waterLevel >= 3.5) score++;
  else if (waterLevel >= 2.2) score += 0.5;

  if (vibration >= 65) score++;
  else if (vibration >= 40) score += 0.5;

  if (windSpeed >= 90) score++;
  else if (windSpeed >= 60) score += 0.5;

  const disasterSignal =
    disasterType === 'fire'
      ? smoke * 0.45 + temperature * 0.35
      : disasterType === 'flood'
        ? waterLevel * 18 + windSpeed * 0.15
        : disasterType === 'earthquake'
          ? vibration * 0.7 + smoke * 0.1
          : disasterType === 'cyclone'
            ? windSpeed * 0.65 + waterLevel * 5
            : waterLevel * 0.25 + vibration * 0.55;

  if (disasterSignal >= 55) score += 1;
  else if (disasterSignal >= 35) score += 0.5;

  return Math.max(1, Math.min(5, Math.round(score)));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

