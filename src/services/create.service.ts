import mu, { MuRequest, db, payload, config } from "../mu";
import shortid from "shortid";
import { sha512 } from "js-sha512";

export default async (req: MuRequest): Promise<MuRequest> => {
  const { user, password } = req.payload.data;

  const room = await db.get({
    $where: function () {
      return this.name.toLowerCase() === "limbo";
    },
  });
  const players = await db.find({type: "player"}); 
  let flags;

  // Determine starting flags if game is a fresh install or not
  // No players created yet.  Set the first as immortal
  if(players.length > 0) {
    flags = ["connected"];
  } else {
    flags = ["connected", "immortal"]
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
      attributes: [],
      contents: [],
      desc: "You see nothing special.",
      flags,
      id: shortid.generate(),
      location: room?.id || "000",
      name: user,
      type: "player",
      password: sha512(password),
    });

    mu.connections.set(req.socket.id, char)
    req.socket.join(char.location);
    return payload(req, {
      command: "connected",
      message: "Welcome to UrsaMU",
      data: {
        en: char,
        tar: char
      }
    });
  }
};
