import { MuRequest } from "../types";
import services from "../api/services";
import commandsHook from "../hooks/commands.hook";
import substitutionsHooks from "../hooks/substitutions.hook";
import msgdataHook from "../hooks/msgdata.hook";
import moveHook from "../hooks/move.hook";

export default () => {
  services
    .register("message", async (req: MuRequest) => {
      return req;
    })
    .hook("before", commandsHook, moveHook, substitutionsHooks, msgdataHook);
};
