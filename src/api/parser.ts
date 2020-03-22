import { Socket } from "socket.io";
import { Marked } from "@ts-stack/markdown";
import text from "../api/text";

export type MiddlewareNext = (
  err: Error | null,
  req: MuRequest
) => Promise<any>;

export type MiddlewareLayer = (
  data: MuRequest,
  next: MiddlewareNext
) => Promise<MuResponse>;

export interface MuRequest {
  socket: Socket;
  payload: {
    command: string;
    message?: string;
    [key: string]: any;
  };
}
export interface MuResponse {
  id: string;
  payload: {
    command: string;
    message?: string;
    [key: string]: any;
  };
}

export class Parser {
  private stack: MiddlewareLayer[];

  constructor() {
    this.stack = [];
  }

  async process(req: MuRequest): Promise<MuResponse> {
    const command = req.payload.command;
    const socket = req.socket;
    const message = req.payload.message;
    const data = req.payload.data;

    switch (command) {
      case "message":
        return this._handle(req);
      case "connect":
        return {
          id: socket.id,
          payload: {
            command: "message",
            message: text.get("connect")
              ? Marked.parse(text.get("connect"))
              : "File Not Found!"
          }
        };
      default:
        return {
          id: socket.id,
          payload: {
            command: "message",
            message
          }
        };
    }
  }

  /**
   * Add a new middleware to text input stack.
   * @param layer The layer to add to the middleware stack.
   */
  use(layer: MiddlewareLayer) {
    this.stack.push(layer);
  }

  /**
   * Run a string through a series of middleware.
   * @param data The string to be pushed through the pipeline.
   */
  private async _handle(req: MuRequest): Promise<MuResponse> {
    let idx = 0;

    /**
     * Recursive function to walk through each piece of
     * middleware in the stack.
     * @param err Any possible errors hit by the middleware.
     * @param data The string the middleware pipeline is going
     * to be working with
     */
    const next = async (
      err: Error | null,
      req: MuRequest
    ): Promise<MuResponse> => {
      // Return early if there's an error, or if we've processed through
      // the entire stack.
      if (err != null) return Promise.reject(err);
      if (idx === this.stack.length) {
        return {
          id: req.socket.id,
          payload: req.payload
        };
      }

      // Grab a new layer from the stack
      const layer = this.stack[idx++];
      // Run the layer
      return await layer(req, next);
    };

    // Return the modified data.
    return await next(null, req).catch((err: Error) => next(err, req));
  }
}

const parser = new Parser();
export default parser;
