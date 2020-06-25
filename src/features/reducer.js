import * as THREE from "three";
import { createSlice } from "@reduxjs/toolkit";
import { setWeight } from "../app/utils";

export const projectSlice = createSlice({
  name: "project",
  initialState: {
    loaded: false,
    player: null,
    environment: null,
    mixer: null,
    animationClips: [],
  },
  reducers: {
    loadEnvironment(state, action) {
      const { model } = action.payload;

      state.environment = model;
      if (state.player) {
        state.loaded = true;
      }
    },
    loadPlayer(state, action) {
      const { model } = action.payload;
      const mixer = new THREE.AnimationMixer(model.scene);
      const clips = model.animations.map((anim) => {
        let clip = mixer.clipAction(anim);
        anim.name === "happy_walk" && setWeight(clip, 0);
        clip.play();
        return clip;
      });

      state.mixer = mixer;
      state.player = model.scene;
      state.animationClips = clips;
      if (state.environment) {
        state.loaded = true;
      }
    },
    setPlayerMaterial(state, action) {
      const outfit = action.payload;

      state.player.traverse((o) => {
        if (o.isMesh) {
          o.material = outfit;
        }
      });
    },
  },
});

export const {
  loadPlayer,
  loadEnvironment,
  setPlayerMaterial,
} = projectSlice.actions;

export default projectSlice.reducer;
