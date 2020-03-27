import cmds from "../api/commands";
import mu from "../api/mu";
import parser, { MuRequest } from "../api/parser";

export default () => {
  cmds.add({
    name: "think",
    flags: "connected",
    pattern: "think *",
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connMap.get(req.socket.id);
      return {
        socket: req.socket,
        payload: {
          command: "think",
          message: await parser.run(en!, args[1], {}),
          data: req.payload.data
        }
      };
    }
  });
};
