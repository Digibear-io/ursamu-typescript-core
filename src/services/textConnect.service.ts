import { MuRequest } from "../types";
import mu, { payload } from "../mu";

const textConnect = async (req: MuRequest) => {
  return payload(req, { message: "You connected!!" });
};

export default textConnect;
