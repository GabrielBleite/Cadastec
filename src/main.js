import * as THREE from "./utils/threeLoader.js";
import { CaseRegistry } from "./cases/CaseRegistry.js";
import { CaseBuilder } from "./scene/CaseBuilder.js";
import { SmokeMachine } from "./scene/SmokeMachine.js";
import { ParticleSystem } from "./sim/ParticleSystem.js";
import { UiController } from "./ui/UiController.js";
import { FAN_STATE, CASE_REFERENCE } from "./utils/constants.js";

const canvas = document.getElementById("app");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#0a0d14");

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 20);
camera.position.set(1.4, 0.7, 1.6);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.15, 0);
controls.enableDamping = true;
controls.enablePan = true;
controls.maxDistance = 4;
controls.minDistance = 0.8;

scene.add(new THREE.AmbientLight(0x8fa7ff, 0.35));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.75);
dirLight.position.set(2, 2, 1.5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

const floor = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 64),
  new THREE.MeshStandardMaterial({ color: 0x0f1725, roughness: 0.9, metalness: 0.1 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.25;
floor.receiveShadow = true;
scene.add(floor);

let currentCaseId = CaseRegistry.defaultId;
let caseBuilder;
let smokeMachine;
let particles;

const ui = new UiController(document.getElementById("ui-root"));
ui.callbacks.onCaseChange = (id) => switchCase(id);
ui.callbacks.onReset = () => resetFans();
ui.callbacks.onPositive = () => applyPreset("positive");
ui.callbacks.onNegative = () => applyPreset("negative");
ui.callbacks.onRecommended = () => applyPreset("balanced");
ui.callbacks.onSmokeToggle = (state) => toggleSmoke(state);

init();

function init() {
  console.info("Inicializando simulador", CASE_REFERENCE);
  ui.init(CaseRegistry.list());
  switchCase(currentCaseId);
  window.addEventListener("resize", onResize);
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("click", onClick);
  animate();
}

function switchCase(id) {
  const spec = CaseRegistry.getById(id);
  if (!spec) return;
  currentCaseId = id;

  if (caseBuilder) {
    scene.remove(caseBuilder.group);
  }
  if (smokeMachine) scene.remove(smokeMachine.group);
  if (particles?.points) scene.remove(particles.points);

  caseBuilder = new CaseBuilder(spec);
  scene.add(caseBuilder.build());

  smokeMachine = new SmokeMachine(spec.dimensions.width / 2 + 0.35);
  scene.add(smokeMachine.group);

  particles = new ParticleSystem(caseBuilder, smokeMachine.group);
  scene.add(particles.points);

  ui.updateStatus(caseBuilder.fans);
  console.info(`Gabinete ativo: ${spec.name}`);
}

function resetFans() {
  caseBuilder.fans.forEach((fan) => fan.setState(fan.slot.defaultState));
  ui.updateStatus(caseBuilder.fans);
}

function applyPreset(key) {
  const preset = caseBuilder.caseSpec.recommendedStates[key];
  if (!preset) return;
  caseBuilder.fans.forEach((fan) => {
    if (preset.intakes.includes(fan.slot.id)) fan.setState(FAN_STATE.INTAKE);
    else if (preset.exhausts.includes(fan.slot.id)) fan.setState(FAN_STATE.EXHAUST);
    else fan.setState(FAN_STATE.OFF);
  });
  ui.updateStatus(caseBuilder.fans);
}

function toggleSmoke(state) {
  particles.setSmoke(state);
}

const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let hoverFan = null;

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  updateHover();
}

function updateHover() {
  if (!caseBuilder) return;
  raycaster.setFromCamera(pointer, camera);
  const meshes = caseBuilder.fans.map((fan) => fan.eventMesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hoverFan) hoverFan.setHover(false);
  hoverFan = null;
  if (hits.length > 0) {
    const mesh = hits[0].object;
    const fan = caseBuilder.fans.find((f) => f.eventMesh === mesh);
    if (fan) {
      fan.setHover(true);
      hoverFan = fan;
    }
  }
}

function onClick(event) {
  if (!caseBuilder) return;
  raycaster.setFromCamera(pointer, camera);
  const meshes = caseBuilder.fans.map((fan) => fan.eventMesh);
  const hits = raycaster.intersectObjects(meshes, false);
  if (hits.length > 0) {
    const mesh = hits[0].object;
    const fan = caseBuilder.fans.find((f) => f.eventMesh === mesh);
    if (fan) {
      fan.cycleState();
      ui.updateStatus(caseBuilder.fans);
    }
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  particles?.update(dt);
  caseBuilder?.fans.forEach((fan) => {
    fan.rotation.z += 0.02;
  });

  controls.update();
  renderer.render(scene, camera);
}
