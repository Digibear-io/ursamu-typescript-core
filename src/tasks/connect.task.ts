import { verify, sign } from "jsonwebtoken";
import mu, { payload, MuRequest, flags, db } from "../mu";
import { sha512 } from "js-sha512";

/**
 * Handle a socket connecting to the server.
 */
export default async (req: MuRequest): Promise<MuRequest> => {
  const { user, password, token } = req.payload.data;

  // Depending on the data sent, either verify the JWT provided
  // or authenticate user/pass and return a JWT to store on the
  // client.
  if (token) {
    // If the request already has a valid JWT attached to it
    // bypass the login screen.
    verify(token, "secret", {}, async (err: Error, decoded: any) => {
      if (err)
        return payload(req, {
          message: "Error",
          command: `Error: ${err.message}`,
          data: { error: err },
        });

      // get the DBObj
      const player = await db.get({ id: decoded.id }).catch((err: Error) => {
        mu.io?.to(req.socket.id).send(
          payload(req, {
            message: `Error: ${err.message}`,
            command: "error",
            data: { error: err },
          })
        );
      });

      // if player exists, add them to the game.
      if (player) {
        mu.connections.set(req.socket.id, player);
        await flags.setFlag(player, "connected");
        // Send a response back to the socket.
        mu.io?.to(req.socket.id).send({
          command: "reconnected",
          message: "<p>Connected w/token!</p>",
          data: { player, token },
        });
      } else {
        // Unable to find the caracter.
        return payload(req, {
          message: "Unable to find that character.",
          command: "error",
        });
      }
    });
  } else if (user && password && !token) {
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
        await flags.setFlag(players[0], "connected");
        delete players[0].password;

        // Sign the JWT and return it to the client along with the
        // character info minus hashed password.
        try {
          const token = sign(
            { id: players[0].id, flags: players[0].flags },
            "secret",
            { expiresIn: "1d" }
          );
          return payload(req, {
            command: "connected",
            message: "Connected!",
            data: { player: players[0], token },
          });
        } catch (error) {
          return payload(req, {
            message: "Unable to sign token",
            command: "error",
          });
        }
      } else {
        return payload(req, {
          command: "error",
          message: "Can't authenticate password.",
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

  return payload(req, {
    command: "derp",
    message: "Passthrough, ignore me!",
  });
};
