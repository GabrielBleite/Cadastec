import * as THREE from "../utils/threeLoader.js";
import { FAN_STATE, FAN_COLORS, FAN_INFLUENCE_RADIUS, FAN_OPENING_RADIUS } from "../utils/constants.js";

const fanThickness = 0.035;

export class Fan extends THREE.Group {
  constructor(slot) {
    super();
    this.slot = slot;
    this.state = slot.defaultState;

    this.base = new THREE.Group();
    this.arrow = null;
    this.blades = null;
    this.ring = null;
    this.tunnel = null;

    this.build();
    this.updateStateVisuals();
  }

  build() {
    const frameGeo = new THREE.BoxGeometry(0.12, 0.02, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1d2738,
      metalness: 0.3,
      roughness: 0.65,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.castShadow = true;
    frame.receiveShadow = true;

    const bladesGeo = new THREE.ConeGeometry(0.05, fanThickness, 5, 1);
    const bladesMat = new THREE.MeshStandardMaterial({
      color: 0x9fb4ce,
      metalness: 0.4,
      roughness: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    this.blades = new THREE.Mesh(bladesGeo, bladesMat);
    this.blades.position.z = fanThickness * 0.35;

    const ringGeo = new THREE.TorusGeometry(0.06, 0.007, 12, 48);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x11151f,
      metalness: 0.25,
      roughness: 0.55,
    });
    this.ring = new THREE.Mesh(ringGeo, ringMat);

    const tunnelGeo = new THREE.CylinderGeometry(FAN_OPENING_RADIUS * 0.9, FAN_OPENING_RADIUS * 0.9, 0.05, 16, 1, true);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x05070d,
      roughness: 0.9,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    this.tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
    this.tunnel.position.z = -0.04;

    const faceNormal = new THREE.Vector3(0, 0, 1);
    const quat = new THREE.Quaternion().setFromUnitVectors(faceNormal, this.slot.normal.clone().normalize());
    this.base.quaternion.copy(quat);

    const openingOffset = this.slot.normal.clone().normalize().multiplyScalar(fanThickness * 0.5);
    this.base.position.copy(this.slot.position.clone().add(openingOffset));

    this.base.add(frame);
    this.base.add(this.blades);
    this.base.add(this.ring);
    this.base.add(this.tunnel);

    this.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 0.12, 0xffffff, 0.05, 0.035);
    this.base.add(this.arrow);

    this.add(this.base);

    this.eventMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, fanThickness * 1.8, 12), new THREE.MeshBasicMaterial({ visible: false }));
    this.eventMesh.quaternion.copy(this.base.quaternion);
    this.eventMesh.position.copy(this.slot.position);
    this.add(this.eventMesh);
  }

  cycleState() {
    if (this.state === FAN_STATE.INTAKE) {
      this.setState(FAN_STATE.EXHAUST);
    } else if (this.state === FAN_STATE.EXHAUST) {
      this.setState(FAN_STATE.OFF);
    } else {
      this.setState(FAN_STATE.INTAKE);
    }
  }

  setState(next) {
    this.state = next;
    this.updateStateVisuals();
  }

  updateStateVisuals() {
    const color = FAN_COLORS[this.state];
    this.blades.material.color.copy(color);
    this.ring.material.color.copy(color.clone().multiplyScalar(0.8));
    this.arrow.setColor(color);

    const direction =
      this.state === FAN_STATE.INTAKE
        ? this.slot.normal.clone().multiplyScalar(-1)
        : this.slot.normal.clone();

    const baseDir = direction.lengthSq() === 0 ? new THREE.Vector3(0, 0, 1) : direction.normalize();
    this.arrow.setDirection(baseDir);
    this.arrow.setLength(0.12, 0.05, 0.035);
    this.arrow.visible = this.state !== FAN_STATE.OFF ? true : true;

    this.blades.material.opacity = this.state === FAN_STATE.OFF ? 0.45 : 0.85;
  }

  setHover(active) {
    const intensity = active ? 0.18 : 0;
    this.blades.material.emissive = new THREE.Color(0xffffff);
    this.blades.material.emissiveIntensity = intensity;
    this.ring.material.emissive = new THREE.Color(0xffffff);
    this.ring.material.emissiveIntensity = intensity * 0.6;
  }

  applyInfluence(particlePosition, influence) {
    const worldPos = this.slot.position;
    const distance = worldPos.distanceTo(particlePosition);
    if (distance > FAN_INFLUENCE_RADIUS) return;

    let dir;
    if (this.state === FAN_STATE.INTAKE) dir = this.slot.normal.clone().multiplyScalar(-1);
    else if (this.state === FAN_STATE.EXHAUST) dir = this.slot.normal.clone();
    else return;

    const strength = (1 - distance / FAN_INFLUENCE_RADIUS) * influence;
    return dir.normalize().multiplyScalar(strength);
  }
}
