import React from 'react';
import * as THREE from "three";
import {Base} from "./_components";

const EARTH_PATH = "images/land_ocean_ice_cloud_2048.jpg";
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 0.1;
const FAR = 10000;

class App extends Base {

  container = null;
  renderer = null;
  scene = null;
  camera = null;
  globe = null;

  constructor(props) {
    super(props);

    this.container = React.createRef();

    this.animate = this.animate.bind(this);
  }


  componentDidMount() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(WIDTH, HEIGHT);

    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    this.camera.position.set(0, 0, 300);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000);
    this.scene.add(this.camera);
    this.container.appendChild(this.renderer.domElement);

    const RADIUS = 200;
    const SEGMENTS = 50;
    const RINGS = 50;
    this.globe = new THREE.Group();
    this.scene.add(this.globe);

    let loader = new THREE.TextureLoader();
    loader.load(
      EARTH_PATH,
      texture => {

        // Create the sphere
        let sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);
        // Map the texture to the material.
        let material = new THREE.MeshBasicMaterial({map: texture, overdraw: 0.5});
        // Create a new mesh with sphere geometry.
        let mesh = new THREE.Mesh(sphere, material);

        // Add mesh to globe
        this.globe.add(mesh);

      },
      null,
      err => {
        console.log({err})
      });
    this.globe.position.z = -300;

    const pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 400;
    this.scene.add(pointLight);

    this.animate()
  }


  animate() {
    // render:
    this.renderer.render(this.scene, this.camera);

    // rotate
    this.globe.rotation.y += 0.003;
    // this.globe.rotation.x += 0.01;

    // schedule the next frame:
    requestAnimationFrame(this.animate);
  }


  render() {
    return (
      <div
        ref={node => this.container = node}
        // style={{width: `100vw`, height: `100vh`}}
      />
    );
  }

}

export {App};
