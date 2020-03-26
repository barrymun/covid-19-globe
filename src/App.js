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

  constructor(props) {
    super(props);

    this.container = React.createRef();

    this.update = this.update.bind(this);
  }


  componentDidMount() {
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(WIDTH, HEIGHT);

    this.camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    this.camera.position.set(0, 0, 500);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000);
    this.scene.add(this.camera);
    this.container.appendChild(this.renderer.domElement);

    const RADIUS = 200;
    const SEGMENTS = 50;
    const RINGS = 50;
    const globe = new THREE.Group();
    this.scene.add(globe);

    let loader = new THREE.TextureLoader();
    console.log({loader})
    loader.load(EARTH_PATH, function (texture) {

      // Create the sphere
      let sphere = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);
      // Map the texture to the material.
      let material = new THREE.MeshBasicMaterial({map: texture, overdraw: 0.5});
      // Create a new mesh with sphere geometry.
      let mesh = new THREE.Mesh(sphere, material);

      // Add mesh to globe
      globe.add(mesh);

    }, undefined, function (err) {
      console.log({err})
    });
    globe.position.z = -300;

    const pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 400;
    this.scene.add(pointLight);

    requestAnimationFrame(this.update);
  }


  update() {

    //Render:
    this.renderer.render(this.scene, this.camera);
    // Schedule the next frame:
    requestAnimationFrame(this.update);
  }


  render() {
    return (
      <div
        ref={node => this.container = node}
        style={{width: `100vw`, height: `100vh`}}
      />
    );
  }

}

export {App};
