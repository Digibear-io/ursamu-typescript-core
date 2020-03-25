import { EventEmitter } from "events";
import { Server, Socket } from "socket.io";
import parser, { MuResponse } from "./parser";
import { Marked } from "@ts-stack/markdown";
import commands from "../middleware/commands.middleware";
import text from "./text";
import db, { DBObj } from "./database";
import { game } from "../config/config.json";
import shortid from "shortid";
import flags from "./flags";

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
      const { id, payload }: MuResponse = await parser.process({
        socket: socket,
        payload: {
          command: "connect"
        }
      });
      // Send the results back to the client.
      this.io?.to(id).send(payload);

      // When a new message comes from the MU, process
      // it and return the results.
      socket.on("message", async (message: string) => {
        const { id, payload }: MuResponse = await parser.process({
          socket,
          payload: { command: "message", message }
        });

        // Send the results back to the client after converting
        // any markdown.
        if (payload.message) payload.message = Marked.parse(payload.message);
        this.io?.to(id).send(payload);
      });
    });

    parser.use(commands);
    text.load("../../text/");

    // Test for starting room.  If one doesn't exist, create it!
    const limbo = await db.find({ type: "room" });
    // No rooms exist, dig limbo!
    if (limbo.length <= 0) {
      const id = shortid.generate();
      const created = db.create({
        name: game.startingRoom || "Limbo",
        type: "room",
        desc: "You see nothing special.",
        id,
        attribites: [],
        flags: [],
        contents: [],
        location: id
      });
      if (created)
        console.log("Room " + (game.startingRoom || "Limbo") + " - Created.");
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

export default MU.getInstance();
