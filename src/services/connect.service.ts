import mu, { payload, flags, db, cmds } from "../mu";
import { sha512 } from "js-sha512";
import { MuRequest, DBObj } from "../types";
import jwt from "jsonwebtoken";

/**
 * Handle a socket connecting to the server.
 */
const connect = async (req: MuRequest): Promise<MuRequest> => {
  const { user, password } = req.payload.data;

  // If they have a valid JWT bypass the login process and drop the character
  // back into the action!
  if (user && password) {
    // Find the player DBObj
    const players = await db
      .find({
        $where: function () {
          return this.name.toLowerCase() === user.toLowerCase() ? true : false;
        },
      })
      .catch((err) => {
        mu.io?.to(req.socket.id).send(
          payload(req, {
            message: "Authentication failure.",
            command: "error",
            data: { error: err },
          })
        );
      });

    if (players && players.length > 0) {
      // verify the passwords match.  If a match, connect
      // the socket to the game proper.
      if (players[0].password?.match(sha512(password))) {
        mu.connections.set(req.socket.id, players[0]);
        req.socket.join(players[0].location);

        const token = jwt.sign(players[0]._id!, "secret");

        await flags.setFlag(players[0], "connected");
        mu.send(
          payload(req, {
            command: "connected",
            message: "Welcome to UrsaMU",
            data: {
              en: players[0],
              tar: players[0],
              token,
            },
          })
        );
        mu.send(await cmds.force(req, "look"));

        return {
          socket: req.socket,
          payload: {
            command: "text",
            message: "",
            data: {
              en: players[0],
              tar: players[0],
            },
          },
        };
      } else {
        return payload(req, {
          command: "error",
          message: "Unable to authenticate password.",
        });
      }
    } else {
      // Unable to find the caracter.
      return payload(req, {
        message: "Unable to find that character.",
        command: "error",
      });
    }
  } else {
    // Unknown request.
    return payload(req, {
      command: "error",
      message: "Error. Username and password are required.",
    });
  }
};

export default mu.service("connect", connect);
