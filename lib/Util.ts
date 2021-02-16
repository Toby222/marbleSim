import planck from "planck-js";
import { AnyTool } from "./tool/BaseTool";
import CreateBlock from "./tool/CreateBlock";
import CreateMarble from "./tool/CreateMarble";
import ClickAndDrag from "./tool/ClickAndDrag";
import DrawLine from "./tool/DrawLine";

import { Scene } from "../components/Scene";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Util {
  export const globals: {
    scene?: Scene;
  } = {};

  export function getCursorPositionInCanvas(
    canvas: HTMLCanvasElement,
    event: MouseEvent
  ) {
    if (globals.scene?.renderer === undefined) return new planck.Vec2();

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return planck.Vec2(x, y);
  }

  export const tools: AnyTool[] = [
    ClickAndDrag,
    CreateMarble,
    CreateBlock,
    DrawLine,
  ];
}
export default Util;
(global as any).util = Util;
