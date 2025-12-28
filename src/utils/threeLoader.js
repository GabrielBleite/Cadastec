// Centraliza imports de Three.js e OrbitControls via ES Modules (CDN único, sem bundler)
// Evita conflitos de resolução misturando caminhos locais/pacote.
export * as THREE from "https://cdn.jsdelivr.net/npm/three@0.167.1/build/three.module.js";
export { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.167.1/examples/jsm/controls/OrbitControls.js";
