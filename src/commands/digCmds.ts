import cmds from "../api/commands";
import { MuRequest } from "../api/parser";
import mu from "../api/mu";

export default () => {
  cmds.add({
    name: "dig",
    pattern: /@dig\s+?(.*)/i,
    flags: "admin connected",
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connMap.get(req.socket.id);

      return {
        socket: req.socket,
        payload: req.payload
      };
    }
  });
};
