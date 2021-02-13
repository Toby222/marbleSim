import React from "react";

import planck from "planck-js";
import { Renderer } from "../lib/Renderer";
import { Runner } from "../lib/Runner";

import { Util } from "../lib/Util";
import { AnyTool } from "../lib/tool/BaseTool";
import { ToolBar } from "./ToolBar";

type Props = Record<string, never>;

interface State {
  tool: AnyTool;
}

interface UserData {
  markedForDeletion: boolean;
}

export class Scene extends React.Component<Props, State> {
  canvas: React.RefObject<HTMLCanvasElement>;
  toolbar: React.RefObject<HTMLDivElement>;
  fpsCounter: React.RefObject<HTMLSpanElement>;

  world: planck.World;
  renderer: Renderer;
  runner: Runner;

  edge: planck.Body;

  constructor(props: Props) {
    super(props);
    this.world = new planck.World({
      gravity: new planck.Vec2(0, 10),
      // allowSleep: false,
    });

    this.state = {
      tool: Util.tools[0],
    };

    this.canvas = React.createRef();
    this.toolbar = React.createRef();
    this.fpsCounter = React.createRef();
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
    this.runner.stop();

    delete this.renderer;
    delete this.runner;
    delete this.world;
  }

  componentDidMount() {
    const context = this.canvas.current.getContext("2d");
    this.handleResize();

    const clientWidth = this.canvas.current.clientWidth;
    const clientHeight = this.canvas.current.clientHeight;
    const corners = [
      planck.Vec2(0, 0), // NW
      planck.Vec2(clientWidth, 0), // NE
      planck.Vec2(clientWidth, clientHeight), // SE
      planck.Vec2(0, clientHeight), // SW
    ];

    this.edge = this.world.createBody();
    this.edge.createFixture(planck.Chain([...corners, corners[0]]));

    this.edge.render = { hidden: true };

    this.world.on("begin-contact", (contact: planck.Contact) => {
      if (
        contact.getFixtureA().getBody() === this.edge &&
        contact.getFixtureA().isSensor()
      ) {
        contact
          .getFixtureB()
          .getBody()
          .setUserData({ markedForDeletion: true });
      }

      if (
        contact.getFixtureA().getBody() === this.edge &&
        contact.getFixtureB().isSensor()
      ) {
        contact
          .getFixtureA()
          .getBody()
          .setUserData({ markedForDeletion: true });
      }
    });

    this.renderer = new Renderer(this.world, context, {
      scale: 1,
      wireframe: false,
      lineWidth: 2,
    });
    this.runner = new Runner(this.world, { fps: 30, speed: 30 });

    window.addEventListener("resize", () => this.handleResize());

    this.canvas.current.addEventListener("click", (event: MouseEvent) => {
      this.state.tool?.click?.(event, this.world, this.canvas.current);
    });
    this.canvas.current.addEventListener("mousedown", (event: MouseEvent) => {
      this.state.tool?.mousedown?.(event, this.world, this.canvas.current);
    });
    this.canvas.current.addEventListener("mouseup", (event: MouseEvent) => {
      this.state.tool?.mouseup?.(event, this.world, this.canvas.current);
    });
    this.canvas.current.addEventListener("keydown", (_event: KeyboardEvent) => {
      // TODO: Move camera here
    });

    const render = () => {
      this.renderer.renderWorld();
      if (this.fpsCounter.current)
        this.fpsCounter.current.innerText = `FPS: ${Math.round(
          this.runner.fps
        )}; Bodies: ${this.world.getBodyCount()}`;
    };

    const update = () => {
      for (let body = this.world.getBodyList(); body; body = body.getNext()) {
        if ((body.getUserData() as UserData)?.markedForDeletion) {
          this.world.destroyBody(body);
        }
      }
    };

    this.runner.start(render, update);
  }

  handleResize() {
    if (!(this.canvas?.current ?? false)) {
      return console.debug("canvas is not defined. This shouldn't happen.");
    }
    this.canvas.current.width = window.innerWidth;
    this.canvas.current.height = window.innerHeight - 50;
  }

  render() {
    return (
      <>
        <ToolBar scene={this} />
        <canvas id="marble-sim" ref={this.canvas} />
      </>
    );
  }
}
