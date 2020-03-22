import { sha512 } from "js-sha512";
import db from "../database";
import flags from "../flags";
import cmds from "../cmds";
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
          password: sha512(password),
          flags: ["connected"],
          type: "player",
          location: "Limbo",
          contents: [],
          attribites: []
        });

        if (!player) return "Error Condition";
        return "Welcome to the game!";
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
          console.log(await flags.setFlag(cursor[0], "connected"));
          return "Welcome to the game!";
        }
      } else {
        return "That's not a valid account.";
      }

      return "I can't find that account.";
    }
  });
};
