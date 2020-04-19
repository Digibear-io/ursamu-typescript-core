import io, { Server as IOServer, Socket } from "socket.io";
import {
  Server as HTTPServer,
  createServer,
  ServerResponse,
  IncomingMessage,
} from "http";
import { EventEmitter } from "events";
import db, { DBObj } from "./api/database";
import parser, { MuRequest, MiddlewareNext } from "./api/parser";
import md from "./api/md";
import cmds from "./api/commands";
import shortid from "shortid";
import config from "./api/config";
import commands from "./middleware/commands.middleware";
import flags from "./api/flags";

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
   * Start the game engine.
   * @param callback An optional function to execute when the
   * MU startup process ends
   */
  private async start() {
    // Handle new client connections.
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

        if (this.connections.has(res.socket.id) && !res.payload.data.en) {
          res.payload.data.en = this.connections.get(res.socket.id);
        }

        if (res.payload.data.room) {
          this.io?.to(res.payload.data.room).send(res.payload);
        } else {
          this.io?.to(res.socket.id).send(res.payload);
        }
      });
    });

    parser.use(commands);

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

    // Check to make sure everyone's `connected` flag is reset
    // incase the MU didn't shut down clean.
    const players = await db.find({ type: "player" });
    for (const player of players) {
      await flags.remFlag(player, "connected");
    }
    console.log("Startup Complete.");
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

export { parser, db, cmds, config, flags, MuRequest, DBObj, MiddlewareNext };

export default MU.getInstance();
