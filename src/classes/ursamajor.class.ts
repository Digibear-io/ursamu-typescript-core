import { resolve } from "path";
import { NeDB } from "../services/database";
import { readdirSync, readFileSync } from "fs";

export type MiddlewareNext = (err: Error | null, data: string) => Promise<any>;

export type MiddlewareLayer = (
  data: string,
  next: MiddlewareNext,
  app: UrsaMajor
) => Promise<MiddlewareNext>;

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
  cmds: Map<string, MuCommand>;
  fns: Map<string, MuFunction>;
  db: NeDB | DbAdapter;
  txt: Map<string, string>;
  private plugins: Plugin[];
  private stack: MiddlewareLayer[];

  [index: string]: any;

  constructor() {
    this.db = new NeDB({
      app: this,
      path: resolve(__dirname, "../../data/db.db")
    });
    this.cmds = new Map<string, MuCommand>();
    this.fns = new Map<string, MuFunction>();
    this.txt = new Map<string, string>();
    this.services = [];
    this.plugins = [];
    this.stack = [];
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
   * Run a string through a series of middleware before it's
   * returned to the client.
   * @param data The string to be pushed through the pipeline.
   */
  async handle(data: string) {
    let idx = 0;

    /**
     * Recursive function to walk through each piece of
     * middleware in the stack.
     * @param err Any possible errors hit by the middleware.
     * @param data The string the middleware pipeline is going
     * to be working with
     */
    const next = async (err: Error | null, data: string) => {
      // Return early if there's an error, or if we've processed through
      // the entire stack.
      if (err != null) return Promise.reject(err);
      if (idx === this.stack.length) return Promise.resolve(data);

      // Grab a new layer from the stack
      const layer = this.stack[idx++];
      // Run the layer
      return await layer(data, next, this);
    };

    // Return the modified data.
    return await next(null, data).catch((err: Error) => next(err, data));
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
    this.cmds.set(cmd.name.toLowerCase(), cmd);
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