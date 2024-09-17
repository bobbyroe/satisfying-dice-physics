import * as THREE from "three";
import { getBody, getMouseBall } from "./getBodies.js";
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat@0.11.2';
import { GLTFLoader } from 'jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 3, 6);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ctrls = new OrbitControls(camera, renderer.domElement);
ctrls.enableDamping = true;

await RAPIER.init();
const gravity = { x: 0.0, y: -9.81 * 2.0, z: 0.0 };
const world = new RAPIER.World(gravity);

// Create the ground
let groundColliderDesc = RAPIER.ColliderDesc.cuboid(5.0, 0.1, 5.0)
  .setTranslation(0.0, -2.0, 0.0);
world.createCollider(groundColliderDesc);

const floorGeo = new THREE.BoxGeometry(10, 0.1, 10, 5, 1, 5);
const floorMat = new THREE.MeshLambertMaterial({
  color: 0xffffff,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.set(0.0, -2, 0.0);
floor.receiveShadow = true;
scene.add(floor);

const loader = new GLTFLoader();
const diceGltf = await loader.loadAsync('die.glb');
const dice = diceGltf.scene;
const numBodies = 100;
const bodies = [];
for (let i = 0; i < numBodies; i++) {
  const body = getBody(RAPIER, world, dice);
  bodies.push(body);
  scene.add(body.mesh);
}

const mouseBall = getMouseBall(RAPIER, world);
scene.add(mouseBall.mesh);

const mousePos = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function handleRaycast () {
  raycaster.setFromCamera(mousePos, camera);
  const intersects = raycaster.intersectObjects([floor], true);
  if (intersects.length > 0) {
    let { point } = intersects[0];
    mouseBall.update(point);
  }
}

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xaa00ff, 1.0);
scene.add(hemiLight);

const light = new THREE.DirectionalLight(0xffffff, 2);
let d = 15;
light.shadow.camera.left = -d;
light.shadow.camera.right = d;
light.shadow.camera.top = d;
light.shadow.camera.bottom = -d;
light.shadow.camera.near = 2;
light.shadow.camera.far = 30;
light.shadow.mapSize.x = 2048;
light.shadow.mapSize.y = 2048;
light.position.set(3, 8, 10);
light.castShadow = true;
scene.add(light);
// const lightHelper = new THREE.DirectionalLightHelper(light);
// scene.add(lightHelper);
// const cameraHelper = new THREE.CameraHelper(light.shadow.camera);
// scene.add(cameraHelper);

const pointsGeo = new THREE.BufferGeometry();
const pointsMat = new THREE.PointsMaterial({ 
  size: 0.1, 
  vertexColors: true
});
const points = new THREE.Points(pointsGeo, pointsMat);
scene.add(points);

function renderDebugView() {
  const { vertices, colors } = world.debugRender();
  pointsGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  pointsGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}
function animate() {
  requestAnimationFrame(animate);
  world.step();
  mouseBall.update(mousePos);
  ctrls.update();
  // renderDebugView();
  handleRaycast();
  bodies.forEach(b => b.update());
  renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

function handleMouseMove(evt) {
  mousePos.x = (evt.clientX / window.innerWidth) * 2 - 1;
  mousePos.y = -(evt.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', handleMouseMove, false);

