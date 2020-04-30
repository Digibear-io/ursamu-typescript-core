import io, { Server as IOServer, Socket } from "socket.io";
import {
  Server as HTTPServer,
  createServer,
  ServerResponse,
  IncomingMessage,
} from "http";
import { EventEmitter } from "events";
import db from "./api/database";
import parser from "./api/parser";
import md from "./api/md";
import cmds, { Cmd } from "./api/commands";
import shortid from "shortid";
import config from "./api/config";
import commands from "./middleware/commands.middleware";
import flags from "./api/flags";
import commandService from "./services/command.service";
import connectService from "./services/connect.service";
import createService from "./services/create.service";
import msgdataMiddleware from "./middleware/msgdata.middleware";
import substitutionsMiddleware from "./middleware/substitutions.middleware";

export type MiddlewareNext = (
  err: Error | null,
  req: MuRequest
) => Promise<any>;

export type MiddlewareLayer = (
  data: MuRequest,
  next: MiddlewareNext
) => Promise<MuRequest> | MuRequest;

export interface MuRequest {
  socket: Socket;
  payload: {
    command: string;
    message: string;
    data: {
      en?: DBObj;
      tar?: DBObj;
      [key: string]: any;
    };
  };
}

export type MuFunction = (
  enactor: DBObj,
  args: string[],
  scope: Scope
) => Promise<any>;

export interface Expression {
  type: string;
  value: string;
  list?: Expression[];
  operator: {
    type: string;
    value: string;
  };
  location?: {
    start: {
      offset: number;
      line: number;
      column: number;
    };
    end: {
      offset: number;
      line: number;
      column: number;
    };
  };
  args: Array<Expression>;
}

export type Service = (req: MuRequest) => Promise<MuRequest>;

export interface Scope {
  [key: string]: any;
}

export interface DBObj {
  _id?: string;
  id: string;
  desc: string;
  name: string;
  image?: string;
  avatar?: string;
  caption?: string;
  type: "thing" | "player" | "room" | "exit";
  alias?: string;
  password?: string;
  attributes: Attribute[];
  flags: string[];
  location: string;
  contents: string[];
  exits?: string[];
  owner?: string;
}

export abstract class DbAdapter {
  abstract model(...args: any[]): any | Promise<any>;
  abstract get(...args: any[]): any | Promise<any>;
  abstract find(...args: any[]): any | Promise<any>;
  abstract create(...args: any[]): any | Promise<any>;
  abstract update(...args: any[]): any | Promise<any>;
  abstract delete(...args: any[]): any | Promise<any>;
}

export interface Attribute {
  name: string;
  value: string;
  lastEdit: string;
}

export type Message = {
  command: string;
  message: string;
  data: { [key: string]: any };
};

/**
 * The main MU class.
 * This class is responsible for gluing the different individual
 * pieces of Ursamu into a workable facade.
 */
export class MU extends EventEmitter {
  http: HTTPServer | undefined;
  io: IOServer | undefined;
  private static instance: MU;
  connections: Map<string, DBObj>;

  private constructor() {
    super();
    this.io;
    this.http;
    this.connections = new Map();
  }

  /**
   * Get a (new)instance of the MU Class.
   */
  static getInstance() {
    if (!this.instance) {
      MU.instance = new MU();
    }

    return MU.instance;
  }

  /**
   * Attach to a Socket.io  server implementation.
   * @param io The Socket.io server to attach too.
   */
  attach(io: IOServer) {
    this.io = io;
    return this;
  }

  /**
   * Attach to an HTTP server instance.
   * @param server The HTTP server instance to attach to.
   */
  server(server: HTTPServer) {
    this.http = server;
    this.io = io(server);
    this.start();
    return this;
  }

  /**
   * Create an HTTP server from within the UrsaMU library.
   * @param port The port the HTTP Server should listen on.
   */
  serve(port?: number) {
    this.http = createServer(this.httpHandler).listen(
      (port ? port : config.game.port) || 3000
    );
    this.io = io(this.http);
    this.start();
    console.log(
      `UrsaMU started on port ${(port ? port : config.game.port) || 3000}`
    );
    return this;
  }

  /**
   * Create a simple HTTP request handler.
   * @param req Incoming message
   * @param res Server response
   */
  httpHandler(req: IncomingMessage, res: ServerResponse) {
    res.write("Welcome to Ursamu");
    res.end();
  }

  /**
   * Get a SocketID from a DBOBj _id if it exists in the
   * connection map.
   * @param id The database ID for the target.
   */
  socketID(id: string) {
    let socketID = "";

    this.connections.forEach((v, k) => {
      if (v._id === id) socketID = k;
    });

    return socketID;
  }

