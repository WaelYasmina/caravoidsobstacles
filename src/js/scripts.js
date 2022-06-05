import * as THREE from 'three';
import * as YUKA from 'yuka';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';

const renderer = new THREE.WebGLRenderer({antialias: true});

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

renderer.setClearColor(0xA3A3A3);

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 12, -10);
camera.lookAt(scene.position);

const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
directionalLight.position.set(0, 10, -10);
scene.add(directionalLight);

const vehicle = new YUKA.Vehicle();

vehicle.boundingRadius = 1.9;

vehicle.smoother = new YUKA.Smoother(30);

function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

const path = new YUKA.Path();
path.add( new YUKA.Vector3(-4, 0, -11));
path.add( new YUKA.Vector3(4, 0, -11));
path.add( new YUKA.Vector3(4, 0, 11));
path.add( new YUKA.Vector3(-4, 0, 11));

path.loop = true;

vehicle.position.copy(path.current());

vehicle.maxSpeed = 3;

const followPathBehavior = new YUKA.FollowPathBehavior(path, 3);
vehicle.steering.add(followPathBehavior);

const entityManager = new YUKA.EntityManager();
entityManager.add(vehicle);

const obstacleGeometry = new THREE.BoxBufferGeometry();
obstacleGeometry.computeBoundingSphere();
const obstacleMaterial = new THREE.MeshPhongMaterial({color: 0xee0808});

const obstacleMesh1 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
scene.add(obstacleMesh1);
obstacleMesh1.position.set(-4, 0, 0);

const obstacleMesh2 = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
scene.add(obstacleMesh2);
obstacleMesh2.position.set(4, 0, 0);

const obstacle1 = new YUKA.GameEntity();
obstacle1.position.copy(obstacleMesh1.position);
obstacle1.boundingRadius = obstacleGeometry.boundingSphere.radius;
entityManager.add(obstacle1);

const obstacle2 = new YUKA.GameEntity();
obstacle2.position.copy(obstacleMesh2.position);
obstacle2.boundingRadius = obstacleGeometry.boundingSphere.radius;
entityManager.add(obstacle2);

const obstacles = [];
obstacles.push(obstacle1, obstacle2);

const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(obstacles);
vehicle.steering.add(obstacleAvoidanceBehavior);

const loader = new GLTFLoader();
loader.load('./assets/SUV.glb', function(glb) {
    const model = glb.scene;
    scene.add(model);
    model.matrixAutoUpdate = false;
    vehicle.scale.set(0.5, 0.5, 0.5);
    vehicle.setRenderComponent(model, sync);
});

const position = [];
for(let i = 0; i < path._waypoints.length; i++) {
    const waypoint = path._waypoints[i];
    position.push(waypoint.x, waypoint.y, waypoint.z);
}

const lineGeometry = new THREE.BufferGeometry();
lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));

const lineMaterial = new THREE.LineBasicMaterial({color: 0xFFFFFF});
const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
scene.add(lines);

const time = new YUKA.Time();

function animate() {
    const delta = time.update().getDelta();
    entityManager.update(delta);
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});