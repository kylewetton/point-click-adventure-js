import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

const loader = new GLTFLoader();

export const rotationMatrix = new THREE.Matrix4();
export const targetQuaternion = new THREE.Quaternion();
export const rotSpeed = 5;

export const executeCrossFade = (startAction, endAction, duration) => {
  // Not only the start action, but also the end action must get a weight of 1 before fading
  // (concerning the start action this is already guaranteed in this place)
  setWeight(endAction, 1);

  // Crossfade with warping - you can also try without warping by setting the third parameter to false
  startAction.crossFadeTo(endAction, duration, true);
};

// This function is needed, since animationAction.crossFadeTo() disables its start action and sets
// the start action's timeScale to ((start animation's duration) / (end animation's duration))

export const setWeight = (action, weight) => {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
};

export const generateRotationTarget = (model, target) => {
  // compute target rotation

  rotationMatrix.lookAt(target, model.position, model.up);
  targetQuaternion.setFromRotationMatrix(rotationMatrix);
};

/**
 * A function to return a shaped object of the containers dimensions
 */
export const getSize = (el) => {
  const { width, height } = el.getBoundingClientRect();
  return { width, height };
};

export const handleLoadEnvironment = (settings, loadEnvironment) => {
  const { path, textures } = settings;

  loader.load(path, (gltf) => {
    const materials = textures.map((entry) => {
      const { label, path, customWrapping } = entry;
      const skin = new THREE.TextureLoader().load(path);
      if (customWrapping) {
        skin.wrapS = THREE.RepeatWrapping;
        skin.wrapT = THREE.RepeatWrapping;
      }

      const mtl = new THREE.MeshPhongMaterial({
        map: skin,
        color: 0xffffff,
        metalness: 0,
      });

      const data = { label, mtl };
      return data;
    });

    gltf.scene.traverse((o) => {
      if (o.isMesh) {
        const material = materials.find(
          (material) => material.label === o.name
        );

        o.receiveShadow = true;
        o.castShadow = true;
        if (material) {
          o.material = material.mtl;
        }
      }
    });
    loadEnvironment({ model: gltf.scene });
  });
};

export const handleLoadPlayer = (
  settings,
  loadPlayer,
  setPlayerMaterial,
  outfit
) => {
  const { path, textures } = settings;

  loader.load(path, (gltf) => {
    const model = gltf.scene;
    const skin = new THREE.TextureLoader().load(textures[0].path);

    skin.flipY = false;

    const mtl = new THREE.MeshPhongMaterial({
      map: skin,
      color: 0xffffff,
      skinning: true,
    });

    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.material = mtl;
      }
    });

    loadPlayer({ model: gltf });
  });
};
