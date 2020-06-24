import * as THREE from "three";

export default class Theme {
  constructor(theme) {
    this.settings = theme;
    this.lights = [];
    this.build();
  }

  build() {
    this.background = this.settings.background;
    this.buildLights();
    this.buildFloor();
  }

  buildLights() {
    const { lights } = this.settings;
    const hemi = lights.filter((light) => light.id === "hemi");
    const directional = lights.filter((light) => light.id === "directional");

    hemi.forEach((light) => {
      const { x, y, z } = light.position;

      const hemiLight = new THREE.HemisphereLight(
        light.sky,
        light.ground,
        light.intensity
      );
      hemiLight.position.set(x, y, z);
      this.lights.push(hemiLight);
    });

    directional.forEach((light) => {
      const { x, y, z } = light.position;
      const directionalLight = new THREE.DirectionalLight(
        light.color,
        light.intensity
      );
      directionalLight.position.set(x, y, z);
      directionalLight.castShadow = light.shadows;
      directionalLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
      this.lights.push(directionalLight);
    });
  }

  buildFloor() {
    const floorGeometry = new THREE.PlaneGeometry(5, 5, 50, 50);

    const floorMaterial = new THREE.ShadowMaterial();
    floorMaterial.opacity = this.settings.floor.shadowOpacity;
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);

    floor.rotation.x = -0.5 * Math.PI;
    floor.receiveShadow = true;

    this.floor = floor;
  }
}
