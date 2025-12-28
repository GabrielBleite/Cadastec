import { THREE } from "../utils/threeLoader.js";
import { FAN_STATE } from "../utils/constants.js";

const width = 0.46;
const height = 0.47;
const depth = 0.46;
const wall = 0.012;

const slotRadius = 0.06;

const makeFan = (id, position, normal, defaultState) => ({
  id,
  position,
  normal,
  radius: slotRadius,
  defaultState,
});

const topY = height / 2 - wall * 1.3;
const bottomY = -height / 2 + wall * 1.3;
const rightX = width / 2 - wall * 1.4;
const leftX = -width / 2 + wall * 1.7;
const backZ = -depth / 2 + wall * 1.2;
const frontZ = depth / 2 - wall * 1.2;

const horizontalOffsets = [-0.14, 0, 0.14];
const verticalOffsets = [-0.14, 0, 0.14];
const sideZ = frontZ - 0.08;
const roofZ = 0.08;

const fanSlots = [
  // Bottom intake (row X)
  ...horizontalOffsets.map((x, index) =>
    makeFan(
      `Bottom-${index + 1}`,
      new THREE.Vector3(x, bottomY, 0.02),
      new THREE.Vector3(0, -1, 0),
      FAN_STATE.INTAKE,
    ),
  ),
  // Side intake (column)
  ...verticalOffsets.map((y, index) =>
    makeFan(
      `Side-${index + 1}`,
      new THREE.Vector3(rightX, y, sideZ),
      new THREE.Vector3(1, 0, 0),
      FAN_STATE.INTAKE,
    ),
  ),
  // Top exhaust (row X)
  ...horizontalOffsets.map((x, index) =>
    makeFan(
      `Top-${index + 1}`,
      new THREE.Vector3(x, topY, roofZ),
      new THREE.Vector3(0, 1, 0),
      FAN_STATE.EXHAUST,
    ),
  ),
  // Rear exhaust
  makeFan(
    "Rear",
    new THREE.Vector3(leftX + 0.06, 0.05, backZ),
    new THREE.Vector3(0, 0, -1),
    FAN_STATE.EXHAUST,
  ),
];

export const AquarioCase = {
  id: "aquario",
  name: "Aquário (tipo O11 Dynamic)",
  dimensions: { width, height, depth },
  wallThickness: wall,
  glassFaces: ["front", "right"],
  fanSlots,
  obstacles: [
    {
      id: "motherboard",
      name: "Motherboard",
      box: new THREE.Box3(
        new THREE.Vector3(leftX + 0.03, -0.12, backZ + 0.03),
        new THREE.Vector3(leftX + 0.18, 0.16, backZ + 0.14),
      ),
      color: "#293242",
    },
    {
      id: "gpu",
      name: "GPU",
      box: new THREE.Box3(
        new THREE.Vector3(leftX + 0.03, -0.02, backZ + 0.16),
        new THREE.Vector3(leftX + 0.26, 0.06, backZ + 0.3),
      ),
      color: "#39465c",
    },
    {
      id: "psu",
      name: "PSU Chamber",
      box: new THREE.Box3(
        new THREE.Vector3(-width / 2 + wall * 1.5, -height / 2 + wall * 1.5, -depth / 2 + 0.12),
        new THREE.Vector3(width / 2 - wall * 1.5, -height / 2 + 0.1, depth / 2 - 0.12),
      ),
      color: "#1d2533",
    },
    {
      id: "cpu-cooler",
      name: "CPU Block",
      box: new THREE.Box3(
        new THREE.Vector3(leftX + 0.12, 0.1, backZ + 0.11),
        new THREE.Vector3(leftX + 0.18, 0.16, backZ + 0.17),
      ),
      color: "#45556c",
    },
  ],
  recommendedStates: {
    positive: {
      intakes: ["Bottom-1", "Bottom-2", "Bottom-3", "Side-1", "Side-2", "Side-3"],
      exhausts: ["Top-1", "Top-2", "Top-3", "Rear"],
    },
    negative: {
      intakes: ["Side-2", "Side-3"],
      exhausts: ["Top-1", "Top-2", "Top-3", "Rear", "Bottom-1", "Bottom-2", "Bottom-3"],
    },
    balanced: {
      intakes: ["Bottom-1", "Bottom-2", "Bottom-3", "Side-2", "Side-3"],
      exhausts: ["Top-1", "Top-2", "Top-3", "Rear"],
    },
  },
};
