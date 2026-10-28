// One portal schedule for every district. Adjacent districts are 110 units apart;
// the closest two portals are 38 units apart, well beyond their 4-unit depth.
export const PORTAL_LOCAL_Z = Object.freeze([7, -65]);
export const LANTERN_LOCAL_Z = Object.freeze([22, 11, 0, -11, -22, -33, -44, -55, -66, -77]);
export const LANTERN_EDGE_X = 14.4;
export function corridorLanternPositions() {
  return [-1, 1].flatMap(side => LANTERN_LOCAL_Z.map(z => [side * LANTERN_EDGE_X, z]));
}
