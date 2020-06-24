import React from "react";
import "./App.css";
import { connect } from "react-redux";
import World from "./features/world/World";
import Menu from "./features/menu/Menu";

const mapState = (state) => ({
  loaded: state.loaded,
});

function App({ loaded }) {
  //return loaded ? <World /> : <Menu />;
  return <World />;
}

export default connect(mapState)(App);
