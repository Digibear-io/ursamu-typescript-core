import { MuRequest, DBObj } from "../types";
import mu, { db, payload, cmds, attrs, parser, flags } from "../mu";
import { exists } from "fs";

export default async (req: MuRequest) => {
  const en = mu.connections.get(req.socket.id);

  // If the character is actually logged in and ...
  if (en) {
    const room = (await db.get({ _id: en.location })) as DBObj;

    // if the room has exits...
    if (room.exits) {
      let exits = [];
      for (const exit of room.exits) {
        exits.push((await db.get({ _id: exit })) as DBObj);
      }

      // filter for matching exit names
      exits = exits.filter((exit) => {
        const name = parser.stripSubs(exit.name.replace(/;/g, "|"));
        const regex = new RegExp(name, "i");
        const match = req.payload.message.match(regex);
        return match ? true : false;
      });

      // Check to see the number of exits, and if there
      // was a match or not.
      if (exits.length > 1) {
        req.payload.message = "I don't know which exit you mean.";
        req.payload.data.matched = true;
      } else if (exits.length === 1) {
        // Send a message to everyone in the former room that the
        // character is leaving - if they're not set dark.
        if (!flags.hasFlags(en, "dark")) {
          mu.send(
            payload(req, {
              message: `${en.name} has left.`,
              data: {
                en,
              },
            })
          );
        }

        // if a single exit matches, change rooms!
        req.socket.leave(en.location);
        en.location = attrs.get(en, exits[0], "toroom")!.value || en.location;
        req.payload.message = "";
        // join new room and update player object
        req.socket.join(en.location);

        // Send a message to everyone in the new room that the
        // character has arrived - if they're not set dark.
        if (!flags.hasFlags(en, "dark")) {
          mu.send(
            payload(req, {
              message: `${en.name} has arrvied.`,
              data: {
                en,
              },
            })
          );
        }

        await db.update({ _id: en._id }, en);
        mu.send(await cmds.force(req, "look"));
        req.payload.data.matched = true;
      }
    } else {
      req.payload.message = "I can't figure out where you ARE!";
    }
  }
  return payload(req);
};
