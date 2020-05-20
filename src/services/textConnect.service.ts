import { MuRequest, DBObj } from "../types";
import mu, { payload, db, flags } from "../mu";
import jwt, { JsonWebTokenError } from "jsonwebtoken";

const textConnect = async (req: MuRequest) => {
  if (req.payload.data.token) {
    try {
      const id = jwt.verify(req.payload.data.token, "secret");
      if (id) {
        const en = (await db.get({ _id: id })) as DBObj;

        await flags.setFlag(en, "connected");
        req.socket.join(en.location);
        mu.connections.set(req.socket.id, en);

        return payload(req, {
          message: "You are **reconnected**!",
          data: { matched: true },
        });
      } else {
        return payload(req, {
          message: mu.text.get("connect"),
          data: { matched: true },
        });
      }
    } catch (error) {
      return payload(req, {
        message: mu.text.get("connect"),
        data: { matched: true },
      });
    }
    // Token was verified.
  } else {
    return payload(req, {
      message: mu.text.get("connect"),
      data: { matched: true },
    });
  }
};

export default mu.service("textconnect", textConnect);
