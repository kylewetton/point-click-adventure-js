import React, { useEffect } from "react";
import "./App.css";
import { connect } from "react-redux";
import World from "./features/world/World";
import {
  loadEnvironment,
  loadPlayer,
  setPlayerMaterial,
} from "./features/reducer";
import { handleLoadEnvironment, handleLoadPlayer } from "./app/utils";
import scenes, { player } from "./app/scenes";
import Menu from "./features/menu/Menu";

const mapState = (state) => ({
  loaded: state.main.loaded,
});

const mapDispatch = { loadEnvironment, loadPlayer, setPlayerMaterial };

function App({ loaded, loadEnvironment, loadPlayer, setPlayerMaterial }) {
  useEffect(() => {
    handleLoadEnvironment(scenes[0], loadEnvironment);
    handleLoadPlayer(player, loadPlayer, setPlayerMaterial, "main");
  }, []);

  return loaded ? <World /> : <Menu />;
  // return <Menu />;
}

export default connect(mapState, mapDispatch)(App);
