import { createSlice } from "@reduxjs/toolkit";

export const projectSlice = createSlice({
  name: "project",
  initialState: {
    loaded: false,
    player: null,
  },
  reducers: {
    initPlayer(state, action) {
      const { model } = action.payload;
      state.player = model;
    },
  },
});

export const { initPlayer } = projectSlice.actions;

export default projectSlice.reducer;
