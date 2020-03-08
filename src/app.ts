import { EventEmitter } from "events";

export interface MuCommand {
  name: string;
  pattern: RegExp;
  flags?: string;
  exec: (...args: any[]) => Promise<any>;
}

export interface MuFunction {
  name: string;
  exec: (...args: any[]) => Promise<any>;
}

export interface Hook {
  before?: (...ctx: any[]) => Promise<any> | any;
  after?: (...ctx: any[]) => Promise<any> | any;
}

export class Service<Ctx> {
  app: UrsaMajor;
  hooks: Hook[];
  context: {};
  constructor(app: UrsaMajor) {
    this.app = app;
    this.hooks = [];
    this.context = {};
  }

  async init(): Promise<any> {
    for (const hook of this.hooks) {
      if (typeof hook.before === "function") {
      }
    }
  }

  async startup(): Promise<any> {
    return;
  }
}

export class UrsaMajor extends EventEmitter {
  cmds: Map<string, MuCommand>;
  fns: Map<string, MuFunction>;
  services: Service[];
  [index: string]: any;

  constructor() {
    super();
    this.cmds = new Map();
    this.fns = new Map();
    this.services = [];
  }

  /**
   * Register a module to be used with the instance of the game engine.
   * @param name Tha name of the module to save to the game engine.
   * @param module The actual module to be attached to the game engine.
   */
  register(name: string, module: Object) {
    this[name] = module;
  }

  use(service: Service) {
    this.services.push(service);
  }

  /**
   *  Add a new command to use with the command parser.
   */
  command(cmd: MuCommand) {
    this.cmds.set(cmd.name.toLowerCase(), cmd);
  }
  function() {}
  start() {}
  restart() {}
  shutdown() {}
}
