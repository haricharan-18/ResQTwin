import {
  buildings,
  CampusPerson
} from '../data/campusData';

export function generateCampusCrowd(): CampusPerson[] {
  const people: CampusPerson[] = [];

  let personNumber = 1;

  buildings.forEach((building) => {
    const total = building.occupants;

    // Automatically create a grid that fits inside the building.
    const columns = Math.max(
      1,
      Math.ceil(
        Math.sqrt(total * building.width / building.height)
      )
    );

    const rows = Math.ceil(total / columns);

    const horizontalGap = building.width / (columns + 1);
    const verticalGap = building.height / (rows + 1);

    for (let i = 0; i < total; i++) {
      const column = i % columns;
      const row = Math.floor(i / columns);

      const x =
        building.x +
        horizontalGap * (column + 1);

      const y =
        building.y +
        verticalGap * (row + 1);

      const type =
        i % 10 === 0
          ? 'staff'
          : i % 25 === 0
          ? 'visitor'
          : 'student';

      const risk = Math.min(
        100,
        building.risk + (i % 6) * 4
      );

      let zone = 'z1';

      if (building.id === 'b5') {
        zone = 'z2';
      } else if (building.id === 'b4') {
        zone = 'z3';
      } else if (building.id === 'b6') {
        zone = 'z4';
      }

      people.push({
        id: `crowd-${personNumber}`,
        type,
        x,
        y,
        zone,
        risk,
        status: 'safe'
      });

      personNumber++;
    }
  });

  return people;
}