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

export interface Service {
  init(): any | Promise<any>;
  reboot?(): any | Promise<any>;
}

export interface DbAdapter extends Service {
  model(...args: any[]): void | Promise<void>;
  get(...args: any[]): any | Promise<any>;
  find(...args: any[]): any | Promise<any>;
  create(...args: any[]): any | Promise<any>;
  update(...args: any[]): any | Promise<any>;
  delete(...args: any[]): any | Promise<any>;
}

export class UrsaMajor extends EventEmitter {
  cmds: Map<string, MuCommand>;
  fns: Map<string, MuFunction>;

  [index: string]: any;

  constructor() {
    super();
    this.cmds = new Map<string, MuCommand>();
    this.fns = new Map<string, MuFunction>();
    this.services = [];
  }

  /**
   * Register a module to be used with the instance of the game engine.
   * @param name Tha name of the module to save to the game engine.
   * @param module The actual module to be attached to the game engine.
   */
  register(name: string, module: any) {
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

  /** Register a new command to be evaluaged with the command parser
   * @param cmd The new Command object to be added.
   */
  command(cmd: MuCommand) {
    this.cmds.set(cmd.name.toLowerCase(), cmd);
  }

  /** Reister a new function to be used with the expression parser. */
  function() {}
  start() {}
  restart() {}
  shutdown() {}
}
