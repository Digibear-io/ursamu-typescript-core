import { resolve } from "path";
import { NeDB, DBObj } from "../services/database.service";
import { readdirSync, readFileSync } from "fs";
import { Socket } from "socket.io";
import { Marked } from "@ts-stack/markdown";

/**
 *
 */
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

export interface MuCommand {
  name: string;
  pattern: RegExp;
  flags?: string;
  exec: (id: string, match: string[]) => Promise<string>;
}

export interface MuFunction {
  name: string;
  exec: (...args: any[]) => Promise<any>;
}

export interface Service {
  init(): any | Promise<any>;
}

export interface DbAdapter extends Service {
  model(...args: any[]): void | Promise<void>;
  get(...args: any[]): any | Promise<any>;
  find(...args: any[]): any | Promise<any>;
  create(...args: any[]): any | Promise<any>;
  update(...args: any[]): any | Promise<any>;
  delete(...args: any[]): any | Promise<any>;
}

export type Plugin = (app: UrsaMajor) => void;

export class UrsaMajor {
  cmds: MuCommand[];
  fns: Map<string, MuFunction>;
  db: NeDB<DBObj> | DbAdapter;
  txt: Map<string, string>;
  private plugins: Plugin[];
  private stack: MiddlewareLayer[];

  [index: string]: any;

  constructor() {
    this.db = new NeDB(resolve(__dirname, "../../data/db.db"));
    this.cmds = [];
    this.fns = new Map<string, MuFunction>();
    this.txt = new Map<string, string>();
    this.services = [];
    this.plugins = [];
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
            message: this.txt.get("connect")
              ? Marked.parse(this.txt.get("connect")!)
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
   * Load a text entry into the text file map.
   * @param name Reference name for the file to be created.
   * @param text The text to be entered. Markdown aware.
   */
  text(name: string, text: string) {
    this.txt.set(name.toLowerCase(), text);
  }

  /**
   * Add a new plugin or list of plugins to the system.
   * @param plugin Either a single, or a list of plugins.
   */
  plugin(...plugin: Plugin[]) {
    plugin.forEach(plugin => this.plugins.push(plugin));
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

  /**
   * Assign a different database adapter other than Nedb.
   * @param adapter The database adapter for UrsaMU to use.
   */
  database(adapter: DbAdapter) {
    this.db = adapter;
  }

  /**
   * Register a module to be used with the instance of the game engine.
   * @param name Tha name of the module to save to the game engine.
   * @param module The actual module to be attached to the game engine.
   */
  register(...args: any[]) {
    if (args.length === 1) {
      // Only one arg is given and it has a name property.
      this[args[0].name] = args[0];
    } else if (args.length === 2 && typeof args[0] === "string") {
      // Two args, and the first is a string.
      this[args[0]] = args[1];
    } else {
      throw new Error("Unknown module");
    }
  }

  /**
   * Add a new service to the game.  Services are functions that act as
   * background running processes.
   * @param service The service to start, and reboot with the MU engine.
   */
  service(service: Service) {
    this.services.push(service);
  }

  /** Register a new command to be evaluaged with the command parser
   * @param cmd The new Command object to be added.
   */
  command(cmd: MuCommand) {
    this.cmds.push(cmd);
  }

  /** Reister a new function to be used with the expression parser. */
  function() {}

  /**
   * Start the Ursamu game engine.
   */
  async start() {
    // load text files
    const dir = readdirSync(resolve(__dirname, "../../text/"), {
      encoding: "utf8",
      withFileTypes: true
    });

    // load files.
    dir.forEach(dirent => {
      if (dirent.isFile() && dirent.name.toLowerCase().endsWith(".md")) {
        const name = dirent.name?.split(".")[0].toLowerCase();
        console.log(dirent.name);
        const text = readFileSync(
          resolve(__dirname, "../../text/" + dirent.name),
          {
            encoding: "utf8"
          }
        );
        this.txt.set(name, text);
      }
    });

    //load the database
    this.db.init();

    // Load services
    for (const service of this.services) {
      await service.init();
    }

    // Load plugins
    this.plugins.forEach(plugin => plugin(this));
  }

  shutdown() {}
}

const mu = new UrsaMajor();

export default mu;
