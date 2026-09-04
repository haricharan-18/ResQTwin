export type MapplsCoordinate = {
  lat: number;
  lng: number;
};

export type CampusCoordinateConfig = {
  buildings: Record<string, MapplsCoordinate | null>;
  roads: Record<string, MapplsCoordinate[] | null>;
  exits: Record<string, MapplsCoordinate | null>;
  assemblyPoints: Record<string, MapplsCoordinate | null>;
  hospitals: Record<string, MapplsCoordinate | null>;
};

export const SNIST_CAMPUS_CENTER: MapplsCoordinate = {
  lat: 17.45585,
  lng: 78.66667,
};

/*
 * Real geographic coordinates only.
 *
 * These are deliberately separate from the simulated
 * campus x/y coordinates used by the disaster engine.
 */
export const SNIST_COORDINATES: CampusCoordinateConfig = {
  buildings: {},
  roads: {},
  exits: {},
  assemblyPoints: {},
  hospitals: {},
};

const STORAGE_KEY =
  'resqtwin-mappls-coordinates-v1';

function emptyConfig(): CampusCoordinateConfig {
  return {
    buildings: {},
    roads: {},
    exits: {},
    assemblyPoints: {},
    hospitals: {},
  };
}

/*
 * Load previously calibrated coordinates from the browser.
 */
export function loadMapplsCoordinates(): CampusCoordinateConfig {
  try {
    const raw =
      window.localStorage.getItem(
        STORAGE_KEY
      );

    if (!raw) {
      return emptyConfig();
    }

    const parsed =
      JSON.parse(raw);

    return {
      buildings:
        parsed?.buildings ?? {},
      roads:
        parsed?.roads ?? {},
      exits:
        parsed?.exits ?? {},
      assemblyPoints:
        parsed?.assemblyPoints ?? {},
      hospitals:
        parsed?.hospitals ?? {},
    };
  } catch {
    return emptyConfig();
  }
}

/*
 * Save the calibrated geographic dataset locally.
 *
 * This makes the calibration work offline after it has
 * been completed once in the browser.
 */
export function saveMapplsCoordinates(
  config: CampusCoordinateConfig
): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(config)
    );
  } catch {
    // Ignore storage failures.
  }
}

/*
 * Update one verified geographic feature.
 */
export function setMapplsCoordinate(
  category:
    | 'buildings'
    | 'roads'
    | 'exits'
    | 'assemblyPoints'
    | 'hospitals',
  id: string,
  coordinate:
    | MapplsCoordinate
    | MapplsCoordinate[]
): CampusCoordinateConfig {
  const config =
    loadMapplsCoordinates();

  if (category === 'roads') {
    config.roads[id] =
      coordinate as MapplsCoordinate[];

    saveMapplsCoordinates(config);

    return config;
  }

  config[category][id] =
    coordinate as MapplsCoordinate;

  saveMapplsCoordinates(config);

  return config;
}

export function clearMapplsCoordinates(): void {
  try {
    window.localStorage.removeItem(
      STORAGE_KEY
    );
  } catch {
    // Ignore.
  }
}

export function createCoordinateAdapter(
  config?: CampusCoordinateConfig
) {
  const activeConfig =
    config ?? loadMapplsCoordinates();

  return {
    building(
      id: string
    ): MapplsCoordinate | null {
      return (
        activeConfig.buildings[id] ??
        null
      );
    },

    road(
      id: string
    ): MapplsCoordinate[] | null {
      return (
        activeConfig.roads[id] ??
        null
      );
    },

    exit(
      id: string
    ): MapplsCoordinate | null {
      return (
        activeConfig.exits[id] ??
        null
      );
    },

    assemblyPoint(
      id: string
    ): MapplsCoordinate | null {
      return (
        activeConfig.assemblyPoints[id] ??
        null
      );
    },

    hospital(
      id: string
    ): MapplsCoordinate | null {
      return (
        activeConfig.hospitals[id] ??
        null
      );
    },
  };
}

export const mapplsCoordinateAdapter =
  createCoordinateAdapter();

export function hasCoordinate(
  coordinate:
    | MapplsCoordinate
    | null
): coordinate is MapplsCoordinate {
  return (
    coordinate !== null &&
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng)
  );
}