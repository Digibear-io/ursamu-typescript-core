import { sha512 } from "js-sha512";
import db from "../api/database";
import flags from "../api/flags";
import cmds from "../api/commands";
import shortid from "shortid";
import config from "../config/config.json";
import mu from "../api/mu";

export default () => {
  cmds.add({
    name: "Test",
    pattern: /^[+@]?test$/g,
    exec: async (id: string, args: any[]) => {
      return "Made it!!";
    }
  });

  // Create a new character.
  cmds.add({
    name: "create",
    pattern: /^c[reate]+?\s+?(.*)\s+?(.*)/i,
    exec: async (id: string, args: string[]) => {
      const [, char, password] = args;
      // Check to see if the name is in use.
      const cursor = await db.find({
        $where: function() {
          return this.name.toLowerCase() === char.toLowerCase() ? true : false;
        }
      });

      // No matches, continue
      if (cursor.length <= 0) {
        const player = await db.create({
          name: char,
          desc: "You see nothing special.",
          password: sha512(password),
          id: shortid.generate(),
          flags: ["connected"],
          type: "player",
          location: (
            await db.get({ name: config.game.startingRoom || "Limbo" })
          ).id,
          contents: [],
          attribites: []
        });
        if (!player) return "Error Condition";
        mu.connMap.set(id, player);
        cmds.force(id, "look");
        return "";
      } else {
        return "That name is either unavailable or in use.";
      }
    }
  });

  cmds.add({
    name: "connect",
    pattern: /^c[onnect]+?\s+?(.*)\s+?(.*)$/i,
    exec: async (id: string, args: string[]) => {
      let cursor = await db.find({
        $where: function() {
          return this.name.toLowerCase() === args[1].toLowerCase()
            ? true
            : false;
        }
      });

      if (cursor[0].password) {
        if (cursor.length > 0 && sha512(args[2]).match(cursor[0].password)) {
          await flags.setFlag(cursor[0], "connected");
          cursor[0].location = cursor[0].location || config.game.startingRoom;
          await db.update({ _id: cursor[0]._id }, cursor[0]);
          mu.connMap.set(id, cursor[0]);
          cmds.force(id, "look");

          return "";
        }
      } else {
        return "That's not a valid account.";
      }

      return "I can't find that account.";
    }
  });
};
