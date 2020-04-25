import { MuRequest, MiddlewareNext, payload } from "../mu";
import shortid from "shortid";

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
