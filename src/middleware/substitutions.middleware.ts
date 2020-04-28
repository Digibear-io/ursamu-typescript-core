import { MuRequest, payload } from "../mu";

export default (req: MuRequest): MuRequest => {
  const message = req.payload.message
    .replace(/<c\s+?(.*)>(.*)<\/\s?c>/gi, "<span style='color: $1'>$2</span>")

    return payload(req, {message});
};
