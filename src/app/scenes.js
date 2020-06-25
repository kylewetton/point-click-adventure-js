const scenes = [
  {
    path: "./scene_1.glb",
    textures: [
      {
        label: "playarea",
        path: "./floor_diffuse.jpg",
        customWrapping: true,
      },
      {
        label: "road",
        path: "./road.jpg",
        customWrapping: true,
      },
      {
        label: "building_a",
        path: "./uvtest.jpg",
        customWrapping: true,
      },
    ],
  },
];

export const player = {
  path: "./player.glb",
  textures: [
    {
      label: "main",
      path: "./player_diffuse.jpg",
    },
  ],
};

export default scenes;
