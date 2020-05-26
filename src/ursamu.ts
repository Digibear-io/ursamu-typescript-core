import mu, { config } from "./mu";
import express from "express";
import cors from "cors";
import bearerToken from "express-bearer-token";
import { createServer } from "http";
import apiRoute from "./routes/api.route";
import loginRoute from "./routes/login.route";
import authenticate from "./middleware/authenticate";

const app = express();
const server = createServer(app);
mu.attach(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bearerToken());

// routes
app.use("/login", loginRoute);
app.use("/api/v1", authenticate, apiRoute);

// Assign Middleware
app.use(express.static("public"));

// Start listening for new connections.
server.listen(config.game.port, () =>
  console.log(`UrsaMU Listening on port: ${config.game.port}`)
);
