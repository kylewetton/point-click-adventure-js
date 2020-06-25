import React, { useRef, useEffect, useState } from "react";
import * as YUKA from "yuka";
import * as THREE from "three";
import { connect } from "react-redux";
import {
  scene,
  camera,
  controls,
  renderer,
  theme,
  clock,
  raycaster,
} from "./runtime";
import TWEEN from "@tweenjs/tween.js";
import {
  executeCrossFade,
  generateRotationTarget,
  rotSpeed,
  targetQuaternion,
  getSize,
} from "../../app/utils";
import { createConvexRegionHelper } from "./NavMeshHelper.js";

let doClickOnRelease = false;

/**
 * ###################
 * NAVMESH TO REFACTOR */

let entityManager, time, vehicle, navMesh, navMeshGroup;
let pathMaterial, pathHelper, graphHelper;
const loader = new YUKA.NavMeshLoader();

/** END NAVMESH TO REFACTOR
 * ########################
 */

const mapState = (state) => ({
  environment: state.main.environment,
  player: state.main.player,
  animationClips: state.main.animationClips,
  mixer: state.main.mixer,
});

const World = ({ environment, player, animationClips, mixer }) => {
  const canvasContainer = useRef();
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0, 0));

  /**
   * Did mount
   */

  useEffect(() => {
    createWorld(canvasContainer);
    changeAnimation("idle", "idle");
    resizeWindow();
    window.addEventListener("resize", () => resizeWindow());
    const { width, height } = canvasContainer.current.getBoundingClientRect();
    renderer.setSize(width, height);
  }, []);

  /**
   * Control tweening of characters position and animation changing to walk/idle
   */

  // useEffect(() => {
  //   if (player) {
  //     const { x, y, z } = playerPos;

  //     const distance = playerPos.distanceTo(player.position);

  //     changeAnimation("idle", "happy_walk");
  //     var position = {
  //       x: player.position.x,
  //       y: player.position.y,
  //       z: player.position.z,
  //     };
  //     var target = { x, y, z };

  //     TWEEN.removeAll();

  //     // Movement

  //     const move = new TWEEN.Tween(position).to(target, 650 * distance).start();

  //     generateRotationTarget(player, new THREE.Vector3(x, y, z));

  //     move.onUpdate(function () {
  //       player.position.x = position.x;
  //       player.position.z = position.z;
  //     });
  //     move.onComplete(() => {
  //       changeAnimation("happy_walk", "idle");
  //     });
  //   }
  // }, [playerPos]);

  const resizeWindow = () => {
    const { width, height } = getSize(canvasContainer.current);
    renderer.setSize(width, height);
    camera.aspect = width / height;
  };

  /**
   *
   * METHODS
   */

  const changeAnimation = (fromAnim, toAnim) => {
    const from = animationClips.find((anim) => anim._clip.name === fromAnim);
    const to = animationClips.find((anim) => anim._clip.name === toAnim);
    executeCrossFade(from, to, 0.2);
  };

  const handleMouseClick = (event) => {
    /**
     * ###################
     * NAVMESH TO REFACTOR */

    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const pos = new THREE.Vector2(x, y);

    raycaster.setFromCamera(pos, camera);

    const intersects = raycaster.intersectObject(navMeshGroup, true);

    if (intersects.length > 0) {
      findPathTo(new YUKA.Vector3().copy(intersects[0].point));
    }

    /** END NAVMESH TO REFACTOR
     * ########################
     */

    /**
     * OLD METHOD
     */
    // event.preventDefault();
    // const x = (event.clientX / window.innerWidth) * 2 - 1;
    // const y = -(event.clientY / window.innerHeight) * 2 + 1;
    // const pos = new THREE.Vector2(x, y);
    // raycaster.setFromCamera(pos, camera);
    // const intersects = raycaster.intersectObjects(scene.children, true);
    // if (intersects[0]) {
    //   const floor = intersects.filter(
    //     (mesh) => mesh.object.name === "playarea"
    //   );
    //   if (floor[0]) {
    //     const { x, y, z } = floor[0].point;
    //     setPlayerPos(new THREE.Vector3(x, y, z));
    //   }
    // }
  };

  /**
   * ###################
   * NAVMESH TO REFACTOR */

  const findPathTo = (target) => {
    const from = vehicle.position;
    const to = target;

    const path = navMesh.findPath(from, to);

    pathHelper.visible = true;
    pathHelper.geometry.dispose();
    pathHelper.geometry = new THREE.BufferGeometry().setFromPoints(path);

    const followPathBehavior = vehicle.steering.behaviors[0];
    followPathBehavior.active = true;
    followPathBehavior.path.clear();

    for (const point of path) {
      followPathBehavior.path.add(point);
    }
  };

  const sync = (entity, renderComponent) => {
    renderComponent.matrix.copy(entity.worldMatrix);
  };

  /** END NAVMESH TO REFACTOR
   * ########################
   */

  const createWorld = (canvasContainer) => {
    const { current: parent } = canvasContainer;
    const { lights } = theme;

    /**
     * ###################
     * NAVMESH TO REFACTOR */

    pathMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    pathHelper = new THREE.Line(new THREE.BufferGeometry(), pathMaterial);
    pathHelper.visible = false;
    scene.add(pathHelper);

    player.matrixAutoUpdate = false;
    scene.add(player);

    loader.load("./navmesh_2.gltf").then((navigationMesh) => {
      // visualize convex regions

      navMesh = navigationMesh;
      navMeshGroup = createConvexRegionHelper(navMesh);

      scene.add(navMeshGroup);

      entityManager = new YUKA.EntityManager();
      time = new YUKA.Time();

      vehicle = new YUKA.Vehicle();
      vehicle.navMesh = navMesh;
      vehicle.maxSpeed = 1.5;
      vehicle.maxForce = 10;
      vehicle.setRenderComponent(player, sync);

      const followPathBehavior = new YUKA.FollowPathBehavior();
      followPathBehavior.active = false;
      vehicle.steering.add(followPathBehavior);

      entityManager.add(vehicle);
      animate();
    });

    /** END NAVMESH TO REFACTOR
     * ########################
     */

    parent.appendChild(renderer.domElement);

    lights.forEach((light) => scene.add(light));

    scene.add(environment);

    const animate = () => {
      var delta = clock.getDelta();
      const playerSpeed = vehicle.getSpeedSquared();

      if (mixer) {
        mixer.update(delta);
      }
      controls.update();
      requestAnimationFrame(animate);

      if (playerSpeed < 0.01) {
        changeAnimation("idle", "happy_walk", true);
      } else {
        changeAnimation("happy_walk", "idle", false);
      }

      const dta = time.update().getDelta();

      entityManager.update(dta);

      camera.updateProjectionMatrix();
      TWEEN.update();

      /**
       * Smooth turning of player
       */
      // if (!player.quaternion.equals(targetQuaternion)) {
      //   var step = rotSpeed * delta;
      //   player.quaternion.rotateTowards(targetQuaternion, step);
      // }

      renderer.render(scene, camera);
    };
  };

  return (
    <div
      onMouseDown={() => (doClickOnRelease = true)}
      onMouseMove={() => (doClickOnRelease = false)}
      onMouseUp={(e) => doClickOnRelease && handleMouseClick(e)}
      className="viewer"
      ref={canvasContainer}
    />
  );
};

export default connect(mapState)(World);
