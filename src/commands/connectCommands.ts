import { sha512 } from "js-sha512";
import db, { target, DBObj } from "../api/database";
import flags from "../api/flags";
import cmds from "../api/commands";
import shortid from "shortid";
import config from "../api/config";
import mu, { payload } from "../api/mu";
import { MuRequest } from "../api/parser";
import { sign } from "jsonwebtoken";

export default () => {
  /**
   * Update the tar location to add en.
   * @param en The enactor DBObj
   * @param tar The Target DBObj
   */
  const updateLoc = async (en: DBObj, tar: DBObj) => {
    // Update the location conntents.
    const contents = new Set(tar.contents);
    contents.add(en.id);
    tar.contents = Array.from(contents);
    await db.update({ id: tar.id }, tar);
  };

  cmds.add({
    name: "Test",
    pattern: /^[+@]?test$/g,
    exec: async (req: MuRequest, args: any[]) => {
      req.payload.message = "Made it!!!!";
      return { socket: req.socket, payload: req.payload };
    }
  });

  // Create a new character.
  cmds.add({
    name: "create",
    pattern: /^c[reate]+?\s+?(.*)\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const [, char, password] = args;
      // Check to see if the name is in use.
      const cursor = await db.find({
        $where: function() {
          return this.name.toLowerCase() === char.toLowerCase() ? true : false;
        }
      });

      const players = await db.find({ type: "player" });
      const location = await db.get({
        name: config.game.startingRoom || "Limbo"
      });
      // No matches, continue
      if (cursor.length <= 0) {
        const player = await db.create({
          name: char,
          desc: "You see nothing special.",
          password: sha512(password),
          id: shortid.generate(),
          flags: players.length > 0 ? ["connected"] : ["immortal", "connected"],
          type: "player",
          location: location.id,
          contents: [],
          attributes: []
        });
        if (!player) {
          return {
            socket: req.socket,
            payload: {
              command: req.payload.command,
              message: "Error Condition!",
              data: req.payload.data
            }
          };
        }
        mu.connMap.set(req.socket.id, player);
        req.socket.join(player.location);

        await updateLoc(player, location);
        // Force the player to look at their location.
        cmds.force(req, "look");

        return payload(req, { message: "" });
      } else {
        return {
          socket: req.socket,
          payload: {
            command: req.payload.command,
            message: "",
            data: req.payload.data
          }
        };
      }
    }
  });

  cmds.add({
    name: "connect",
    pattern: /^c[onnect]+?\s+?(.*)\s+?(.*)$/i,
    exec: async (req: MuRequest, args: string[]) => {
      let cursor = await db.find({
        $where: function() {
          return this.name.toLowerCase() === args[1].toLowerCase()
            ? true
            : false;
        }
      });

      if (cursor[0]?.password) {
        if (cursor.length > 0 && sha512(args[2]).match(cursor[0].password)) {
          await flags.setFlag(cursor[0], "connected");
          cursor[0].location = cursor[0].location || config.game.startingRoom;
          await db.update({ _id: cursor[0]._id }, cursor[0]);
          mu.connMap.set(req.socket.id, cursor[0]);
          const jwt = sign(
            { id: cursor[0].id, flags: cursor[0].flags },
            "secret",
            { expiresIn: "1d" }
          );

          const location = await target(cursor[0], config.game.startingRoom);
          await updateLoc(cursor[0], location);

          cmds.force(req, "look");
          return {
            socket: req.socket,
            payload: {
              command: "data",
              message: "",
              data: { ...req.payload.data, jwt }
            }
          };
        }
      } else {
        return {
          socket: req.socket,
          payload: {
            command: req.payload.command,
            message: "That's not a valid account!",
            data: req.payload.data
          }
        };
      }
      return {
        socket: req.socket,
        payload: {
          command: req.payload.command,
          message: "Incorrect Password",
          data: req.payload.data
        }
      };
    }
  });
};
