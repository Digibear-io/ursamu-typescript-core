import express, { Request, Response } from "express";
import { Server } from "http";
import socketio from "socket.io";
import config from "./api/config";
import { resolve } from "path";
import ursamu from "./mu";


// Define the various communication channels.
const app = express();
const server = new Server(app).listen(config.game.port || 8090);

ursamu.server(server);
app.use(express.static("public"));

app.get("/", (req: Request, res: Response) =>
  res.sendFile(resolve(__dirname, "../public/index.html"))
);


process.on("SIGINT", () => process.exit(1));
