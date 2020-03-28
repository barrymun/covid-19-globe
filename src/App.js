import React from 'react';
import * as THREE from "three";
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import * as d3Q from "d3-queue";
import * as topojson from "topojson-client";
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
    this.windowResize = this.windowResize.bind(this);
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
    // window.addEventListener("resize", this.windowResize);
    // window.addEventListener("mousedown", this.mouseDown);
    // window.addEventListener("mousemove", this.mouseMove);
    // window.addEventListener("mouseup", this.mouseUp);

    // init
    // await this.build();
    await this.build2();
  }


  build2 = async () => {
    var width = 960,
      height = 600,
      speed = 1e-2,
      start = Date.now();

    var sphere = {type: "Sphere"};

    var projection = d3Geo.geoOrthographic()
      .scale(height / 2.1)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(.5);

    var graticule = d3Geo.geoGraticule();

    var canvas = d3.select(this.container)
      .append("canvas")
      .attr("width", width)
      .attr("height", height);

    console.log({
      canvas,
      // context,
      // path,
    })
    var context = canvas.node().getContext("2d");

    var path = d3Geo.geoPath()
      .projection(projection)
      .context(context);

    var hiddenCanvas = d3.select(this.container).append("canvas")
      .attr("width", width)
      .attr("height", height);

    var hiddenContext = hiddenCanvas.node().getContext("2d");

    var hiddenProjection = d3Geo.geoEquirectangular()
      .translate([width / 2, height / 2])
      .scale(width / 7);

    var hiddenPath = d3Geo.geoPath()
      .projection(hiddenProjection)
      .context(hiddenContext);

    // var q = d3Q.queue()
    //   .defer(d3.json, "world-110m.json")
    //   .await(function (error, topo) {
    //     console.log({error, topo})
    //   })

    // function ready(error, world, countryData) {
    //   console.log({error, world, countryData})
    // }

    let topo = await d3.json("world-110m.json")
    console.log({topo})
    var selected = false;

    var land = topojson.feature(topo, topo.objects.land),
      borders = topojson.feature(topo, topo.objects.countries),
      grid = graticule();

    // var fillToCountry = {};
    var i = borders.features.length;
    while (i--) {
      hiddenContext.beginPath();
      hiddenPath(borders.features[i]);
      hiddenContext.fillStyle = "rgb(" + i + ",0,0)";
      hiddenContext.fill();
    }

    d3.timer(function () {
      projection.rotate([speed * (Date.now() - start), -15]);

      context.clearRect(0, 0, width, height);

      context.beginPath();
      path(sphere);
      context.lineWidth = 3;
      context.strokeStyle = "#000";
      context.stroke();

      context.beginPath();
      path(sphere);
      context.fillStyle = "#fff";
      context.fill();

      context.beginPath();
      path(land);
      context.fillStyle = "#222";
      context.fill();

      context.beginPath();
      path(borders);
      context.lineWidth = .5;
      context.strokeStyle = "#fff";
      context.stroke();

      context.beginPath();
      path(grid);
      context.lineWidth = .5;
      context.strokeStyle = "rgba(119,119,119,.5)";
      context.stroke();

      if (selected !== false) {
        context.beginPath();
        path(borders.features[selected]);
        context.fillStyle = "#0ad";
        context.fill();
      }
    });

    canvas
      .on("mousemove", select)
      .on("touchstart", select);

    function select() {
      var pos = d3.mouse(this);
      var latlong = projection.invert(pos);
      var hiddenPos = hiddenProjection(latlong);
      if (hiddenPos[0] > -1) {
        var p = hiddenContext.getImageData(hiddenPos[0], hiddenPos[1], 1, 1).data;
        selected = p[0];
        context.beginPath();
        path(borders.features[selected]);
        context.fillStyle = "#0ad";
        context.fill();
      } else {
        selected = false;
      }
    }

    // d3.select(this.frameElement).style("height", (2*height) + "px");
  };


  componentWillUnmount() {
    // destroy listeners
    // window.removeEventListener("resize", this.windowResize);
    // window.removeEventListener("mousedown", this.mouseDown);
    // window.removeEventListener("mousemove", this.mouseMove);
    // window.removeEventListener("mouseup", this.mouseUp);
  }


  /**
   *
   */
  windowResize() {
    let {renderer} = this.state;

    if (renderer == null) return;

    renderer.setSize(window.innerWidth, window.innerHeight);
    this.setState({renderer});
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
   * only execute this method once when the component has been mounted
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
