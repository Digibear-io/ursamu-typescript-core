import { UrsaMajor } from "../classes/ursamajor.class";
import { sha512 } from "js-sha512";

export default (app: UrsaMajor) => {
  app.command({
    name: "Test",
    pattern: /^[+@]?test$/g,
    exec: async (id: string, args: any[]) => {
      return "TESTING!!";
    }
  });

  // Create a new character.
  app.command({
    name: "create",
    pattern: /^c[reate]+?\s+?(.*)\s+?(.*)/i,
    exec: async (id: string, args: string[]) => {
      const [_, char, password] = args;

      // Check to see if the name is in use.
      const cursor = await app.db.find({
        $where: function() {
          return this.name.toLowerCase() === char.toLowerCase() ? true : false;
        }
      });

      // No matches, continue
      if (cursor.length <= 0) {
        const player = await app.db.create({
          name: char,
          password: sha512(password),
          flags: [],
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

  app.command({
    name: "connect",
    pattern: /^c[onnect]+?\s+?(.*)\s+?(.*)$/i,
    exec: async (id: string, args: string[]) => {
      let cursor = await app.db.find({
        $where: function() {
          return this.name.toLowerCase() === args[1].toLowerCase()
            ? true
            : false;
        }
      });

      if (cursor.length > 0 && sha512(args[2]).match(cursor[0].password)) {
        return "Welcome to the game!";
      }

      return "I can't find that account.";
    }
  });
};
