import fs from "fs";
import csvParser from "csv-parser";
import { v4 as uuidv4 } from "uuid";
import pLimit from "p-limit";
import { Request, Response, NextFunction } from "express";
import { validateEmail } from "../services/emailValidation";
import { uploadStatus } from "../utils/progressStore";

const limit = pLimit(Number(process.env.PROMISE_CONCURRENCY_LIMIT) || 5);

export const handleFileUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  if (req.file.mimetype !== "text/csv") {
    res
      .status(400)
      .json({ error: "Invalid file type. Only CSV files are allowed." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const uploadId = uuidv4();
  uploadStatus.set(uploadId, {
    processed: 0,
    failed: 0,
    total: 0,
    details: [],
  });

  res.write(
    `event: uploadReceived\ndata: ${JSON.stringify({ message: "File uploaded successfully", uploadId })}\n\n`,
  );

  const tasks: Promise<void>[] = [];

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", () => {
      uploadStatus.get(uploadId).total++;
    });

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row: { name: string; email: string }) => {
      const task = limit(() =>
        validateEmail(row.email).then(({ email, isValid }) => {
          if (!isValid) {
            uploadStatus
              .get(uploadId)
              .details.push({ email, error: "Invalid email" });
            uploadStatus.get(uploadId).failed++;
          }

          uploadStatus.get(uploadId).processed++;
        }),
      );
      tasks.push(task);
    })
    .on("end", () => {
      Promise.all(tasks)
        .then(() => {
          res.write(
            `event: uploadProcessed\ndata: ${JSON.stringify({ processed: uploadStatus.get(uploadId).total - uploadStatus.get(uploadId).failed, ...uploadStatus.get(uploadId) })}\n\n`,
          );
          res.end();
          fs.unlinkSync(req.file!.path);
        })
        .catch(next);
    });
  return;
};
