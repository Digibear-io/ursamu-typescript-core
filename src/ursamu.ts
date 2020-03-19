import express, { Request, Response } from "express";
import { Server } from "http";
import socketio, { Socket } from "socket.io";
import config from "../config/config.json";
import { resolve } from "path";
import { Marked } from "@ts-stack/markdown";
import mu, { MuResponse } from "./classes/ursamajor.class";
import commands from "./middleware/commands";
import dfltCmds from "./commands/defaultcommands";

// Define the various communication channels.
const app = express();
const server = new Server(app);
const io = socketio(server);

app.get("/", (req: Request, res: Response) =>
  res.sendFile(resolve(__dirname, "../public/index.html"))
);

// Handle new client connections.
io.on("connection", async (socket: Socket) => {
  const { id, payload }: MuResponse = await mu.process({
    socket: socket,
    payload: {
      command: "connect"
    }
  });
  // Send the results back to the client.
  io.to(id).send(payload);

  // When a new message comes from the MU, process
  // it and return the results.
  socket.on("message", async (message: string) => {
    const { id, payload }: MuResponse = await mu.process({
      socket,
      payload: { command: "message", message }
    });

    // Send the results back to the client after converting
    // any markdown.
    if (payload.message) payload.message = Marked.parse(payload.message);
    io.to(id).send(payload);
  });
});

mu.use(commands)
mu.plugin(dfltCmds)


server.listen(config.game.port, () => {
  mu.start();
  console.log(`Server started on port: ${config.game.port}`);
});
