import mu, { db, payload, cmds } from "../mu";
import { sha512 } from "js-sha512";
import { MuRequest } from "../types";
import { dbref } from "../api/database";
import jwt from "jsonwebtoken";

const create = async (req: MuRequest): Promise<MuRequest> => {
  const { user, password } = req.payload.data;

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
      attributes: [],
      dbref: await dbref(),
      contents: [],
      flags,
      location: room?._id || "000",
      name: user,
      type: "player",
      password: sha512(password),
    });

    mu.connections.set(req.socket.id, char);
    req.socket.join(char.location);
    const token = jwt.sign(char._id!, "secret");
    mu.send(
      payload(req, {
        command: "connected",
        message: "Welcome to UrsaMU",
        data: {
          en: char,
          tar: char,
          token,
        },
      })
    );
    mu.send(await cmds.force(req, "look"));
  }
  req.payload.message = "";
  return payload(req);
};

export default mu.service("create", create);
