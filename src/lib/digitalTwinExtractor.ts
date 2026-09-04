import {
  DIGITAL_TWIN_CAMPUS,
  createCanonicalCampus,
  type DigitalTwinCampus,
} from '../data/digitalTwinModel';

export type DigitalTwinSource =
  | { kind: 'structured' }
  | {
      kind: 'gltf';
      /**
       * Reserved for a future GLB/GLTF campus.
       * No mesh file is present in this repository, so this
       * source is not used at runtime.
       */
      url?: string;
      objectNameMap?: Record<string, string>;
    };

/**
 * Semantic feature extraction for the Digital Twin.
 *
 * Today the campus is a structured model (buildings, roads,
 * exits, assembly points, junctions, zones). There is no GLB
 * in the repo, so we do not invent mesh-name parsing.
 *
 * When a real GLTF campus is added, plug it in here by matching
 * object names/metadata onto the same stable IDs (b1, r1, e1, …).
 */
export function extractDigitalTwinFeatures(
  source: DigitalTwinSource = { kind: 'structured' }
): DigitalTwinCampus {
  if (source.kind === 'gltf') {
    return extractFromGltfPlaceholder(source);
  }

  return DIGITAL_TWIN_CAMPUS;
}

function extractFromGltfPlaceholder(
  _source: Extract<DigitalTwinSource, { kind: 'gltf' }>
): DigitalTwinCampus {
  /*
   * Intentional fallback: without an actual GLB/GLTF asset we
   * keep the structured campus as the semantic source of truth
   * so 2D and 3D IDs stay stable.
   */
  return createCanonicalCampus();
}

export function getCampusFeatureById(
  campus: DigitalTwinCampus,
  id: string
) {
  return (
    campus.buildings.find((item) => item.id === id) ??
    campus.roads.find((item) => item.id === id) ??
    campus.exits.find((item) => item.id === id) ??
    campus.assemblyPoints.find((item) => item.id === id) ??
    campus.junctions.find((item) => item.id === id) ??
    campus.zones.find((item) => item.id === id) ??
    null
  );
}
