import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { connect } from "react-redux";
import { scene, camera, controls, renderer, theme } from "./runtime";
import TWEEN from "@tweenjs/tween.js";

const executeCrossFade = (startAction, endAction, duration) => {
  // Not only the start action, but also the end action must get a weight of 1 before fading
  // (concerning the start action this is already guaranteed in this place)
  setWeight(endAction, 1);

  // Crossfade with warping - you can also try without warping by setting the third parameter to false
  startAction.crossFadeTo(endAction, duration, true);
};

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

const setWeight = (action, weight) => {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
};

const generateTarget = (model, target) => {
  // compute target rotation

  rotationMatrix.lookAt(target, model.position, model.up);
  targetQuaternion.setFromRotationMatrix(rotationMatrix);
};

const clock = new THREE.Clock();
const loader = new GLTFLoader();
const raycaster = new THREE.Raycaster();
const rotationMatrix = new THREE.Matrix4();
const targetQuaternion = new THREE.Quaternion();
const rotSpeed = 5;
let mixer;
let doClickOnRelease = false;

const World = () => {
  const canvasContainer = useRef();
  const [model, setModel] = useState();
  const [environment, setEnvironment] = useState();
  const [animationClips, setAnimationClips] = useState();
  const [currentAnimation, setCurrentAnimation] = useState("idle");
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    model && environment && createWorld(canvasContainer);
  }, [model, environment]);

  useEffect(() => {
    if (model) {
      const { x, y, z } = playerPos;

      const distance = playerPos.distanceTo(model.position);

      changeAnimation("idle", "happy_walk");
      var position = {
        x: model.position.x,
        y: model.position.y,
        z: model.position.z,
      };
      var target = { x, y, z };

      TWEEN.removeAll();

      // Movement

      const move = new TWEEN.Tween(position).to(target, 650 * distance).start();

      generateTarget(model, new THREE.Vector3(x, y, z));

      move.onUpdate(function () {
        model.position.x = position.x;
        model.position.z = position.z;
      });
      move.onComplete(() => {
        changeAnimation("happy_walk", "idle");
      });
    }
  }, [playerPos]);

  useEffect(() => {
    loader.load("./player.glb", (gltf) => {
      setModel(gltf.scene);
      const animations = gltf.animations;
      mixer = new THREE.AnimationMixer(gltf.scene);
      const clips = animations.map((anim) => {
        let clip = mixer.clipAction(anim);
        anim.name === "happy_walk" && setWeight(clip, 0);
        clip.play();
        return clip;
      });
      setAnimationClips(clips);
    });

    loader.load("./scene_1.glb", (gltf) => {
      const floor_skin = new THREE.TextureLoader().load("./floor_diffuse.jpg");
      floor_skin.wrapS = THREE.RepeatWrapping;
      floor_skin.wrapT = THREE.RepeatWrapping;

      const floor_mtl = new THREE.MeshPhongMaterial({
        map: floor_skin,
        color: 0xffffff,
      });

      gltf.scene.traverse((o) => {
        if (o.isMesh) {
          o.receiveShadow = true;
          o.castShadow = true;
          o.material.metalness = 0;
          if (o.name === "Plane") o.material = floor_mtl;
        }
      });
      setEnvironment(gltf.scene);
    });
  }, []);

  /**
   * Play the initial animation
   */

  useEffect(() => {
    if (mixer && animationClips.length > 0) {
      changeAnimation("idle", "idle");
    }
  }, [animationClips]);

  useEffect(() => {
    resizeWindow();
    window.addEventListener("resize", () => resizeWindow());
  }, []);

  function resizeWindow() {
    const { width, height } = getSize();
    renderer.setSize(width, height);
    camera.aspect = width / height;
  }

  useEffect(() => {
    /**
     * We hand set the size of the renderer intitially, the state is then used
     * during window resize
     */
    const { width, height } = canvasContainer.current.getBoundingClientRect();
    renderer.setSize(width, height);
  }, []);

  /**
   *
   * METHODS
   */

  const changeAnimation = (fromAnim, toAnim) => {
    const from = animationClips.find((anim) => anim._clip.name === fromAnim);
    const to = animationClips.find((anim) => anim._clip.name === toAnim);
    executeCrossFade(from, to, 0.2);
    setCurrentAnimation(toAnim);
  };

  const handleMouseClick = (event) => {
    event.preventDefault();
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = -(event.clientY / window.innerHeight) * 2 + 1;
    const pos = new THREE.Vector2(x, y);
    raycaster.setFromCamera(pos, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects[0]) {
      const floor = intersects.filter((mesh) => mesh.object.name === "Plane");
      if (floor[0]) {
        const { x, y, z } = floor[0].point;
        setPlayerPos(new THREE.Vector3(x, y, z));
      }
    }
  };

  /**
   * A function to return a shaped object of the containers dimensions
   */
  const getSize = () => {
    const { width, height } = canvasContainer.current.getBoundingClientRect();
    return { width, height };
  };

  const createWorld = (canvasContainer) => {
    const { current: parent } = canvasContainer;
    const { lights } = theme;

    parent.appendChild(renderer.domElement);

    lights.forEach((light) => scene.add(light));

    const player_skin = new THREE.TextureLoader().load("./player_diffuse.jpg");

    player_skin.flipY = false;

    const player_mtl = new THREE.MeshPhongMaterial({
      map: player_skin,
      color: 0xffffff,
      skinning: true,
    });

    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.material = player_mtl;
      }
    });
    scene.add(model);
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

      if (model && !model.quaternion.equals(targetQuaternion)) {
        var step = rotSpeed * delta;
        model.quaternion.rotateTowards(targetQuaternion, step);
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

export default connect(null)(World);
