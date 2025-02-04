import "dotenv/config";
import express, { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import uploadRoutes from "./routes/uploadRoutes";
import statusRoutes from "./routes/statusRoutes";
import type { ErrorRequestHandler } from "express";
import { logger } from "./utils/logging";

export const app = express();
const port = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_TIME_PERIOD) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_NUM_REQUEST) || 100,
  message: "Too many requests, please try again later.",
});

app.use(limiter);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

app.get("/test-error", (req, res) => {
  throw new Error("Internal server error");
});

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err.message === "Internal server error") {
    res.status(500).json({ error: "Internal Server Error" });
    logger.error("Internal Server Error");
  } else {
    res.status(400).json({ message: err.message });
    logger.error(err.message);
  }
};

app.use(errorHandler);
app.use("/upload", uploadRoutes);
app.use("/status", statusRoutes);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

export default app; 