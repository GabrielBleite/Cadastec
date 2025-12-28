import { THREE } from "./threeLoader.js";

export const FAN_STATE = {
  INTAKE: "INTAKE",
  EXHAUST: "EXHAUST",
  OFF: "OFF",
};

export const FAN_COLORS = {
  [FAN_STATE.INTAKE]: new THREE.Color("#5bb3ff"),
  [FAN_STATE.EXHAUST]: new THREE.Color("#ff6f6f"),
  [FAN_STATE.OFF]: new THREE.Color("#a7b3c2"),
};

export const CASE_REFERENCE = {
  description: "X → direita, Y → cima, Z → frente. Frente = +Z.",
  forward: new THREE.Vector3(0, 0, 1),
  right: new THREE.Vector3(1, 0, 0),
  up: new THREE.Vector3(0, 1, 0),
};

export const BASE_FLOW = new THREE.Vector3(-0.45, 0, 0); // direita → esquerda
export const PARTICLE_LIMIT = 8000;
export const PARTICLE_LIFETIME = 16; // segundos
export const SIM_DT = 1 / 60;
export const FAN_INFLUENCE_RADIUS = 0.14;
export const FAN_PUSH = 1.8;
export const CASE_WALL_THICKNESS = 0.01;
export const FAN_OPENING_RADIUS = 0.06;
