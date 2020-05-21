import { MuRequest, MuService, MuHook } from "../types";

export class Service {
  private _service: MuService;
  private _hooks: Map<"before" | "after", MuHook[]>;
  constructor(service: MuService) {
    this._service = service;
    this._hooks = new Map();
    this._hooks.set("before", []);
    this._hooks.set("after", []);
  }

  /**
   * Add an array of hooks to fire either before or after
   * the service runs.
   * @param phase When the hook should be fired during the
   * service's lifecycle.
   * @param hooks The hook to add to the system.
   */
  hook(phase: "before" | "after", ...hooks: MuHook[]) {
    hooks.forEach((hook) => this._hooks.get(phase)?.push(hook));
    return this;
  }

  async hooks(req: MuRequest, phase: "before" | "after") {
    for (const hook of this._hooks.get(phase)!.values()) {
      const res = await hook(req);
      req = res ? res : req;
      if (req.payload.data.matched === true) return req;
    }

    return req;
  }

  async exec(req: MuRequest) {
    req = await this.hooks(req, "before");
    req = await this._service(req);
    return await this.hooks(req, "after");
  }
}

export class Services {
  private _services: Map<string, Service>;
  private static _instance: Services;
  private constructor() {
    this._services = new Map();
  }

  /**
   * Register a new service.
   * @param name Name of the command to match
   * @param service The service to execute
   */
  register(name: string, service: MuService) {
    const newService = new Service(service);
    this._services.set(name, newService);
    return newService;
  }

  /**
   * Check to see if a service exists.
   * @param name Name of the service to find
   */
  has(name: string) {
    return this._services.has(name);
  }

  /**
   * Get a service by name.
   * @param name Name of the service to retrive
   */
  get(name: string) {
    return this._services.get(name);
  }

  /**
   * Return the instance of the Services object.
   */
  static getInstance() {
    if (!Services._instance) Services._instance = new Services();
    return Services._instance;
  }
}

export default Services.getInstance();
