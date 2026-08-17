/// <reference lib="webworker" />
import {
  initializeCore,
  randomSync,
  solveSync,
  validatePhysical,
} from "./core";

type Request =
  | { id: number; type: "initialize" }
  | { id: number; type: "random" }
  | { id: number; type: "validate"; facelets: string }
  | { id: number; type: "solve"; facelets: string };
type Response =
  | { id: number; type: "ok"; value?: unknown }
  | { id: number; type: "error"; message: string };

self.onmessage = ({ data }: MessageEvent<Request>) => {
  try {
    if (data.type === "initialize") {
      initializeCore();
      respond({ id: data.id, type: "ok" });
    } else if (data.type === "random")
      respond({ id: data.id, type: "ok", value: randomSync() });
    else if (data.type === "validate")
      respond({
        id: data.id,
        type: "ok",
        value: validatePhysical(data.facelets),
      });
    else respond({ id: data.id, type: "ok", value: solveSync(data.facelets) });
  } catch (error) {
    respond({
      id: data.id,
      type: "error",
      message: error instanceof Error ? error.message : "Ошибка решателя.",
    });
  }
};

function respond(message: Response): void {
  self.postMessage(message);
}
