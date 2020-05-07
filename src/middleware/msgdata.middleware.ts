import { payload } from "../mu";
import shortid from "shortid";
import { MuRequest, MiddlewareNext } from "../types";

export default (req: MuRequest, next: MiddlewareNext) =>
  next(
    null,
    payload(req, {
      data: {
        created: Date.now(),
        msgID: shortid.generate(),
      },
    })
  );
