import { Router } from "express";
import multer from "multer";
import { handleFileUpload } from "../controllers/uploadController";

const router = Router();
const upload = multer({
    dest: "uploads/",
    fileFilter: (req, file, cb) => {
      console.log("File received:", file.originalname, file.mimetype); // ✅ Log received file
      if (file.mimetype !== "text/csv") {
        return cb(new Error("Only CSV files are allowed"));
      }
      cb(null, true);
    }
  });

router.post("/", upload.single("file"), handleFileUpload);

export default router;
