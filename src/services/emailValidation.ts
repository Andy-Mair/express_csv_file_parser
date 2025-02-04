import validator from "validator";
import { logger } from "../utils/logging";

export const validateEmail = (
  email: string,
): Promise<{ email: string; isValid: Boolean }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // if (Math.random() < 0.003) {
      //   return reject(new Error("Email validation service timeout"));
      // }
      const isValid = validator.isEmail(email);
      logger.log({
        level: "info",
        message: `Validation attempt ${isValid ? "successful" : "failed"}`,
      });
      resolve({ email, isValid });
    }, Math.random() * 2000);
  });
};
