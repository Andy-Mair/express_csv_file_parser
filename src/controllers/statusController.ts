import { Request, Response } from "express";
import { uploadStatus } from "../utils/progressStore";

export const getStatus = (req: Request, res: Response): void => {
  const status = uploadStatus.get(req.params.uploadId);
  if (!status) res.status(404).json({ error: "Upload ID not found" });

  res.json({
    uploadId: req.params.uploadId,
    progress: `${(status.processed * 100) / status.total}%`,
  });
};
