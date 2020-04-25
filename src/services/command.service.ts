import { cmds, MuRequest } from "../mu";

export default async (req: MuRequest): Promise<MuRequest> => {
  return await cmds.force(req, req.payload.data.name, req.payload.data.args);
};
