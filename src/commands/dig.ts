import mu, { db, payload, parser } from "../mu";
import shortid from "shortid";
import { MuRequest, DBObj } from "../types";
import { dbref } from "../api/database";

export default () => {
  mu.cmd({
    name: "dig",
    flags: "admin+ connected",
    pattern: /@dig\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const [name, exits] = args[1].split("=");
      let toName, fromName;
      if (exits) [toName, fromName] = exits.split(",");
      const output: string[] = [];
      const curRoom = await db.get({ _id: en.location });

      // Create the new room
      const newRoom = await db.create({
        name: name.trim(),
        dbref: await dbref(),
        flags: [],
        type: "room",
        location: "",
        contents: [],
        attributes: [],
        exits: [],
      });

      // If the new room exists
      if (newRoom) {
        output.push(`Room (**${parser.colorSub(name.trim())}**) dug.`);

        // If a to exit was given, dig th exit and link it to the
        // enactors current location.
        if (toName) {
          const toExit = await db.create({
            name: toName.trim(),
            dbref: await dbref(),
            flags: [],
            type: "exit",
            location: curRoom!._id!,
            contents: [],
            attributes: [],
            exits: [],
          });

          // If the to - exit is created, link it to the
          // enactor's current location and check for a return
          // exit.
          if (toExit) {
            output.push(
              `Exit (**${parser
                .colorSub(toName.split(";")[0])
                .trim()}**) opened to **${parser.colorSub(
                newRoom.name.trim()
              )}**`
            );

            // Add the exit to the current room
            if (curRoom) {
              curRoom.exits?.push(toExit._id!);
              await db.update({ _id: curRoom._id }, curRoom);
            }

            // Check for a return exit.
            if (fromName) {
              const fromExit = await db.create({
                name: fromName.trim(),
                dbref: await dbref(),
                flags: [],
                type: "exit",
                location: newRoom._id!,
                contents: [],
                attributes: [],
                exits: [],
              });

              // If the exit was created, add it to the newRoom
              // exit list.
              if (fromExit) {
                newRoom.exits?.push(fromExit._id!);
                await db.update({ _id: newRoom._id }, newRoom);
                output.push(
                  `Exit (**${parser
                    .colorSub(fromName.split(";")[0])
                    .trim()}**) opened to **${parser.colorSub(
                    curRoom!.name.trim()
                  )}**`
                );
              }
            }
          }
        }
      }
      // Send off the message!
      return payload(req, {
        message: output.join("\n"),
        data: { en, tar: en },
      });
    },
  });
};
