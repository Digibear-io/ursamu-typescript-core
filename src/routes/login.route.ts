import mu, { db } from "../mu";
import { Request, Response } from "express";
import { sha512 } from "js-sha512";
import jwt from "jsonwebtoken";
import express from "express";

const router = express.Router();

const auth = async (user: string, password: string) => {
  if (user && password) {
    // Find the player DBObj
    const players = await db
      .find({
        $where: function () {
          return this.name.toLowerCase() === user.toLowerCase() ? true : false;
        },
      })
      .catch((err) => {
        throw err;
      });

    if (players && players.length > 0) {
      // verify the passwords match.  If a match, connect
      // the socket to the game proper.
      if (players[0].password?.match(sha512(password))) {
        return jwt.sign(players[0]._id!, "secret");
      } else {
        throw new Error("Unable to authenticate password.");
      }
    } else {
      // Unable to find the caracter.
      throw new Error("Unable to find character.");
    }
  } else {
    throw new Error("User and password required.");
  }
};

router.post("/", async (req: Request, res: Response) => {
  const user = req.body.user;
  const password = req.body.password;

  // Get a fresh token
  const token = await auth(user, password).catch((err: Error) =>
    res.status(401).json({
      error: true,
      message: err.message,
    })
  );
  res.status(200).json({ error: false, message: "Authenticated.", token });
});

export default router;
