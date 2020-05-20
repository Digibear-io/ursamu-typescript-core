import mu, { db, payload, cmds } from "../mu";
import { MuRequest } from "../types";
import { sha512 } from "js-sha512";
import { dbref } from "../api/database";

export default () => {
  mu.cmd({
    name: "create",
    pattern: /create\s+?(.*)\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const user = args[1];
      const password = args[2];

      const room = await db.get({
        $where: function () {
          return this.name.toLowerCase() === "limbo";
        },
      });
      const players = await db.find({ type: "player" });
      let flags;

      // Determine starting flags if game is a fresh install or not
      // No players created yet.  Set the first as immortal
      if (players.length > 0) {
        flags = ["connected"];
      } else {
        flags = ["connected", "immortal"];
      }

      const name = await db.find({
        $where: function () {
          return this.name.toLowerCase() === user.toLowerCase() ? true : false;
        },
      });

      if (name.length > 0) {
        // Name exists, abort characer creation.
        return payload(req, {
          command: "error",
          message: "That character already exists.",
        });
      } else {
        // No character, continue!
        const char = await db.create({
          dbref: await dbref(),
          attributes: [],
          contents: [],
          flags,
          location: room?._id || "000",
          name: user,
          type: "player",
          password: sha512(password),
        });

        mu.connections.set(req.socket.id, char);
        req.socket.join(char.location);

        if (room) {
          const conSet = new Set(room.contents).add(char._id!);
          room.contents = Array.from(conSet);
          await db.update({ _id: room._id }, room);
        }

        mu.send(payload(req, { message: "Welcome to UrsaMU!" }));
        mu.send(await cmds.force(req, "look", []));
        return payload(req, {
          command: "connected",
          message: "",
          data: {
            en: char,
            tar: char,
          },
        });
      }
    },
  });
};
