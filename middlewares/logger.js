import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    const logsDir = path.join(path.dirname(""), "logs");
    if (!fs.existsSync(logsDir)) {
      console.log("Creating logs directory...");
      await fsPromises.mkdir(logsDir);
      console.log("Logs directory created.");
    }
    await fsPromises.appendFile(path.join(logsDir, logFileName), logItem);
    console.log("Log item appended.");
  } catch (err) {
    console.error("Error writing log:", err);
  }
};

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");
  console.log(`${req.method} ${req.path}`);
  next();
};

export { logEvents, logger };
