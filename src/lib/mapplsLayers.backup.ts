import type {
  DigitalTwinState,
  LiveRoad,
} from './digitalTwinState';

import { campusToGeo } from '../data/digitalTwinModel';

interface MapplsLayerInput {
  map: any;
  mapplsObject: any;
  twinState: DigitalTwinState;
}

/*
 * ---------------------------------------------------------
 * MARKER
 * ---------------------------------------------------------
 *
 * Mappls v3 documents Marker as a constructor:
 *
 * new mappls.Marker({...})
 *
 */

function addMarker(
  mapplsObject: any,
  map: any,
  position: {
    lat: number;
    lng: number;
  },
  html: string,
  popupHtml: string
) {
  if (!mapplsObject?.Marker) {
    console.warn(
      'Mappls Marker constructor unavailable'
    );

    return null;
  }

  try {
    const Marker = mapplsObject.Marker;

    return Marker({
      map,
      position,
      html,
      popupHtml,
      popupOptions: {
        autoClose: true,
        maxWidth: 320,
      },
    });
  } catch (error) {
    console.warn(
      'Mappls marker failed:',
      error
    );

    return null;
  }
}


/*
 * ---------------------------------------------------------
 * ROAD COLORS
 * ---------------------------------------------------------
 */

function roadColor(
  road: LiveRoad
) {
  if (road.blocked) {
    return '#ef4444';
  }

  if (road.visual === 'critical') {
    return '#dc2626';
  }

  if (road.visual === 'congested') {
    return '#f59e0b';
  }

  if (
    road.onEvacuationRoute ||
    road.visual === 'route'
  ) {
    return '#38bdf8';
  }

  return '#06b6d4';
}


/*
 * ---------------------------------------------------------
 * POLYLINE
 * ---------------------------------------------------------
 *
 * Mappls v3 documents Polyline as:
 *
 * new mappls.Polyline({...})
 *
 */

function addPolyline(
  mapplsObject: any,
  map: any,
  path: {
    lat: number;
    lng: number;
  }[],
  road: LiveRoad,
  popupHtml: string
) {
  if (
    !mapplsObject?.Polyline ||
    path.length < 2
  ) {
    return null;
  }

  try {
    const Polyline =
      mapplsObject.Polyline;

    return Polyline({
      map,
      path,

      strokeColor:
        roadColor(road),

      strokeOpacity:
        road.blocked
          ? 0.95
          : 0.9,

      strokeWeight:
        road.blocked ||
        road.onEvacuationRoute
          ? 9
          : road.visual ===
                'congested' ||
            road.visual ===
                'critical'
            ? 7
            : 5,

      zIndex:
        road.blocked
          ? 50
          : road.onEvacuationRoute
            ? 40
            : 20,

      popupHtml,

      popupOptions: {
        offset: {
          bottom: [0, -20],
        },
      },
    });
  } catch (error) {
    console.warn(
      'Mappls polyline failed:',
      error
    );

    return null;
  }
}


/*
 * ---------------------------------------------------------
 * POPULATION COLOR
 * ---------------------------------------------------------
 */

function populationColor(
  population: number
) {
  if (population >= 700) {
    return '#ef4444';
  }

  if (population >= 400) {
    return '#f59e0b';
  }

  return '#22c55e';
}


/*
 * ---------------------------------------------------------
 * MAIN RESQTWIN LAYERS
 * ---------------------------------------------------------
 */

