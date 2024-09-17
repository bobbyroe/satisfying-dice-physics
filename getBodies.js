import * as THREE from "three";

function getBody(RAPIER, world, model) {
    const size = 0.5;
    const colliderSize = size * 0.5;
    const range = 6;
    const density = size  * 1;
    let x = Math.random() * range - range * 0.5;
    let y = Math.random() * range - range * 0.5 + 3;
    let z = Math.random() * range - range * 0.5;

    // RIGID BODY
    let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic()
            .setTranslation(x, y, z);
    let rigid = world.createRigidBody(rigidBodyDesc);
    let colliderDesc = RAPIER.ColliderDesc.cuboid(colliderSize, colliderSize, colliderSize).setDensity(density);
    world.createCollider(colliderDesc, rigid);

    const mesh = model.clone();
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
      }
    });
    mesh.scale.setScalar(size);
    
    function update () {
      rigid.resetForces(true); 
      let pos = rigid.translation();
      mesh.position.copy(pos);
      let q = rigid.rotation();
      let rote = new THREE.Quaternion(q.x, q.y, q.z, q.w);
      mesh.rotation.setFromQuaternion(rote);
      if (pos.y < -10) {
        rigid.setLinvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
        rigid.setAngvel({ x: 0.0, y: 0.0, z: 0.0 }, true);
        rigid.setTranslation({ x: x, y: 10.0, z: z });
      }
    }
    return { mesh, rigid, update };
  }

  function getMouseBall (RAPIER, world) {
    const mouseSize = 0.5;
    const geometry = new THREE.IcosahedronGeometry(mouseSize, 8);
    const material = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
    });
    const mouseLight = new THREE.PointLight(0xffffff, 1);
    const mouseMesh = new THREE.Mesh(geometry, material);
    mouseMesh.add(mouseLight);

    // RIGID BODY
    let bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0)
    let mouseRigid = world.createRigidBody(bodyDesc);
    let dynamicCollider = RAPIER.ColliderDesc.ball(mouseSize * 2.0);
    world.createCollider(dynamicCollider, mouseRigid);
    function update (mousePos) {
      mouseRigid.setTranslation({ x: mousePos.x, y: mousePos.y + 0.5, z: mousePos.z });
      let { x, y, z } = mouseRigid.translation();
      mouseMesh.position.set(x, y, z);
    }
    return { mesh: mouseMesh, update };
  }

  export { getBody, getMouseBall };