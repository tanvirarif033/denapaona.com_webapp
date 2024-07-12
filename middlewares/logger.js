import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    const logsDir = path.join(__dirname, "..", "logs");
    if (!fs.existsSync(logsDir)) {
      await fsPromises.mkdir(logsDir, { recursive: true });
      console.log("Logs directory created.");
    }
    const logFilePath = path.join(logsDir, logFileName);
    await fsPromises.appendFile(logFilePath, logItem);
    console.log(`Log written to ${logFilePath}`);
  } catch (err) {
    console.error("Error writing log:", err);
  }
};

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log")
    .then(() => {
      console.log(`${req.method} ${req.path}`);
      next();
    })
    .catch((err) => {
      console.error("Error in logger middleware:", err);
      next();
    });
};

export default logger;
export { logEvents };
