//  Middleware system here
import { UrsaMajor, MiddlewareNext } from "./classes/ursamajor.class";
import commands from "./middleware/commands";
import dftlCmds from "./commands/defaultcommands";

const app = new UrsaMajor();

app.use(commands);
app.plugin(dftlCmds);

app.start();

process.on("message", async (message: string) =>
  process.send!(await app.handle(message))
);
