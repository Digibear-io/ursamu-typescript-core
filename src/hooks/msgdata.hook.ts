import { payload } from "../mu";
import shortid from "shortid";
import { MuRequest, MiddlewareNext } from "../types";

export default async (req: MuRequest) =>
  payload(req, {
    data: {
      created: Date.now(),
      msgID: shortid.generate(),
    },
  });
