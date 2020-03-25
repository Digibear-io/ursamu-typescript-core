import express, { Request, Response } from "express";
import { Server } from "http";
import socketio from "socket.io";
import config from "./config/config.json";
import { resolve } from "path";
import ursamu from "./api/mu";
import cors from "cors";

// Define the various communication channels.
const app = express();
const server = new Server(app);
const io = socketio(server);
const mu = ursamu.attach(io);

app.use(express.static("public"));

app.get("/", (req: Request, res: Response) =>
  res.sendFile(resolve(__dirname, "../public/index.html"))
);

mu.start(() =>
  server.listen(config.game.port, () => {
    console.log(`Server started on port: ${config.game.port}`);
  })
);

process.on("SIGINT", () => process.exit(1));
