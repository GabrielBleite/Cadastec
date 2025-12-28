// Centraliza imports de Three.js e OrbitControls via ES Modules (CDN ESM with dependency rewriting)
// Usa esm.sh para evitar o erro “Failed to resolve module specifier 'three'” dentro dos arquivos da pasta examples.
import * as THREE from "https://esm.sh/three@0.167.1";

export { THREE };
export { OrbitControls } from "https://esm.sh/three@0.167.1/examples/jsm/controls/OrbitControls";
