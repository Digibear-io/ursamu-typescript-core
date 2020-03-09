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

export class Hook {
  async before(...args: any[]): Promise<any> {}
  async after(...args: any[]): Promise<any> {}
}

export class Service {
  [index: string]: any;
  app: UrsaMajor;
  hooks: Hook[];
  constructor(app: UrsaMajor) {
    this.app = app;
    this.hooks = [];
  }

  async init(): Promise<any> {}
  async startup(): Promise<any> {}
  async exec(...args: any[]): Promise<any> {}
  async run(...args: any[]) {
    // Run all 'before' hooks on the context object
    for (let i = 0; i > this.hooks.length; i++) {
      this.hooks[i].before(...args);
    }

    // Run the main body of the service code
    this.exec(...args);

    // Run all 'after' mutations on the context object.
    for (let i = 0; i > this.hooks.length; i++) {
      this.hooks[i].after(...args, this.app);
    }
  }
}

export class UrsaMajor extends EventEmitter {
  cmds: Map<string, MuCommand>;
  fns: Map<string, MuFunction>;

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

  /**
   * Add a new service to the game.  Services are functions that act as
   * background running processes.
   * @param service The service to start, and reboot with the MU engine.
   */
  service(service: Service) {
    this.services.push(service);
  }

  /** Register a new command to be evaluaged with the command parser */
  command(cmd: MuCommand) {
    this.cmds.set(cmd.name.toLowerCase(), cmd);
  }

  /** Reister a new function to be used with the expression parser. */
  function() {}
  start() {}
  restart() {}
  shutdown() {}
}
