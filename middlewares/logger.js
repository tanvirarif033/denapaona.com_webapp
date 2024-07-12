import { format } from "date-fns";
import { v4 as uuid } from "uuid";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  try {
    const logsDir = path.join(path.resolve(), "logs");
    console.log(`Logs directory: ${logsDir}`); // Debugging log

    if (!fs.existsSync(logsDir)) {
      console.log("Logs directory does not exist, creating...");
      await fsPromises.mkdir(logsDir);
      console.log("Logs directory created.");
    }

    const logFilePath = path.join(logsDir, logFileName);
    console.log(`Writing log to: ${logFilePath}`); // Debugging log

    await fsPromises.appendFile(logFilePath, logItem);
    console.log("Log entry written."); // Debugging log
  } catch (err) {
    console.error("Error writing to log file:", err);
  }
};

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");
  console.log(`${req.method} ${req.path}`);
  next();
};

export { logEvents, logger };
