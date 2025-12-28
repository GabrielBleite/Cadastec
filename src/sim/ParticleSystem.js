import { THREE } from "../utils/threeLoader.js";
import {
  BASE_FLOW,
  FAN_STATE,
  PARTICLE_LIMIT,
  PARTICLE_LIFETIME,
  FAN_INFLUENCE_RADIUS,
} from "../utils/constants.js";

const drag = 0.25;

function makeSpriteTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.1, size / 2, size / 2, size * 0.45);
  gradient.addColorStop(0, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.4, "rgba(180,200,255,0.30)");
  gradient.addColorStop(1, "rgba(80,100,150,0.0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

export class ParticleSystem {
  constructor(caseBuilder, emitter) {
    this.caseBuilder = caseBuilder;
    this.emitter = emitter;
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.PointsMaterial({
      size: 0.032,
      map: makeSpriteTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0.85,
      color: new THREE.Color(0xbfd6ff),
    });
    this.points = new THREE.Points(this.geometry, this.material);

    this.positions = new Float32Array(PARTICLE_LIMIT * 3);
    this.velocities = new Float32Array(PARTICLE_LIMIT * 3);
    this.ages = new Float32Array(PARTICLE_LIMIT);
    this.active = 0;
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage));

    this.smokeOn = true;
    this.alphaTarget = 0.85;

    this.openingsByAxis = this.groupOpenings();
  }

  groupOpenings() {
    const map = { xPos: [], xNeg: [], yPos: [], yNeg: [], zPos: [], zNeg: [] };
    this.caseBuilder.openings.forEach((opening) => {
      const n = opening.normal;
      if (Math.abs(n.x - 1) < 0.01) map.xPos.push(opening);
      else if (Math.abs(n.x + 1) < 0.01) map.xNeg.push(opening);
      else if (Math.abs(n.y - 1) < 0.01) map.yPos.push(opening);
      else if (Math.abs(n.y + 1) < 0.01) map.yNeg.push(opening);
      else if (Math.abs(n.z - 1) < 0.01) map.zPos.push(opening);
      else if (Math.abs(n.z + 1) < 0.01) map.zNeg.push(opening);
    });
    return map;
  }

  setSmoke(state) {
    this.smokeOn = state;
    this.alphaTarget = state ? 0.85 : 0.08;
  }

  spawnParticle() {
    if (this.active >= PARTICLE_LIMIT) return;
    const i = this.active;
    const pos = this._spawnPosition();
    this.positions[i * 3] = pos.x;
    this.positions[i * 3 + 1] = pos.y;
    this.positions[i * 3 + 2] = pos.z;

    const vel = BASE_FLOW.clone().multiplyScalar(0.2 + Math.random() * 0.4);
    vel.y += (Math.random() - 0.5) * 0.05;
    vel.z += (Math.random() - 0.5) * 0.05;

    this.velocities[i * 3] = vel.x;
    this.velocities[i * 3 + 1] = vel.y;
    this.velocities[i * 3 + 2] = vel.z;
    this.ages[i] = Math.random() * (PARTICLE_LIFETIME * 0.4);
    this.active++;
  }

  _spawnPosition() {
    const base = this.emitter.position.clone();
    base.x += (Math.random() - 0.5) * 0.05;
    base.y += (Math.random() - 0.5) * 0.05;
    base.z += (Math.random() - 0.5) * 0.05;
    return base;
  }

  update(dt) {
    if (this.smokeOn) {
      const rate = 320; // particles per second
      const expected = Math.min(Math.floor(rate * dt), 120);
      for (let i = 0; i < expected; i++) this.spawnParticle();
    }

    this.material.opacity = THREE.MathUtils.lerp(this.material.opacity, this.alphaTarget, 0.05);

    const min = this.caseBuilder.innerBox.min;
    const max = this.caseBuilder.innerBox.max;
    const obstacles = this.caseBuilder.obstacleMeshes;

    for (let i = this.active - 1; i >= 0; i--) {
      const idx = i * 3;
      const pos = new THREE.Vector3(this.positions[idx], this.positions[idx + 1], this.positions[idx + 2]);
      const prev = pos.clone();
      const vel = new THREE.Vector3(this.velocities[idx], this.velocities[idx + 1], this.velocities[idx + 2]);

      // base airflow
      vel.addScaledVector(BASE_FLOW, dt * 0.4);

      // fan influence
      this.caseBuilder.fans.forEach((fan) => {
        const boost = fan.applyInfluence(pos, FAN_INFLUENCE_RADIUS);
        if (boost) vel.addScaledVector(boost, dt * 6);
      });

      // obstacle deflection
      obstacles.forEach((mesh) => {
        const box = mesh.userData.boundingBox;
        if (box && box.containsPoint(pos)) {
          const push = this._repelFromBox(pos, box);
          vel.addScaledVector(push, dt * 2);
        } else if (box && pos.distanceTo(box.clampPoint(pos.clone(), new THREE.Vector3())) < 0.04) {
          const push = this._repelFromBox(pos, box);
          vel.addScaledVector(push, dt * 0.6);
        }
      });

      // integration
      vel.multiplyScalar(1 - drag * dt);
      pos.addScaledVector(vel, dt);

      // bounding
      this._handleBoundary(prev, pos, vel, min, max);

      // fade out and recycle
      this.ages[i] += dt;
      const isOutside = pos.x < min.x - 0.15 || pos.x > max.x + 0.25 || pos.y < min.y - 0.25 || pos.y > max.y + 0.25 || pos.z < min.z - 0.2 || pos.z > max.z + 0.2;

      if (this.ages[i] > PARTICLE_LIFETIME || isOutside) {
        if (this.smokeOn) {
          this._respawn(i);
          continue;
        }
        this._remove(i);
        continue;
      }

      this.positions[idx] = pos.x;
      this.positions[idx + 1] = pos.y;
      this.positions[idx + 2] = pos.z;
      this.velocities[idx] = vel.x;
      this.velocities[idx + 1] = vel.y;
      this.velocities[idx + 2] = vel.z;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.setDrawRange(0, this.active);
  }

  _respawn(i) {
    const pos = this._spawnPosition();
    this.positions[i * 3] = pos.x;
    this.positions[i * 3 + 1] = pos.y;
    this.positions[i * 3 + 2] = pos.z;
    const vel = BASE_FLOW.clone().multiplyScalar(0.2 + Math.random() * 0.4);
    this.velocities[i * 3] = vel.x;
    this.velocities[i * 3 + 1] = vel.y;
    this.velocities[i * 3 + 2] = vel.z;
    this.ages[i] = 0;
  }

  _remove(i) {
    const last = this.active - 1;
    if (i !== last) {
      this.positions.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.velocities.copyWithin(i * 3, last * 3, last * 3 + 3);
      this.ages[i] = this.ages[last];
    }
    this.active = Math.max(0, this.active - 1);
  }

  _repelFromBox(point, box) {
    const closest = box.clampPoint(point.clone(), new THREE.Vector3());
    const dir = point.clone().sub(closest);
    if (dir.lengthSq() === 0) {
      dir.set((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4);
    }
    const dist = dir.length() + 0.0001;
    return dir.normalize().multiplyScalar(0.25 / dist);
  }

  _handleBoundary(prev, pos, vel, min, max) {
    this._checkAxis("x", prev, pos, vel, min.x, max.x, "xNeg", "xPos");
    this._checkAxis("y", prev, pos, vel, min.y, max.y, "yNeg", "yPos");
    this._checkAxis("z", prev, pos, vel, min.z, max.z, "zNeg", "zPos");
  }

  _checkAxis(axis, prev, pos, vel, min, max, negKey, posKey) {
    const idx = axis === "x" ? 0 : axis === "y" ? 1 : 2;
    const coordPrev = prev.getComponent(idx);
    const coord = pos.getComponent(idx);

    if (coord > max) {
      const t = (max - coordPrev) / (coord - coordPrev);
      const crossPoint = prev.clone().lerp(pos, t);
      const entering = coordPrev > max;
      const allowed = this._onOpening(posKey, crossPoint, entering ? "in" : "out");
      if (allowed) {
        pos.setComponent(idx, max - 0.001);
      } else {
        pos.setComponent(idx, max);
        vel.setComponent(idx, Math.abs(vel.getComponent(idx)) * -0.6);
        vel.multiplyScalar(0.92);
      }
    } else if (coord < min) {
      const t = (min - coordPrev) / (coord - coordPrev);
      const crossPoint = prev.clone().lerp(pos, t);
      const entering = coordPrev < min;
      const allowed = this._onOpening(negKey, crossPoint, entering ? "in" : "out");
      if (allowed) {
        pos.setComponent(idx, min + 0.001);
      } else {
        pos.setComponent(idx, min);
        vel.setComponent(idx, Math.abs(vel.getComponent(idx)) * 0.6);
        vel.multiplyScalar(0.92);
      }
    }
  }

  _onOpening(key, point, direction) {
    const openings = this.openingsByAxis[key] || [];
    for (const opening of openings) {
      const { position, radius, fan } = opening;
      let dist = 0;
      if (key.startsWith("x")) dist = Math.hypot(point.y - position.y, point.z - position.z);
      else if (key.startsWith("y")) dist = Math.hypot(point.x - position.x, point.z - position.z);
      else dist = Math.hypot(point.x - position.x, point.y - position.y);

      if (dist > radius * 0.95) continue;

      if (direction === "in") {
        if (fan.state === FAN_STATE.INTAKE || fan.state === FAN_STATE.OFF) return true;
      } else {
        if (fan.state === FAN_STATE.EXHAUST || fan.state === FAN_STATE.OFF) return true;
      }
    }
    return false;
  }
}
