import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

import {
  buildings,
  exits,
  assemblyPoints,
  roads
} from '../data/campusData';

import { DisasterScenario } from '../lib/disasterEngine';

import {
  CrowdSimulation,
  CrowdAgent
} from '../lib/crowdEngine';


/* =========================================================
   MAP COORDINATES
========================================================= */

function to3D(x: number, y: number): [number, number] {
  return [
    x / 50 - 10,
    y / 50 - 6
  ];
}


const junctions: Record<string, [number, number]> = {
  j1: [160, 280],
  j2: [520, 280],
  j3: [760, 120],
  j4: [850, 320],
  j5: [580, 520],
  j6: [800, 520]
};


/* =========================================================
   COLORS
========================================================= */

function getDisasterColor(
  type: DisasterScenario['type']
) {
  switch (type) {
    case 'fire':
      return '#ef4444';

    case 'flood':
      return '#2563eb';

    case 'earthquake':
      return '#f97316';

    case 'cyclone':
      return '#a855f7';

    case 'landslide':
      return '#92400e';

    default:
      return '#ef4444';
  }
}


/* =========================================================
   BUILDING
========================================================= */

function Building3D({
  x,
  y,
  width,
  height,
  name,
  affected,
  disasterType
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  affected: boolean;
  disasterType: DisasterScenario['type'];
}) {

  const [px, pz] = to3D(x, y);

  const disasterColor =
    getDisasterColor(disasterType);

  return (
    <group position={[px, 0, pz]}>

      <mesh
        position={[
          0,
          height / 100,
          0
        ]}
      >
        <boxGeometry
          args={[
            width / 50,
            height / 50,
            height / 50
          ]}
        />

        <meshStandardMaterial
          color={
            affected
              ? disasterColor
              : '#334155'
          }
          emissive={
            affected
              ? disasterColor
              : '#000000'
          }
          emissiveIntensity={
            affected
              ? 0.35
              : 0
          }
        />
      </mesh>


      <mesh
        position={[
          0,
          height / 50 + 0.05,
          0
        ]}
      >
        <boxGeometry
          args={[
            width / 50 + 0.05,
            0.08,
            height / 50 + 0.05
          ]}
        />

        <meshStandardMaterial
          color={
            affected
              ? disasterColor
              : '#475569'
          }
        />
      </mesh>


      <Text
        position={[
          0,
          height / 50 + 0.35,
          0
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        fontSize={0.22}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

    </group>
  );
}


/* =========================================================
   ROAD
========================================================= */

function Road3D({
  road,
  blocked,
  activeRoute,
  congestion
}: {
  road: typeof roads[number];
  blocked: boolean;
  activeRoute: boolean;
  congestion: number;
}) {

  const from = junctions[road.from];
  const to = junctions[road.to];

  if (!from || !to) {
    return null;
  }


  const [x1, z1] =
    to3D(
      from[0],
      from[1]
    );

  const [x2, z2] =
    to3D(
      to[0],
      to[1]
    );


  const midX =
    (x1 + x2) / 2;

  const midZ =
    (z1 + z2) / 2;


  const dx =
    x2 - x1;

  const dz =
    z2 - z1;


  const length =
    Math.sqrt(
      dx * dx +
      dz * dz
    );


  const angle =
    Math.atan2(
      dz,
      dx
    );


  let color = '#64748b';
  let emissive = '#000000';
  let emissiveIntensity = 0;

  if (blocked) {

    color = '#ef4444';
    emissive = '#ef4444';
    emissiveIntensity = 0.7;

  } else if (congestion >= 0.8) {

    color = '#f97316';
    emissive = '#f97316';
    emissiveIntensity = 0.65;

  } else if (congestion >= 0.6) {

    color = '#eab308';
    emissive = '#eab308';
    emissiveIntensity = 0.5;

  } else if (activeRoute) {

    color = '#38bdf8';
    emissive = '#0284c7';
    emissiveIntensity = 0.9;

  }


  return (
    <group
      position={[
        midX,
        0.04,
        midZ
      ]}
      rotation={[
        0,
        -angle,
        0
      ]}
    >

      {/* Main road */}

      <mesh>

        <boxGeometry
          args={[
            length,
            0.05,
            blocked
              ? 0.3
              : activeRoute
              ? 0.27
              : 0.22
          ]}
        />

        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={
            emissiveIntensity
          }
        />

      </mesh>


      {/* Route center line */}

      {activeRoute && !blocked && (

        <mesh
          position={[
            0,
            0.035,
            0
          ]}
        >

          <boxGeometry
            args={[
              length * 0.92,
              0.025,
              0.055
            ]}
          />

          <meshStandardMaterial
            color="#e0f2fe"
            emissive="#38bdf8"
            emissiveIntensity={1}
          />

        </mesh>

      )}


      {/* Blocked label */}

      {blocked && (

        <Text
          position={[
            0,
            0.12,
            0
          ]}
          rotation={[
            -Math.PI / 2,
            0,
            0
          ]}
          fontSize={0.18}
          color="#fecaca"
          anchorX="center"
          anchorY="middle"
        >
          BLOCKED
        </Text>

      )}

    </group>
  );
}


/* =========================================================
   ROAD ARROW
========================================================= */

function RouteArrow({
  road
}: {
  road: typeof roads[number];
}) {

  const from = junctions[road.from];
  const to = junctions[road.to];

  if (!from || !to) {
    return null;
  }

  const [x1, z1] =
    to3D(
      from[0],
      from[1]
    );

  const [x2, z2] =
    to3D(
      to[0],
      to[1]
    );


  const x =
    x1 * 0.35 +
    x2 * 0.65;

  const z =
    z1 * 0.35 +
    z2 * 0.65;


  const angle =
    Math.atan2(
      z2 - z1,
      x2 - x1
    );


  return (
    <Text
      position={[
        x,
        0.13,
        z
      ]}
      rotation={[
        -Math.PI / 2,
        0,
        -angle
      ]}
      fontSize={0.24}
      color="#e0f2fe"
      anchorX="center"
      anchorY="middle"
    >
      ➜
    </Text>
  );
}


/* =========================================================
   JUNCTION
========================================================= */

function Junction3D({
  position
}: {
  position: [number, number];
}) {

  const [x, z] =
    to3D(
      position[0],
      position[1]
    );

  return (
    <mesh
      position={[
        x,
        0.08,
        z
      ]}
    >

      <cylinderGeometry
        args={[
          0.09,
          0.09,
          0.08,
          12
        ]}
      />

      <meshStandardMaterial
        color="#94a3b8"
      />

    </mesh>
  );
}


/* =========================================================
   EXIT
========================================================= */

function Exit3D({
  x,
  y,
  blocked,
  name
}: {
  x: number;
  y: number;
  blocked: boolean;
  name: string;
}) {

  const [px, pz] =
    to3D(x, y);

  return (
    <group
      position={[
        px,
        0.16,
        pz
      ]}
    >

      <mesh>

        <cylinderGeometry
          args={[
            blocked
              ? 0.22
              : 0.15,
            blocked
              ? 0.22
              : 0.15,
            0.3,
            20
          ]}
        />

        <meshStandardMaterial
          color={
            blocked
              ? '#ef4444'
              : '#22c55e'
          }
          emissive={
            blocked
              ? '#ef4444'
              : '#22c55e'
          }
          emissiveIntensity={0.8}
        />

      </mesh>


      <Text
        position={[
          0,
          0.35,
          0
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        fontSize={0.18}
        color={
          blocked
            ? '#fca5a5'
            : '#86efac'
        }
        anchorX="center"
        anchorY="middle"
      >
        {blocked
          ? `${name} BLOCKED`
          : name}
      </Text>

    </group>
  );
}


/* =========================================================
   ASSEMBLY POINT
========================================================= */

function AssemblyPoint3D({
  x,
  y,
  name
}: {
  x: number;
  y: number;
  name: string;
}) {

  const [px, pz] =
    to3D(x, y);

  return (
    <group
      position={[
        px,
        0.1,
        pz
      ]}
    >

      <mesh>

        <cylinderGeometry
          args={[
            0.35,
            0.35,
            0.12,
            32
          ]}
        />

        <meshStandardMaterial
          color="#eab308"
          emissive="#eab308"
          emissiveIntensity={0.35}
        />

      </mesh>


      <Text
        position={[
          0,
          0.2,
          0
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        fontSize={0.16}
        color="#fde68a"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

    </group>
  );
}


/* =========================================================
   CROWD AGENT
========================================================= */

function CrowdAgent3D({
  agent
}: {
  agent: CrowdAgent;
}) {

  const [px, pz] =
    to3D(
      agent.x,
      agent.y
    );


  const color =
    agent.status === 'safe'
      ? '#22c55e'
      : agent.status === 'trapped'
      ? '#ef4444'
      : '#38bdf8';


  return (
    <mesh
      position={[
        px,
        0.16,
        pz
      ]}
    >

      <sphereGeometry
        args={[
          0.055,
          7,
          7
        ]}
      />

      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.9}
      />

    </mesh>
  );
}


/* =========================================================
   SMOOTH CROWD LAYER
========================================================= */

function CrowdLayer({
  simulation
}: {
  simulation: CrowdSimulation;
}) {

  const groupRef =
    useRef<THREE.Group>(null);

  useFrame((_, delta) => {

    const group =
      groupRef.current;

    if (!group) {
      return;
    }


    const factor =
      Math.min(
        1,
        delta * 5
      );


    group.children.forEach(
      (child, index) => {

        const agent =
          simulation.agents[index];

        if (!agent) {
          return;
        }


        const [
          targetX,
          targetZ
        ] = to3D(
          agent.x,
          agent.y
        );


        child.position.x +=
          (
            targetX -
            child.position.x
          ) *
          factor;


        child.position.z +=
          (
            targetZ -
            child.position.z
          ) *
          factor;

      }
    );

  });


  return (
    <group ref={groupRef}>

      {simulation.agents.map(
        agent => (

          <CrowdAgent3D
            key={agent.id}
            agent={agent}
          />

        )
      )}

    </group>
  );
}


/* =========================================================
   DISASTER EFFECT
========================================================= */

function DisasterEffect({
  scenario
}: {
  scenario: DisasterScenario;
}) {

  const color =
    getDisasterColor(
      scenario.type
    );


  return (
    <>

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        position={[
          0,
          0.02,
          0
        ]}
      >

        <ringGeometry
          args={[
            5.5,
            5.65,
            64
          ]}
        />

        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />

      </mesh>


      <Text
        position={[
          0,
          0.06,
          -6.8
        ]}
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {scenario.type.toUpperCase()}
        {' • '}
        SEVERITY {scenario.severity}/5
      </Text>

    </>
  );
}


/* =========================================================
   ROUTE ANALYSIS
========================================================= */

function getRoadAnalysis(
  simulation: CrowdSimulation
) {

  const usage: Record<string, number> = {};

  simulation.agents.forEach(
    agent => {

      if (
        agent.status !== 'evacuating'
      ) {
        return;
      }

      agent.route.forEach(
        roadId => {

          usage[roadId] =
            (usage[roadId] || 0) + 1;

        }
      );

    }
  );


  const analysis: Record<
    string,
    {
      congestion: number;
      activeRoute: boolean;
      bottleneck: string | null;
    }
  > = {};


  roads.forEach(road => {

    const people =
      usage[road.id] || 0;

    const congestion =
      Math.min(
        1,
        people / road.capacity
      );


    const bottleneck =
      simulation.bottlenecks.find(
        item =>
          item.roadId === road.id
      );


    analysis[road.id] = {
      congestion,
      activeRoute:
        people > 0,
      bottleneck:
        bottleneck
          ? bottleneck.severity
          : null
    };

  });


  return analysis;
}


/* =========================================================
   CAMPUS SCENE
========================================================= */

function CampusScene({
  scenario,
  crowdSimulation
}: {
  scenario: DisasterScenario;
  crowdSimulation: CrowdSimulation;
}) {

  const roadAnalysis =
    useMemo(
      () =>
        getRoadAnalysis(
          crowdSimulation
        ),
      [crowdSimulation]
    );


  return (
    <>

      {/* Lighting */}

      <ambientLight
        intensity={1.4}
      />

      <directionalLight
        position={[
          5,
          10,
          5
        ]}
        intensity={2}
      />


      {/* Ground */}

      <mesh
        rotation={[
          -Math.PI / 2,
          0,
          0
        ]}
        position={[
          0,
          -0.05,
          0
        ]}
      >

        <planeGeometry
          args={[
            24,
            15
          ]}
        />

        <meshStandardMaterial
          color="#0f172a"
        />

      </mesh>


      {/* Grid */}

      <gridHelper
        args={[
          24,
          24,
          '#1e293b',
          '#1e293b'
        ]}
      />


      {/* Roads */}

      {roads.map(
        road => {

          const info =
            roadAnalysis[road.id];

          return (
            <React.Fragment
              key={road.id}
            >

              <Road3D
                road={road}
                blocked={
                  scenario.blockedRoads.includes(
                    road.id
                  )
                }
                activeRoute={
                  info.activeRoute
                }
                congestion={
                  info.congestion
                }
              />


              {info.activeRoute &&
                !scenario.blockedRoads.includes(
                  road.id
                ) && (

                <RouteArrow
                  road={road}
                />

              )}

            </React.Fragment>
          );

        }
      )}


      {/* Junctions */}

      {Object.values(
        junctions
      ).map(
        (position, index) => (

          <Junction3D
            key={index}
            position={position}
          />

        )
      )}


      {/* Buildings */}

      {buildings.map(
        building => (

          <Building3D
            key={building.id}
            x={building.x}
            y={building.y}
            width={building.width}
            height={building.height}
            name={building.name}
            affected={
              scenario.affectedBuildings.includes(
                building.id
              )
            }
            disasterType={
              scenario.type
            }
          />

        )
      )}


      {/* Exits */}

      {exits.map(
        exit => (

          <Exit3D
            key={exit.id}
            x={exit.x}
            y={exit.y}
            name={exit.name}
            blocked={
              scenario.blockedExits.includes(
                exit.id
              )
            }
          />

        )
      )}


      {/* Assembly points */}

      {assemblyPoints.map(
        point => (

          <AssemblyPoint3D
            key={point.id}
            x={point.x}
            y={point.y}
            name={point.name}
          />

        )
      )}


      {/* Disaster */}

      <DisasterEffect
        scenario={scenario}
      />


      {/* Crowd */}

      <CrowdLayer
        simulation={
          crowdSimulation
        }
      />


      {/* Camera */}

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={7}
        maxDistance={30}
        maxPolarAngle={
          Math.PI / 2.1
        }
      />

    </>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

interface DigitalTwin3DProps {
  scenario?: DisasterScenario;
  crowdSimulation?: CrowdSimulation;
}


export default function DigitalTwin3D({
  scenario,
  crowdSimulation
}: DigitalTwin3DProps) {

  const activeScenario =
    scenario ??
    ({
      type: 'fire',
      severity: 3,
      affectedBuildings: [],
      blockedRoads: [],
      blockedExits: [],
      zoneRisks: []
    } as DisasterScenario);


  const activeCrowd =
    crowdSimulation ??
    ({
      agents: [],
      bottlenecks: [],
      totalPeople: 0,
      evacuating: 0,
      safe: 0,
      trapped: 0,
      averageCongestion: 0
    } as CrowdSimulation);


  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-slate-700 bg-slate-950 relative">


      {/* STATUS */}

      <div className="absolute top-4 left-4 z-10 rounded-lg bg-slate-950/90 backdrop-blur px-4 py-3 border border-slate-700">

        <div className="text-xs text-slate-400 uppercase">
          3D Digital Twin • Live
        </div>


        <div className="text-sm font-bold text-white capitalize">

          {activeScenario.type}

          {' '}

          <span className="text-red-400">
            Severity {activeScenario.severity}/5
          </span>

        </div>


        <div className="text-xs text-slate-400 mt-1">

          👥 {activeCrowd.totalPeople}
          {' '}people

          {' • '}

          🟢 {activeCrowd.safe}
          {' '}safe

          {' • '}

          🔵 {activeCrowd.evacuating}
          {' '}moving

          {' • '}

          🔴 {activeCrowd.trapped}
          {' '}trapped

        </div>


        <div className="text-xs text-sky-300 mt-2">
          🛣️ Live evacuation network
        </div>

      </div>


      {/* ROUTE LEGEND */}

      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-slate-950/90 backdrop-blur px-4 py-3 border border-slate-700">

        <div className="text-xs font-semibold text-white mb-2">
          Simulation Legend
        </div>


        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300">

          <span>
            🟢 Safe
          </span>

          <span>
            🔵 Evacuating
          </span>

          <span>
            🔴 Trapped
          </span>

          <span>
            🔵 Active Route
          </span>

          <span>
            🟡 Congested
          </span>

          <span>
            🟠 Bottleneck
          </span>

          <span>
            🚧 Blocked
          </span>

          <span>
            🟡 Assembly
          </span>

        </div>

      </div>


      {/* CANVAS */}

      <Canvas
        camera={{
          position: [
            0,
            12,
            14
          ],
          fov: 50
        }}
        dpr={[
          1,
          1.5
        ]}
      >

        <CampusScene
          scenario={
            activeScenario
          }
          crowdSimulation={
            activeCrowd
          }
        />

      </Canvas>

    </div>
  );
}