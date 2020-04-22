import mu, { db, payload, cmds, MuRequest, DBObj } from "../mu";
import shortid from "shortid";

export default () => {
  cmds.add({
    name: "dig",
    flags: "admin+ connected",
    pattern: /@dig\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const [name, exits] = args[1].split("=");
      let toName, fromName;
      if (exits) [toName, fromName] = exits.split(",");
      const output: string[] = [];
      const curRoom = await db.get({ id: en.location });

      // Create the new room
      const newRoom = await db.create({
        name: name.trim(),
        desc: "You see nothing special.",
        id: shortid.generate(),
        flags: [],
        type: "room",
        location: "",
        contents: [],
        attributes: [],
        exits: [],
      });

      // If the new room exists
      if (newRoom) {
        output.push(`Room (**${name.trim()}**) dug.`);

        // If a to exit was given, dig th exit and link it to the
        // enactors current location.
        if (toName) {
          const toExit = await db.create({
            name: toName.trim(),
            desc: "You see nothing special.",
            id: shortid.generate(),
            flags: [],
            type: "exit",
            location: curRoom!.id,
            contents: [],
            attributes: [],
            exits: [],
          });

          // If the to - exit is created, link it to the
          // enactor's current location and check for a return
          // exit.
          if (toExit) {
            output.push(
              `Exit (**${toName
                .split(";")[0]
                .trim()}**) opened to **${newRoom.name.trim()}**`
            );

            // Add the exit to the current room
            if (curRoom) {
              curRoom.exits?.push(toExit.id);
              await db.update({ id: curRoom.id }, curRoom);
            }

            // Check for a return exit.
            if (fromName) {
              const fromExit = await db.create({
                name: fromName.trim(),
                desc: "You see nothing special.",
                id: shortid.generate(),
                flags: [],
                type: "exit",
                location: newRoom.id,
                contents: [],
                attributes: [],
                exits: [],
              });

              // If the exit was created, add it to the newRoom
              // exit list.
              if (fromExit) {
                newRoom.exits?.push(fromExit.id);
                await db.update({ id: newRoom.id }, newRoom);
                output.push(
                  `Exit (**${fromName
                    .split(";")[0]
                    .trim()}**) opened to **${curRoom!.name.trim()}**`
                );
              }
            }
          }
        }
      }
      // Send off the message!
      return payload(req, { message: output.join("\n") });
    },
  });
};