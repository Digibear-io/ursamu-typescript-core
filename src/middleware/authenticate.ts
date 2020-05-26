import { db } from "../mu";
import { Response, Request, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Basic server information.
export default async (req: any, res: Response, next: NextFunction) => {
  const token = req.token;
  // Verify the token, or handle the error with a response back to the
  //client.
  if (token) {
    try {
      const decoded = jwt.verify(token, "secret");
      if (decoded) {
        // Try to pull the character object, or send an error response.
        req.char = await db.get({ _id: decoded }).catch((err) => next(err));
        next();
      }
    } catch (error) {
      res.status(401).json({ error: true, message: "Permission denied." });
    }
  } else {
    res.status(401).json({ error: true, message: "Permission deined." });
  }
};
