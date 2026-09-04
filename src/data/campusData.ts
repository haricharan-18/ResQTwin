export type Building = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  occupants: number;
  risk: number;
};

export type Exit = {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
  status: 'open' | 'blocked';
};

export type Road = {
  id: string;
  name: string;
  from: string;
  to: string;
  distance: number;
  capacity: number;
  blocked: boolean;
};

export type AssemblyPoint = {
  id: string;
  name: string;
  x: number;
  y: number;
  capacity: number;
};

export type CampusZone = {
  id: string;
  name: string;
  risk: number;
  population: number;
};

export type CampusPerson = {
  id: string;
  type: 'student' | 'staff' | 'visitor';
  x: number;
  y: number;
  zone: string;
  risk: number;
  status: 'safe' | 'evacuating' | 'trapped';
};


/* =========================================================
   BUILDINGS
========================================================= */

export const buildings: Building[] = [
  {
    id: 'b1',
    name: 'Engineering Block',
    x: 120,
    y: 100,
    width: 220,
    height: 130,
    capacity: 800,
    occupants: 620,
    risk: 35
  },
  {
    id: 'b2',
    name: 'Science Block',
    x: 430,
    y: 90,
    width: 200,
    height: 140,
    capacity: 700,
    occupants: 510,
    risk: 42
  },
  {
    id: 'b3',
    name: 'Library',
    x: 720,
    y: 110,
    width: 180,
    height: 120,
    capacity: 500,
    occupants: 280,
    risk: 25
  },
  {
    id: 'b4',
    name: 'Admin Block',
    x: 180,
    y: 330,
    width: 190,
    height: 120,
    capacity: 350,
    occupants: 210,
    risk: 20
  },
  {
    id: 'b5',
    name: 'Student Hostel',
    x: 470,
    y: 320,
    width: 220,
    height: 180,
    capacity: 1000,
    occupants: 850,
    risk: 55
  },
  {
    id: 'b6',
    name: 'Sports Complex',
    x: 760,
    y: 340,
    width: 190,
    height: 150,
    capacity: 600,
    occupants: 160,
    risk: 18
  }
];


/* =========================================================
   EMERGENCY EXITS
========================================================= */

export const exits: Exit[] = [
  {
    id: 'e1',
    name: 'North Gate',
    x: 500,
    y: 30,
    capacity: 500,
    status: 'open'
  },
  {
    id: 'e2',
    name: 'Main Gate',
    x: 80,
    y: 560,
    capacity: 700,
    status: 'open'
  },
  {
    id: 'e3',
    name: 'East Gate',
    x: 1030,
    y: 300,
    capacity: 400,
    status: 'open'
  },
  {
    id: 'e4',
    name: 'South Gate',
    x: 600,
    y: 600,
    capacity: 600,
    status: 'open'
  }
];


/* =========================================================
   CAMPUS ROADS
========================================================= */

export const roads: Road[] = [
  {
    id: 'r1',
    name: 'Central Road',
    from: 'j1',
    to: 'j2',
    distance: 180,
    capacity: 500,
    blocked: false
  },
  {
    id: 'r2',
    name: 'North Road',
    from: 'j2',
    to: 'j3',
    distance: 220,
    capacity: 400,
    blocked: false
  },
  {
    id: 'r3',
    name: 'East Road',
    from: 'j2',
    to: 'j4',
    distance: 260,
    capacity: 350,
    blocked: false
  },
  {
    id: 'r4',
    name: 'South Road',
    from: 'j1',
    to: 'j5',
    distance: 240,
    capacity: 600,
    blocked: false
  },
  {
    id: 'r5',
    name: 'Hostel Road',
    from: 'j5',
    to: 'j4',
    distance: 200,
    capacity: 300,
    blocked: false
  },
  {
    id: 'r6',
    name: 'Library Road',
    from: 'j3',
    to: 'j4',
    distance: 180,
    capacity: 350,
    blocked: false
  },
  {
    id: 'r7',
    name: 'Emergency Bridge',
    from: 'j5',
    to: 'j6',
    distance: 150,
    capacity: 250,
    blocked: false
  }
];


/* =========================================================
   ASSEMBLY POINTS
========================================================= */

export const assemblyPoints: AssemblyPoint[] = [
  {
    id: 'a1',
    name: 'Central Assembly Ground',
    x: 400,
    y: 560,
    capacity: 1800
  },
  {
    id: 'a2',
    name: 'Sports Assembly Area',
    x: 900,
    y: 540,
    capacity: 1000
  }
];


/* =========================================================
   CAMPUS ZONES
========================================================= */

export const campusZones: CampusZone[] = [
  {
    id: 'z1',
    name: 'Academic',
    risk: 38,
    population: 1410
  },
  {
    id: 'z2',
    name: 'Residential',
    risk: 55,
    population: 850
  },
  {
    id: 'z3',
    name: 'Administration',
    risk: 20,
    population: 210
  },
  {
    id: 'z4',
    name: 'Sports',
    risk: 18,
    population: 160
  }
];


/* =========================================================
   SAMPLE CAMPUS PEOPLE
========================================================= */

export const campusPeople: CampusPerson[] = [
  {
    id: 'p1',
    type: 'student',
    x: 180,
    y: 150,
    zone: 'z1',
    risk: 45,
    status: 'safe'
  },
  {
    id: 'p2',
    type: 'student',
    x: 500,
    y: 150,
    zone: 'z1',
    risk: 50,
    status: 'safe'
  },
  {
    id: 'p3',
    type: 'staff',
    x: 250,
    y: 380,
    zone: 'z3',
    risk: 20,
    status: 'safe'
  },
  {
    id: 'p4',
    type: 'student',
    x: 560,
    y: 400,
    zone: 'z2',
    risk: 70,
    status: 'safe'
  },
  {
    id: 'p5',
    type: 'student',
    x: 620,
    y: 430,
    zone: 'z2',
    risk: 65,
    status: 'safe'
  },
  {
    id: 'p6',
    type: 'visitor',
    x: 820,
    y: 180,
    zone: 'z1',
    risk: 30,
    status: 'safe'
  },
  {
    id: 'p7',
    type: 'student',
    x: 830,
    y: 400,
    zone: 'z4',
    risk: 15,
    status: 'safe'
  }
];


/* =========================================================
   CAMPUS STATISTICS
========================================================= */

export const campusStats = {
  totalPopulation: buildings.reduce((sum, building) => sum + building.occupants, 0),
  buildings: buildings.length,
  exits: exits.length,
  roads: roads.length,
  assemblyPoints: assemblyPoints.length,
  zones: campusZones.length
};