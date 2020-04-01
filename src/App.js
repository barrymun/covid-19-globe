import React from 'react';
import * as THREE from "three";
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
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


  componentWillUnmount() {
    // destroy listeners
    // window.removeEventListener("resize", this.windowResize);
    // window.removeEventListener("mousedown", this.mouseDown);
    // window.removeEventListener("mousemove", this.mouseMove);
    // window.removeEventListener("mouseup", this.mouseUp);
  }


  build2 = async () => {
    let width = 960,
      height = 600,
      speed = 1e-2,
      start = Date.now();

    let sphere = {type: "Sphere"};

    this.projection = d3Geo.geoOrthographic()
      .scale(height / 2.1)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .precision(.5)
    ;
    this.graticule = d3Geo.geoGraticule();
    this.canvas = d3.select(this.container)
      .append("canvas")
      .attr("width", width)
      .attr("height", height)
    ;
    this.context = this.canvas.node().getContext("2d");
    this.path = d3Geo.geoPath()
      .projection(this.projection)
      .context(this.context)
    ;

    let hiddenCanvas = d3.select(this.container)
      .append("canvas")
      .attr("width", width)
      .attr("height", height)
      .attr("style", "display: none;")
    ;
    let hiddenContext = hiddenCanvas.node().getContext("2d");
    let hiddenProjection = d3Geo.geoEquirectangular()
      .translate([width / 2, height / 2])
      .scale(width / 7)
    ;
    let hiddenPath = d3Geo.geoPath()
      .projection(hiddenProjection)
      .context(hiddenContext)
    ;

    let topo = await d3.json("world-110m.json");
    let countryData = await d3.tsv("world-110m-country-names.tsv");
    let selected = false;
    let land = topojson.feature(topo, topo.objects.land),
      borders = topojson.feature(topo, topo.objects.countries),
      grid = this.graticule();

    let i = borders.features.length;
    while (i--) {
      hiddenContext.beginPath();
      hiddenPath(borders.features[i]);
      hiddenContext.fillStyle = "rgb(" + i + ",0,0)";
      hiddenContext.fill();
    }

    d3.timer(() => {
      this.projection.rotate([1.6 * speed * (Date.now() - start), -15]);
      this.context.clearRect(0, 0, width, height);

      this.context.beginPath();
      this.path(sphere);
      this.context.lineWidth = 3;
      this.context.strokeStyle = "#000";
      this.context.stroke();

      this.context.beginPath();
      this.path(sphere);
      this.context.fillStyle = "#fff";
      this.context.fill();

      this.context.beginPath();
      this.path(land);
      this.context.fillStyle = "#222";
      this.context.fill();

      this.context.beginPath();
      this.path(borders);
      this.context.lineWidth = .5;
      this.context.strokeStyle = "#fff";
      this.context.stroke();

      this.context.beginPath();
      this.path(grid);
      this.context.lineWidth = .5;
      this.context.strokeStyle = "rgba(119,119,119,.5)";
      this.context.stroke();

      if (selected !== false) {
        this.context.beginPath();
        this.path(borders.features[selected]);
        this.context.fillStyle = "#0ad";
        this.context.fill();
      }
    });

    const mouseMove = () => {

      if (!this.drag) {
        let pos = d3.mouse(this.context.canvas);
        let latlong = this.projection.invert(pos);
        let hiddenPos = hiddenProjection(latlong);

        if (hiddenPos[0] > -1) {
          let p = hiddenContext.getImageData(hiddenPos[0], hiddenPos[1], 1, 1).data;
          let country = null;
          let countryText = ``;
          try {
            country = borders.features[selected];
            countryText = countryData.find(o => o.id.toString() === country.id.toString());
          } catch (e) {
          }
          // console.log(countryText.name, countryText.id)
          selected = p[0];
          if (p[3] === 0) {
            // handling water hover
            selected = false;
            return;
          }
          this.context.beginPath();
          this.path(country);
          this.context.fillStyle = "#0ad";
          this.context.fill();
        } else {
          selected = false;
        }
      }
      else {
        console.log(`HERE2`, d3.event.movementX, d3.event.movementY)
        // const target = [
        //   0.25 * d3.event.movementX + this.x,
        //   -.25 * d3.event.movementY + this.y
        // ];
        // this.projection.rotate([0.25 * d3.event.movementX + this.x, -.25 * d3.event.movementY + this.y, 0]);
        // this.projection.rotate([0.25 * d3.event.movementX, -.25 * d3.event.movementY]);
      }

    };

    const mouseDown = () => {
      this.drag = true;
    };

    const mouseUp = () => {
      this.drag = false;
    };

    this.canvas
      .on("mousemove", mouseMove)
      .on("mousedown", mouseDown)
      .on("mouseup", mouseUp)
      .on("mouseleave", mouseUp)
    ;

  };


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
