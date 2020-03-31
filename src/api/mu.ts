import { EventEmitter } from "events";
import { Server, Socket } from "socket.io";
import parser, { MuRequest } from "./parser";
import commands from "../middleware/commands.middleware";
import text from "./text";
import db, { DBObj } from "./database";
import config from "./config";
import shortid from "shortid";
import flags from "./flags";
import md from "./md";

export type Plugin = () => void;

export class MU extends EventEmitter {
  io: Server | undefined;
  private static instance: MU;
  connMap: Map<string, DBObj>;

  private constructor() {
    super();
    this.io;
    this.connMap = new Map();
  }

  /**
   * Get an instance of the MU Class.
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
  attach(io: Server) {
    this.io = io;
    return this;
  }

  /**
   * Start the game engine.
   * @param callback An optional function to execute when the
   * MU startup process ends
   */
  async start(callback?: () => void) {
    // Handle new client connections.
    this.io?.on("connection", async (socket: Socket) => {
      // Whenever a socket sends a message, process it, and
      // return the results.
      socket.on(
        "message",
        async (message: {
          command: string;
          message: string;
          data: { [key: string]: any };
        }) => {
          const res = await parser.process({
            socket,
            payload: {
              command: message.command,
              message: message.message,
              data: message.data
            }
          });
          // Make sure message is set, even if no return.
          res.payload.message = res.payload.message
            ? md.render(
                res.payload.message
                  .replace("\u250D", "(")
                  .replace("\u2511", ")")
              )
            : "";
          this.io?.to(res.socket.id).send(res.payload);
        }
      );
    });

    parser.use(commands);
    text.load("../../text/");

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
        attribites: [],
        flags: [],
        contents: [],
        location: id,
        exits: []
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

    // If a callback function was given, run it now.
    if (typeof callback === "function") callback();
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
      data: { ...req.payload.data, ...payload?.data }
    }
  };
};

export default MU.getInstance();
