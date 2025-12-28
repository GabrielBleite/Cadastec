import { THREE } from "../utils/threeLoader.js";

export class SmokeMachine {
  constructor(offsetX = 0.35, height = 0.18) {
    this.group = new THREE.Group();
    this.offsetX = offsetX;
    this.height = height;
    this.build();
  }

  build() {
    const bodyGeo = new THREE.BoxGeometry(0.2, 0.1, 0.14);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f1624,
      roughness: 0.45,
      metalness: 0.65,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;

    const nozzleGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.12, 14);
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x9fb4ce,
      roughness: 0.25,
      metalness: 0.75,
    });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(0.11, 0.02, 0.01);

    const light = new THREE.PointLight(0x8fb9ff, 0.9, 0.9);
    light.position.set(0.12, 0.06, 0.01);

    this.group.add(body);
    this.group.add(nozzle);
    this.group.add(light);

    this.group.position.set(this.offsetX, this.height, 0.06);
  }
}
