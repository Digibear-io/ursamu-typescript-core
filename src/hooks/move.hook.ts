import { MuRequest, DBObj } from "../types";
import mu, { db, payload, cmds, attrs, parser } from "../mu";
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
        // if a single exit matches, change rooms!
        req.socket.leave(en.location);
        console.log(attrs.get(en, exits[0], "toroom"));
        en.location = attrs.get(en, exits[0], "toroom")!.value || en.location;
        req.payload.message = "";
        // join new room and update player object
        req.socket.join(en.location);
        await db.update({ _id: en._id }, en);
        console.log(await cmds.force(req, "look"));
        mu.send(await cmds.force(req, "look"));
        req.payload.data.matched = true;
      }
    } else {
      req.payload.message = "I can't figure out where you ARE!";
    }
  }
  return payload(req);
};
