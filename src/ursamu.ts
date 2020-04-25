import express, { Request, Response } from "express";
import { Server } from "http";
import mu, { config } from "./mu";

// Define the various communication channels.
const app = express();
const server = new Server(app).listen(config.game.port || 8090);

mu.server(server);
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) =>
  res.send("Welcome to UrsaMU!").end()
);

process.on("SIGINT", () => process.exit(1));