  /**
   * Load a module when the server starts.  A good place
   * to load code that needs to run an independant setup,
   * or instantiate multiple game functions at startup.
   * @param plugin The file to load at startup.
   */
  configure(plugin: () => {}) {
    plugin();
  }

  /**
   * Load a middleware function to run against user
   * input via the parser.
   * @param middleware The middleware layer to add to the
   * pipeline.
   */
  middleware(...middleware: MiddlewareLayer[]) {
    middleware.forEach((middleware) => parser.use(middleware));
  }

  /**
   * Add an in-game command to the system.
   * @param cmd Facade for adding new commands to the
   * mu server.
   */
  cmd(cmd: Cmd) {
    cmds.add(cmd);
  }

  /**
   * Add a mushcode function to the game.
   * @param name Name of the function to add
   * @param func The body of the mushcode function
   */
  fun(name: string, func: MuFunction) {
    parser.add(name, func);
  }

  service(name: string, service: Service) {
    parser.service(name, service);
  }

  /**
   * Start the game engine.
   * @param callback An optional function to execute when the
   * MU startup process ends
   */
  private async start() {
    // Handle client connections.
    console.log("UrsaMU Booting...");
    this.io?.on("connection", async (socket: Socket) => {
      // Whenever a socket sends a message, process it, and
      // return the results.
      socket.on("message", async (message: string) => {
        const payload: Message = JSON.parse(message);
        const res = await parser.process({
          socket,
          payload,
        });

        // Render markdown
        res.payload.message = md.render(
          res.payload.message
            ? res.payload.message.replace("\u250D", "(").replace("\u2511", ")")
            : ""
        );

        // If the request doesn't have an enactor attached, try to get
        // the character information from the socket if it exists.
        if (this.connections.has(res.socket.id) && !res.payload.data.en) {
          res.payload.data.en = this.connections.get(res.socket.id);
        }

        // if the request type isn't a message, and there's no target set,
        // the target should be the enactor.
        if (
          res.payload.command.toLowerCase() !== "message" &&
          !res.payload.data.tar
        ) {
          res.payload.data.tar = res.payload.data.en;
        }

        // If the response has a target, send it to the target's ID.
        // else, send it the response to the enactor's location by default
        // for general chat like behavior.
        if (res.payload.data.tar) {
          // If it's a player, send it to their socket ID.
          if (res.payload.data.tar.type === "player") {
            this.io
              ?.to(this.socketID(res.payload.data.tar._id!))
              .send(res.payload);
          } else if (res.payload.data.tar.type === "room") {
            // Else if it's a room, just send to it's id.

            this.io?.to(res.payload.data.tar.id!).send(res.payload);
          }
        } else {
          if (res.payload.data.en) {
            this.io?.to(res.payload.data.en.location).send(res.payload);
          }
        }
      });

      // When a socket disconnects rem ove the connected
      // flag from the character object.
      socket.on("disconnect", async () => {
        if (this.connections.has(socket.id)) {
          const player = this.connections.get(socket.id);
          if (player) {
            await flags.setFlag(player, "!connected");
          }
        }
      });
    });

    // Install some default services and middleware
    this.service("connect", connectService);
    this.service("create", createService);
    this.service("command", commandService);
    this.middleware(commands, substitutionsMiddleware, msgdataMiddleware);

    // Test for starting room.  If one doesn't exist, create it!
    const limbo = await db.find({ type: "room" });
    // No rooms exist, dig limbo!
    if (limbo.length <= 0) {
      const id = shortid.generate();
      const created = db.create({
        name: config.game.startingRoom || "Limbo",
        type: "room",
        desc: "You see nothing special.",
        id,
        attributes: [],
        flags: [],
        contents: [],
        location: id,
        exits: [],
      });
      if (created)
        console.log(
          "Room " + (config.game.startingRoom || "Limbo") + " - Created."
        );
    }

    console.log("Startup Complete.");
    this.emit("started");
  }
}

export interface Payload {
  command?: string;
  message?: string;
  data?: { [key: string]: any };
}

/**
 * Helper function for creating new return data.
 * @param req The request object given to the command
 * @param payload The different payload fields available.
 */
export const payload = (req: MuRequest, payload?: Payload): MuRequest => {
  return {
    socket: req.socket,
    payload: {
      command: payload?.command || req.payload.command,
      message: payload?.message || req.payload.message,
      data: { ...req.payload.data, ...payload?.data },
    },
  };
};

export { db, config, parser, cmds, flags };

export default MU.getInstance();
