import { THREE } from "../utils/threeLoader.js";
import { CASE_WALL_THICKNESS } from "../utils/constants.js";
import { Fan } from "./Fan.js";

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x8db4ff,
  roughness: 0.05,
  metalness: 0.05,
  opacity: 0.18,
  transparent: true,
  transmission: 0.92,
  clearcoat: 0.6,
  clearcoatRoughness: 0.1,
  thickness: 0.005,
});

const opaqueMaterial = new THREE.MeshStandardMaterial({
  color: 0x0b0f16,
  roughness: 0.55,
  metalness: 0.55,
});

export class CaseBuilder {
  constructor(caseSpec) {
    this.caseSpec = caseSpec;
    this.group = new THREE.Group();
    this.fans = [];
    this.openings = [];
    this.obstacleMeshes = [];
    this.boundingBox = null;
    this.innerBox = null;
  }

  build() {
    this.buildShell();
    this.buildFans();
    this.buildObstacles();
    this.addAccentLighting();
    return this.group;
  }

  buildShell() {
    const { width, height, depth } = this.caseSpec.dimensions;
    const wall = this.caseSpec.wallThickness ?? CASE_WALL_THICKNESS;
    const half = { x: width / 2, y: height / 2, z: depth / 2 };

    const planes = [
      { key: "front", pos: new THREE.Vector3(0, 0, half.z), rot: new THREE.Euler(0, 0, 0) },
      { key: "back", pos: new THREE.Vector3(0, 0, -half.z), rot: new THREE.Euler(0, Math.PI, 0) },
      { key: "right", pos: new THREE.Vector3(half.x, 0, 0), rot: new THREE.Euler(0, Math.PI / 2, 0) },
      { key: "left", pos: new THREE.Vector3(-half.x, 0, 0), rot: new THREE.Euler(0, -Math.PI / 2, 0) },
      { key: "top", pos: new THREE.Vector3(0, half.y, 0), rot: new THREE.Euler(-Math.PI / 2, 0, 0) },
      { key: "bottom", pos: new THREE.Vector3(0, -half.y, 0), rot: new THREE.Euler(Math.PI / 2, 0, 0) },
    ];

    planes.forEach((plane) => {
      const isGlass = this.caseSpec.glassFaces.includes(plane.key);
      const material = isGlass ? glassMaterial.clone() : opaqueMaterial.clone();
      const geometry = new THREE.PlaneGeometry(
        plane.key === "left" || plane.key === "right" ? depth : width,
        plane.key === "top" || plane.key === "bottom" ? width : height,
      );
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(plane.pos);
      mesh.rotation.copy(plane.rot);
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      this.group.add(mesh);
    });

    const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth, 1, 1, 1));
    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x2f3950, linewidth: 2, transparent: true, opacity: 0.6 }),
    );
    this.group.add(edgeLines);

    this.boundingBox = new THREE.Box3(
      new THREE.Vector3(-half.x, -half.y, -half.z),
      new THREE.Vector3(half.x, half.y, half.z),
    );
    this.innerBox = new THREE.Box3(
      this.boundingBox.min.clone().addScalar(wall),
      this.boundingBox.max.clone().addScalar(-wall),
    );

    const floorPad = new THREE.Mesh(
      new THREE.BoxGeometry(width - wall * 2.2, wall * 0.8, depth - wall * 2.2),
      new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.7, metalness: 0.35 }),
    );
    floorPad.position.set(0, this.boundingBox.min.y + wall * 0.4, 0);
    floorPad.receiveShadow = true;
    this.group.add(floorPad);
  }

  buildFans() {
    this.fans = this.caseSpec.fanSlots.map((slot) => {
      const fan = new Fan(slot);
      this.group.add(fan);
      this.openings.push({
        id: slot.id,
        normal: slot.normal.clone().normalize(),
        position: slot.position.clone(),
        radius: slot.radius,
        fan,
      });
      return fan;
    });
  }

  buildObstacles() {
    this.obstacleMeshes = this.caseSpec.obstacles.map((item) => {
      const size = new THREE.Vector3();
      item.box.getSize(size);
      const center = new THREE.Vector3();
      item.box.getCenter(center);

      const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(item.color || "#303a4d"),
        metalness: 0.25,
        roughness: 0.6,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.boundingBox = item.box.clone();
      mesh.userData.label = item.name;

      this.group.add(mesh);
      return mesh;
    });
  }

  addAccentLighting() {
    const strip = new THREE.RectAreaLight(0x5bb3ff, 2.4, this.caseSpec.dimensions.width * 0.6, 0.02);
    strip.position.set(this.caseSpec.dimensions.width * 0.15, this.caseSpec.dimensions.height * 0.35, this.caseSpec.dimensions.depth / 2 - 0.04);
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = -Math.PI / 8;
    this.group.add(strip);
  }
}
