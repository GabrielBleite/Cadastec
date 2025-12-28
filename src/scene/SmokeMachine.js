import * as THREE from "../utils/threeLoader.js";

export class SmokeMachine {
  constructor(offsetX = 0.6, height = 0.18) {
    this.group = new THREE.Group();
    this.offsetX = offsetX;
    this.height = height;
    this.build();
  }

  build() {
    const bodyGeo = new THREE.BoxGeometry(0.16, 0.1, 0.12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1a1f2c,
      roughness: 0.6,
      metalness: 0.45,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;

    const nozzleGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.08, 12);
    const nozzleMat = new THREE.MeshStandardMaterial({
      color: 0x9fb4ce,
      roughness: 0.25,
      metalness: 0.75,
    });
    const nozzle = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(0.1, 0.02, 0);

    const light = new THREE.PointLight(0x8fb9ff, 0.6, 0.7);
    light.position.set(0.12, 0.05, 0);

    this.group.add(body);
    this.group.add(nozzle);
    this.group.add(light);

    this.group.position.set(this.offsetX, this.height, 0.08);
  }
}
