//  Middleware system here
import { UrsaMajor, MiddlewareNext } from "./classes/ursamajor.class";
import commands from "./middleware/commands";
import dfltCmds from "./commands/defaultcommands";

const app = new UrsaMajor();

app.use(commands);
app.plugin(dfltCmds);

app.start();

process.on("message", async (msg: string) => {
  const {
    id,
    message,
    command = ""
  }: { id: string; message: string; command: string } = JSON.parse(msg);
  switch (command.toLowerCase()) {
    case "connect":
      process.send!(JSON.stringify({ id, message: app.txt.get("connect") }));
    default:
      process.send!(await app.handle(JSON.stringify({ id, message })));
  }
});
