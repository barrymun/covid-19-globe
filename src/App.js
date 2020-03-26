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
    isMouseDown: false,
    lastPosition: null,
  };


  constructor(props) {
    super(props);

    // refs
    this.container = React.createRef();

    // bindings
    this.mouseDown = this.mouseDown.bind(this);
    this.mouseMove = this.mouseMove.bind(this);
    this.mouseUp = this.mouseUp.bind(this);
    this.rotate = this.rotate.bind(this);
    this.build = this.build.bind(this);
    this.spin = this.spin.bind(this);
    this.onLoadTexture = this.onLoadTexture.bind(this);
  }


  async componentDidMount() {
    // listeners
    window.addEventListener("mousedown", this.mouseDown);
    window.addEventListener("mousemove", this.mouseMove);
    window.addEventListener("mouseup", this.mouseUp);

    // init
    await this.build();
  }


  componentWillUnmount() {
    // destroy listeners
    window.removeEventListener("mousedown", this.mouseDown);
    window.removeEventListener("mousemove", this.mouseMove);
    window.removeEventListener("mouseup", this.mouseUp);
  }


  /**
   *
   * @param e
   * @returns {Promise<void>}
   */
  async mouseDown(e) {
    await this.setStateAsync({isMouseDown: true, lastPosition: null});
  }


  /**
   *
   * @param e
   * @returns {Promise<void>}
   */
  async mouseMove(e) {
    let {
      isMouseDown,
      lastPosition,
    } = this.state;

    // check
    if (!isMouseDown) return;

    // handle null case
    if (lastPosition == null) {
      lastPosition = {
        x: e.clientX,
        y: e.clientY,
      };
    }

    const moveX = (e.clientX - lastPosition.x);
    const moveY = (e.clientY - lastPosition.y);

    await this.rotate({
      y: (moveX * 0.002),
      x: (moveY * 0.002),
    });

    await this.setStateAsync(prevState => ({
      lastPosition: {
        ...prevState.lastPosition,
        x: e.clientX,
        y: e.clientY,
      },
    }));

  }


  /**
   *
   * @param e
   * @returns {Promise<void>}
   */
  async mouseUp(e) {
    await this.setStateAsync({isMouseDown: false});
  }


  /**
   *
   * @returns {Promise<void>}
   */
  async build() {
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

    this.spin();
  }


  /**
   *
   */
  async spin() {
    let {
      renderer,
      scene,
      camera,
    } = this.state;

    // render:
    renderer.render(scene, camera);

    // rotate
    await this.rotate({y: 0.002});

    await this.setStateAsync({
      renderer,
      scene,
      camera,
    });

    // schedule the next frame:
    requestAnimationFrame(this.spin);
  }


  /**
   *
   * @param x
   * @param y
   * @returns {Promise<void>}
   */
  async rotate({x = 0, y = 0}) {
    let {globe} = this.state;

    // alter rotation of globe
    globe.rotation.x += x;
    globe.rotation.y += y;

    // can only move up to top of globe
    if (globe.rotation.x > 1.0) globe.rotation.x = 1.0;
    // can only move down to bottom of globe
    if (globe.rotation.x < -1.0) globe.rotation.x = -1.0;

    // set the new state
    await this.setStateAsync({globe});
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
    let material = new THREE.MeshBasicMaterial({map: texture});

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
