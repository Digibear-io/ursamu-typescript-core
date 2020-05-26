import express, { Request } from "express";
import { Response } from "express";

const router = express.Router();

router.get("/", (req: any, res: Response) => {
  res.json(req.char);
});

export default router;
