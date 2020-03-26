import React from 'react';
import * as THREE from "three";
import {Base} from "./_components";

import "./_static/css/globe.css";

const EARTH_PATH = "images/earth2048.jpg";
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const VIEW_ANGLE = 45;
const ASPECT = WIDTH / HEIGHT;
const NEAR = 0.1;
const FAR = 10000;
const RADIUS = 200;
const SEGMENTS = 50;
const RINGS = 50;

class App extends Base {

  container = null;

  state = {
    renderer: null,
    scene: null,
    camera: null,
    globe: null,
  };


  constructor(props) {
    super(props);

    // refs
    this.container = React.createRef();

    // bindings
    this.animate = this.animate.bind(this);
    this.onLoadTexture = this.onLoadTexture.bind(this);
  }


  async componentDidMount() {
    let renderer = new THREE.WebGLRenderer();
    renderer.setSize(WIDTH, HEIGHT);

    // append the renderer to the DOM
    this.container.appendChild(renderer.domElement);

    let camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    camera.position.set(0, 0, 350);

    let scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.add(camera);

    let globe = new THREE.Group();
    scene.add(globe);

    let loader = new THREE.TextureLoader();
    loader.load(
      EARTH_PATH,
      texture => this.onLoadTexture(texture),
      null,
      err => console.log({err})
    );

    // set initial position
    globe.position.z = -300;

    let pointLight = new THREE.PointLight(0xFFFFFF);
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 400;
    scene.add(pointLight);

    await this.setStateAsync({
      renderer,
      scene,
      camera,
      globe,
    });

    this.animate();
  }


  /**
   *
   */
  async animate() {
    let {
      renderer,
      scene,
      camera,
      globe,
    } = this.state;

    // render:
    renderer.render(scene, camera);

    // rotate
    globe.rotation.y += 0.002;
    // globe.rotation.x += 0.01;

    await this.setStateAsync({
      renderer,
      scene,
      camera,
      globe,
    });

    // schedule the next frame:
    requestAnimationFrame(this.animate);
  }


  /**
   *
   * @param texture
   * @returns {Promise<void>}
   */
  async onLoadTexture(texture) {
    let {globe} = this.state;

    // sphere geometry
    let geometry = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);

    // mesh material ...
    // let material = new THREE.MeshBasicMaterial({color: 0x51D3FF});
    let material = new THREE.MeshBasicMaterial({map: texture, overdraw: 0.5});

    // create a new mesh with sphere geometry.
    let mesh = new THREE.Mesh(geometry, material);

    // Add mesh to globe
    globe.add(mesh);

    this.setStateAsync({globe})
  }


  render() {
    return (
      <div
        className={`container`}
        ref={node => this.container = node}
      />
    );
  }

}

export {App};