export function addAllMapplsLayers({
  map,
  mapplsObject,
  twinState,
}: MapplsLayerInput) {

  const buildingLayers: any[] = [];
  const roadLayers: any[] = [];
  const exitLayers: any[] = [];
  const assemblyLayers: any[] = [];
  const crowdLayers: any[] = [];
  const routeLayers: any[] = [];
  const populationLayers: any[] = [];


  console.log(
    'RESQTWIN: drawing Mappls overlays',
    {
      buildings:
        twinState.buildings.length,

      roads:
        twinState.roads.length,

      exits:
        twinState.exits.length,

      assembly:
        twinState.assemblyPoints.length,

      people:
        twinState.people.length,
    }
  );


  /*
   * -------------------------------------------------------
   * BUILDINGS
   * -------------------------------------------------------
   */

  twinState.buildings.forEach(
    (building) => {

      const population =
        building.occupants ?? 0;

      const popColor =
        populationColor(
          population
        );


      /*
       * Building label.
       */

      const buildingMarker =
        addMarker(
          mapplsObject,
          map,
          building.geoCenter,

          `
            <div style="
              transform:translate(-50%,-100%);
              padding:7px 11px;
              border-radius:10px;

              background:${
                building.affected
                  ? 'rgba(127,29,29,.98)'
                  : 'rgba(15,23,42,.97)'
              };

              border:3px solid ${
                building.affected
                  ? '#ef4444'
                  : '#22d3ee'
              };

              color:white;

              font:
                900 11px Arial,
                sans-serif;

              white-space:nowrap;

              box-shadow:
                0 5px 18px
                rgba(0,0,0,.55);
            "
            >
              ${
                building.affected
                  ? '🔥 AFFECTED'
                  : '🏢 BUILDING'
              }
              ${building.name}
            </div>
          `,

          `
            <div style="
              padding:13px;
              min-width:230px;
              font-family:Arial,sans-serif;
            ">

              <strong>
                ${building.name}
              </strong>

              (${building.id})

              <br/><br/>

              👥 Occupants:
              <b>${population}</b>

              <br/>

              🏢 Capacity:
              <b>${building.capacity}</b>

              <br/>

              ⚠️ Risk:
              <b>
                ${building.riskScore}/100
                ·
                ${building.riskLevel}
              </b>

              <br/><br/>

              <b style="
                color:${
                  building.affected
                    ? '#dc2626'
                    : '#059669'
                };
              ">

                ${
                  building.affected
                    ? '🔥 AFFECTED BUILDING'
                    : '✓ BUILDING SAFE'
                }

              </b>

            </div>
          `
        );


      if (buildingMarker) {
        buildingLayers.push(
          buildingMarker
        );
      }


      /*
       * Population badge.
       */

      const populationMarker =
        addMarker(
          mapplsObject,
          map,
          building.geoCenter,

          `
            <div style="
              transform:
                translate(-50%,10px);

              width:42px;
              height:42px;

              border-radius:50%;

              display:flex;
              align-items:center;
              justify-content:center;

              background:${popColor};

              border:
                3px solid white;

              color:white;

              font:
                900 12px Arial,
                sans-serif;

              box-shadow:
                0 0 0 4px
                  rgba(15,23,42,.35),
                0 5px 15px
                  rgba(0,0,0,.55);
            ">
              ${population}
            </div>
          `,

          `
            <div style="
              padding:12px;
              font-family:Arial,sans-serif;
            ">

              <strong>
                👥 POPULATION
              </strong>

              <br/><br/>

              Building:
              <b>${building.name}</b>

              <br/>

              People:
              <b>${population}</b>

              <br/>

              Capacity:
              <b>${building.capacity}</b>

              <br/><br/>

              ${
                building.affected
                  ? '<b style="color:#dc2626">🔥 EVACUATION REQUIRED</b>'
                  : '<b style="color:#059669">✓ POPULATION SAFE</b>'
              }

            </div>
          `
        );


      if (populationMarker) {
        populationLayers.push(
          populationMarker
        );
      }
    }
  );


  /*
   * -------------------------------------------------------
   * ROADS
   * -------------------------------------------------------
   */

  twinState.roads.forEach(
    (road) => {

      if (
        road.geoPath.length < 2
      ) {
        return;
      }


      const line =
        addPolyline(
          mapplsObject,
          map,
          road.geoPath,
          road,

          `
            <div style="
              padding:13px;
              min-width:230px;
              font-family:Arial,sans-serif;
            ">

              <strong>
                🛣️ ${road.name}
              </strong>

              (${road.id})

              <br/><br/>

              Capacity:
              <b>${road.capacity}</b>

              <br/>

              Congestion:
              <b>
                ${Math.round(
                  road.congestion
                )}%
              </b>

              <br/>

              People:
              <b>
                ${road.peopleOnRoute}
              </b>

              <br/><br/>

              <b style="
                color:${
                  road.blocked
                    ? '#dc2626'
                    : road.onEvacuationRoute
                      ? '#0284c7'
                      : road.visual ===
                          'congested'
                        ? '#d97706'
                        : '#059669'
                };
              ">

                ${
                  road.blocked
                    ? '🔴 ROAD BLOCKED'
                    : road.onEvacuationRoute
                      ? '🔵 ACTIVE EVACUATION ROUTE'
                      : road.visual ===
                          'congested'
                        ? '🟡 CONGESTED ROAD'
                        : '🟢 ROAD OPEN'
                }

              </b>

            </div>
          `
        );


      if (line) {
        roadLayers.push(line);
      }
    }
  );


  /*
   * -------------------------------------------------------
   * EVACUATION ROUTE
   * -------------------------------------------------------
   */

  twinState.roads
    .filter(
      (road) =>
        road.onEvacuationRoute &&
        !road.blocked
    )
    .forEach(
      (road) => {

        if (
          road.geoPath.length < 2
        ) {
          return;
        }


        try {

          const Polyline =
            mapplsObject.Polyline;


          if (!Polyline) {
            return;
          }


          /*
           * Wide route glow.
           */

          const glow =
            Polyline({
              map,

              path:
                road.geoPath,

              strokeColor:
                '#38bdf8',

              strokeOpacity:
                0.35,

              strokeWeight:
                15,

              zIndex:
                35,
            });


          if (glow) {
            routeLayers.push(
              glow
            );
          }


          /*
           * Bright route line.
           */

          const routeLine =
            Polyline({
              map,

              path:
                road.geoPath,

              strokeColor:
                '#22d3ee',

              strokeOpacity:
                1,

              strokeWeight:
                7,

              zIndex:
                45,
            });


          if (routeLine) {
            routeLayers.push(
              routeLine
            );
          }

        } catch (error) {

          console.warn(
            'Mappls evacuation route failed:',
            error
          );

        }
      }
    );


  /*
   * -------------------------------------------------------
   * EMERGENCY EXITS
   * -------------------------------------------------------
   */

  twinState.exits.forEach(
    (exit) => {

      const marker =
        addMarker(
          mapplsObject,
          map,
          exit.geo,

          `
            <div style="
              transform:
                translate(-50%,-100%);

              padding:7px 11px;

              border-radius:9px;

              background:${
                exit.blocked
                  ? 'rgba(127,29,29,.98)'
                  : 'rgba(6,78,59,.98)'
              };

              border:3px solid ${
                exit.blocked
                  ? '#ef4444'
                  : '#34d399'
              };

              color:white;

              font:
                900 11px Arial,
                sans-serif;

              white-space:nowrap;

              box-shadow:
                0 5px 16px
                rgba(0,0,0,.5);
            ">

              ${
                exit.blocked
                  ? '🔴 BLOCKED'
                  : '🚪 EXIT'
              }

              ${exit.name}

            </div>
          `,

          `
            <div style="
              padding:13px;
              font-family:Arial,sans-serif;
            ">

              <strong>
                🚪 ${exit.name}
              </strong>

              (${exit.id})

              <br/><br/>

              Capacity:
              <b>${exit.capacity}</b>

              <br/>

              Assigned:
              <b>${exit.assignedPeople}</b>

              <br/><br/>

              <b style="
                color:${
                  exit.blocked
                    ? '#dc2626'
                    : '#059669'
                };
              ">

                ${
                  exit.blocked
                    ? '🔴 EXIT BLOCKED'
                    : '🟢 EXIT AVAILABLE'
                }

              </b>

            </div>
          `
        );


      if (marker) {
        exitLayers.push(marker);
      }
    }
  );


  /*
   * -------------------------------------------------------
   * ASSEMBLY POINTS
   * -------------------------------------------------------
   */

  twinState.assemblyPoints.forEach(
    (point) => {

      const marker =
        addMarker(
          mapplsObject,
          map,
          point.geo,

          `
            <div style="
              transform:
                translate(-50%,-100%);

              padding:7px 11px;

              border-radius:9px;

              background:
                rgba(6,78,59,.98);

              border:
                3px solid #34d399;

              color:white;

              font:
                900 11px Arial,
                sans-serif;

              white-space:nowrap;

              box-shadow:
                0 5px 16px
                rgba(0,0,0,.5);
            ">

              🟢 SAFE
              ${point.name}

            </div>
          `,

          `
            <div style="
              padding:13px;
              font-family:Arial,sans-serif;
            ">

              <strong>
                🟢 ${point.name}
              </strong>

              (${point.id})

              <br/><br/>

              Capacity:
              <b>${point.capacity}</b>

              <br/>

              Current:
              <b>
                ${point.currentPopulation}
              </b>

              <br/><br/>

              <b style="
                color:#059669;
              ">
                SAFE ASSEMBLY AREA
              </b>

            </div>
          `
        );


      if (marker) {
        assemblyLayers.push(
          marker
        );
      }
    }
  );


  /*
   * -------------------------------------------------------
   * INDIVIDUAL PEOPLE
   * -------------------------------------------------------
   *
   * Maximum 300 markers to keep
   * Mappls responsive.
   */

  const agents =
    twinState.people;

  const maxVisiblePeople =
    300;

  const sample =
    agents.length >
    maxVisiblePeople

      ? agents.filter(
          (_, index) =>
            index %
              Math.ceil(
                agents.length /
                  maxVisiblePeople
              ) ===
            0
        )

      : agents;


  sample.forEach(
    (agent) => {

      const position =
        campusToGeo(
          agent.x,
          agent.y
        );


      const status =
        agent.status ??
        'evacuating';


      let dotColor =
        '#38bdf8';


      if (
        status === 'trapped'
      ) {
        dotColor =
          '#ef4444';
      } else if (
        status === 'safe'
      ) {
        dotColor =
          '#34d399';
      }


      const marker =
        addMarker(
          mapplsObject,
          map,
          position,

          `
            <div style="
              width:10px;
              height:10px;

              border-radius:50%;

              background:
                ${dotColor};

              border:
                2px solid white;

              box-shadow:
                0 0 7px
                  ${dotColor},
                0 2px 5px
                  rgba(0,0,0,.55);
            ">
            </div>
          `,

          `
            <div style="
              padding:9px;
              font-family:Arial,sans-serif;
            ">

              <b>
                👤 ${agent.id}
              </b>

              <br/><br/>

              Type:
              ${agent.type}

              <br/>

              Risk:
              <b>${agent.risk}</b>

              <br/>

              Status:
              <b>${status}</b>

            </div>
          `
        );


      if (marker) {
        crowdLayers.push(
          marker
        );
      }
    }
  );


  /*
   * -------------------------------------------------------
   * RETURN
   * -------------------------------------------------------
   */

  const result = {
    buildings:
      buildingLayers,

    roads:
      roadLayers,

    exits:
      exitLayers,

    assemblyPoints:
      assemblyLayers,

    crowd:
      crowdLayers,

    routes:
      routeLayers,

    population:
      populationLayers,
  };


  console.log(
    'RESQTWIN: Mappls overlay result',
    {
      buildings:
        result.buildings.length,

      roads:
        result.roads.length,

      exits:
        result.exits.length,

      assembly:
        result.assemblyPoints.length,

      crowd:
        result.crowd.length,

      routes:
        result.routes.length,

      population:
        result.population.length,
    }
  );


  return result;
}
