import mu, { cmds } from "../mu";
import { MuRequest } from "../types";

const command = async (req: MuRequest): Promise<MuRequest> => {
  return await cmds.force(req, req.payload.data.name, req.payload.data.args);
};

export default mu.service("command", command);
