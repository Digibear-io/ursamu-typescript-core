import { MuRequest } from "../api/parser";
import { verify } from "jsonwebtoken";
import db from "../api/database";
import text from "../api/text";
import mu from "../api/mu";
import flags from "../api/flags";

/**
 * Handle a socket connecting to the server.
 */
export default async (req: MuRequest): Promise<MuRequest> => {
  // Defining an expression to handle showing the connection
  // screen.  Gotta keep that code DRY!
  const showConnect = (): MuRequest => {
    return {
      socket: req.socket,
      payload: {
        command: "connect",
        message: text.get("connect"),
        data: req.payload.data
      }
    };
  };

  if (req.payload.data.token) {
    // If the request already has a valid JWT attached to it
    // bypass the login screen.
    try {
      const auth = verify(req.payload.data.token, "secret") as {
        [key: string]: any;
      };
      //
      await db.get({ id: auth.id }).catch(err => {
        mu.io?.to(req.socket.id).emit("authFailure", err);
        return showConnect();
      });
      mu.connMap.set(req.socket.id, await db.get({ id: auth.id }));
      flags.setFlag(mu.connMap.get(req.socket.id)!, "connected");
      return {
        socket: req.socket,
        payload: {
          command: "message",
          message: "",
          data: {}
        }
      };
    } catch (err) {
      mu.io?.to(req.socket.id).emit("authFailure", err);
      return showConnect();
    }
  } else {
    return showConnect();
  }
};
