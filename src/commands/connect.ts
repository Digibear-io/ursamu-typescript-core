import mu, { db, payload, flags, cmds } from "../mu";
import { MuRequest } from "../types";
import { sha512 } from "js-sha512";

export default () => {
  mu.cmd({
    name: "connect",
    pattern: /connect\s+?(.*)\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      let user = args[1];
      let password = args[2];

      if (user && password) {
        // Find the player DBObj
        const players = await db
          .find({
            $where: function () {
              return this.name.toLowerCase() === user.toLowerCase()
                ? true
                : false;
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
            const room = await db.get({ _id: players[0].location });

            if (room) {
              const conSet = new Set(room.contents).add(players[0]._id!);
              room.contents = Array.from(conSet);
              await db.update({ _id: room._id }, room);
            }

            req.socket.join(players[0].location);

            // If the character isn't already seen as connected, don't bother
            // making them look at their location again.
            if (players[0].flags.indexOf("connected") !== -1) {
              return payload(req, {
                command: "reconnect",
                message: "You have reconnected.",
                data: { en: players[0], tar: players[0] },
              });
            } else {
              await flags.setFlag(players[0], "connected");
              mu.send(
                payload(req, {
                  message: "Welcome to UrsaMU!",
                  data: { en: players[0], tar: players[0] },
                })
              );
              mu.send(await cmds.force(req, "look", ["here"]));
              req.payload.message = "";
              return payload(req, {
                command: "connected",
                message: "",
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
    },
  });
};
