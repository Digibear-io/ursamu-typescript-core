import mu, { payload, MuRequest, flags, db } from "../mu";
import { sha512 } from "js-sha512";

/**
 * Handle a socket connecting to the server.
 */
export default async (req: MuRequest): Promise<MuRequest> => {
  const { user, password } = req.payload.data;

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

        // If the character isn't already seen as connected, don't bother
        // making them look at their location again.
        if (players[0].flags.indexOf("connected") !== -1) {
          return payload(req, {
            command: "reconnect",
            message: "",
            data: { en: players[0], tar: players[0] },
          });
        } else {
          await flags.setFlag(players[0], "connected");
          return payload(req, {
            command: "connected",
            message: "Welcome to UrsaMU",
            data: {
              en: players[0],
              tar: players[0],
            },
          });
        }
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
