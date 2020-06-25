import React, { useRef, useEffect, useState } from "react";
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

let doClickOnRelease = false;

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

  useEffect(() => {
    if (player) {
      const { x, y, z } = playerPos;

      const distance = playerPos.distanceTo(player.position);

      changeAnimation("idle", "happy_walk");
      var position = {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z,
      };
      var target = { x, y, z };

      TWEEN.removeAll();

      // Movement

      const move = new TWEEN.Tween(position).to(target, 650 * distance).start();

      generateRotationTarget(player, new THREE.Vector3(x, y, z));

      move.onUpdate(function () {
        player.position.x = position.x;
        player.position.z = position.z;
      });
      move.onComplete(() => {
        changeAnimation("happy_walk", "idle");
      });
    }
  }, [playerPos]);

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
    event.preventDefault();
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const pos = new THREE.Vector2(x, y);
    raycaster.setFromCamera(pos, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects[0]) {
      const floor = intersects.filter(
        (mesh) => mesh.object.name === "playarea"
      );
      if (floor[0]) {
        const { x, y, z } = floor[0].point;
        setPlayerPos(new THREE.Vector3(x, y, z));
      }
    }
  };

  const createWorld = (canvasContainer) => {
    const { current: parent } = canvasContainer;
    const { lights } = theme;

    parent.appendChild(renderer.domElement);

    lights.forEach((light) => scene.add(light));

    scene.add(player);
    scene.add(environment);

    const animate = () => {
      var delta = clock.getDelta();
      if (mixer) {
        mixer.update(delta);
      }
      controls.update();
      requestAnimationFrame(animate);
      camera.updateProjectionMatrix();
      TWEEN.update();

      /**
       * Smooth turning of player
       */
      if (!player.quaternion.equals(targetQuaternion)) {
        var step = rotSpeed * delta;
        player.quaternion.rotateTowards(targetQuaternion, step);
      }

      renderer.render(scene, camera);
    };
    animate();
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
