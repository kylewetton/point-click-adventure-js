import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm//controls/OrbitControls";
import Theme from "./Theme";
import { Math as ThreeMath } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const themeSettings = {
  background: 0x32383c,
  lights: [
    {
      id: "hemi",
      sky: 0xe6f5ff,
      ground: 0xdbd0af,
      intensity: 1,
      position: { x: 0, y: 50, z: 0 },
    },
    {
      id: "directional",
      color: 0xfff7d9,
      intensity: 0.54,
      position: { x: -8, y: 12, z: 8 },
      shadows: true,
      mapSize: 2048,
    },
    // {
    //   id: "directional",
    //   color: 0xffffff,
    //   intensity: 0.54,
    //   position: { x: 8, y: 12, z: -8 },
    //   shadows: false,
    //   mapSize: 2048,
    // },
  ],
  floor: {
    color: 0x32383c,
    shininess: 0,
    shadowOpacity: 0.25,
  },
};

export const theme = new Theme(themeSettings);

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(
  30,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.z = 45;
camera.position.y = 30;
camera.position.x = -15;

export const defaultMaterial = new THREE.MeshPhongMaterial({
  color: 0xf1f1f1,
  shininess: 10,
  transparent: true,
  opacity: 1,
});

export const highlightMaterial = new THREE.MeshPhongMaterial({
  color: 0x667eea,
  shininess: 10,
  transparent: true,
  opacity: 1,
});

export const hoverMaterial = new THREE.MeshPhongMaterial({
  color: 0xa3bffa,
  shininess: 5,
  transparent: true,
  opacity: 1,
});

export const renderer = new THREE.WebGLRenderer({
  alpha: true,
  antialias: true,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.sortObjects = true;

export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.maxPolarAngle = ThreeMath.degToRad(60);
controls.minPolarAngle = ThreeMath.degToRad(60);
controls.dampingFactor = 0.05;
controls.target = new THREE.Vector3(0, 0, 0);
controls.saveState();

export const clock = new THREE.Clock();
export const loader = new GLTFLoader();
export const raycaster = new THREE.Raycaster();
