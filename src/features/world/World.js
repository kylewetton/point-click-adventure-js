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
import { executeCrossFade, getSize } from "../../app/utils";
import { createConvexRegionHelper } from "./NavMeshHelper.js";
import { playerSettings } from "../../app/playerControllerConfig";
const {
  animCrossFadeSpeed,
  maxSpeed,
  maxForce,
  speedToForceStop,
  speedToStartWalking,
  arriveTolerance,
} = playerSettings;

let doClickOnRelease = false;

/**
 * ###################
 * NAVMESH TO REFACTOR */

let entityManager, time, vehicle, navMesh, navMeshGroup;
let pathMaterial, pathHelper;
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
  const playerSpeed = useRef(0);
  const [playerIsMoving, setplayerIsMoving] = useState(false);

  /**
   * Did mount
   */

  useEffect(() => {
    createWorld(canvasContainer);
    resizeWindow();
    window.addEventListener("resize", () => resizeWindow());
    const { width, height } = canvasContainer.current.getBoundingClientRect();
    renderer.setSize(width, height);
  }, []);

  const resizeWindow = () => {
    const { width, height } = getSize(canvasContainer.current);
    renderer.setSize(width, height);
    camera.aspect = width / height;
  };

  useEffect(() => {
    if (playerIsMoving) {
      changeAnimation("idle", "happy_walk");
    } else {
      changeAnimation("happy_walk", "idle");
    }
  }, [playerIsMoving]);

  /**
   *
   * METHODS
   */

  const changeAnimation = (fromAnim, toAnim) => {
    const from = animationClips.find((anim) => anim._clip.name === fromAnim);
    const to = animationClips.find((anim) => anim._clip.name === toAnim);
    executeCrossFade(from, to, animCrossFadeSpeed);
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
    //  scene.add(pathHelper);

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
      vehicle.maxSpeed = maxSpeed;
      vehicle.maxForce = maxForce;
      vehicle.setRenderComponent(player, sync);

      const followPathBehavior = new YUKA.FollowPathBehavior();
      followPathBehavior.active = false;
      followPathBehavior._arrive.tolerance = arriveTolerance;
      followPathBehavior._arrive.deceleration = 0;

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

    let isMoving = false;

    const animate = () => {
      const delta = clock.getDelta();

      if (vehicle.maxSpeed === 0) {
        vehicle.maxSpeed = maxSpeed;
      }
      playerSpeed.current = vehicle.getSpeedSquared();

      if (playerSpeed.current > speedToStartWalking) {
        if (playerSpeed.current > speedToForceStop) {
          isMoving = true;
        }
        setplayerIsMoving(true);
      } else {
        setplayerIsMoving(false);
      }

      // Force stop on dime
      if (isMoving === true && playerSpeed.current < speedToForceStop) {
        vehicle.maxSpeed = 0;
        isMoving = false;
      }

      mixer.update(delta);
      controls.update();
      requestAnimationFrame(animate);

      const dta = time.update().getDelta();

      entityManager.update(dta);

      camera.updateProjectionMatrix();

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
