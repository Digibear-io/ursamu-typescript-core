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
import config from "./api/config";
import commands from "./middleware/commands.middleware";
import flags from "./api/flags";
import attrs from "./api/attributes";
import msgdataMiddleware from "./middleware/msgdata.middleware";
import substitutionsMiddleware from "./middleware/substitutions.middleware";
import {
  DBObj,
  MiddlewareLayer,
  MuFunction,
  Service,
  Message,
  MuRequest,
  Plugin,
} from "./types";
import { loadDir, loadText } from "./utils";

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
  private _plugins: Plugin[];
  private _services: Map<string, Service>;
  text: Map<string, string>;

  private constructor() {
    super();
    this.io;
    this.http;
    this.connections = new Map();
    this._plugins = [];
    this._services = new Map();
    this.text = new Map();
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
  register(plugin: Plugin) {
    this._plugins.push(plugin);
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
   * Send a message depending on the enactor and target fields.
   * @param res The response from the MU to be sent back to
   * a potential list of targets.
   */
  send(res: MuRequest) {
    // Render markdown & a
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

    // If the response has a target, send Send the message depending on
    // the target type. else, send it the response to the enactor's location
    // by default for general chat like behavior.
    if (res.payload.data.tar) {
      // If it's a player, send it to their socket ID.
      if (res.payload.data.tar.type === "player") {
        this.io?.to(this.socketID(res.payload.data.tar._id!)).send(res.payload);
      } else if (res.payload.data.tar.type === "room") {
        // Else if it's a room, just send to it's id.

        this.io?.to(res.payload.data.tar._id!).send(res.payload);
      }
    } else {
      if (res.payload.data.en) {
        this.io?.to(res.payload.data.en.location).send(res.payload);
      } else {
        // Just send to the socket.
        this.io?.to(res.socket.id).send(res.payload);
      }
    }
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
      socket.on("message", async (message: Message) => {
        const payload: Message = message;
        const res = await parser.process({ socket, payload });
        this.send(res);
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

      // When there's an error with the socket, remove
      // the connected tag, and boot them from the connected list.

      socket.on("error", async () => {
        if (this.connections.has(socket.id)) {
          const player = this.connections.get(socket.id);
          if (player) {
            await flags.setFlag(player, "!connected");
          }
        }
      });
    });

    // Load the default middleware.
    this.middleware(commands, substitutionsMiddleware, msgdataMiddleware);
    loadDir("./services");
    loadText("../text");

    // Run plugins.
    for await (const plugin of this._plugins) {
      plugin(this);
    }

    // Test for starting room.  If one doesn't exist, create it!
    const limbo = await db.find({ type: "room" });
    // No rooms exist, dig limbo!
    if (limbo.length <= 0) {
      const created = db.create({
        name: config.game.startingRoom || "Limbo",
        type: "room",
        desc: "You see nothing special.",
        attributes: [],
        flags: [],
        contents: [],
        exits: [],
        location: config.game.startingRoom || "Limbo",
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

export default MU.getInstance();
export { cmds, db, parser, flags, config, attrs };
