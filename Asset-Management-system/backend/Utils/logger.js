import winston from "winston";

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(
      ({ timestamp, level, message }) =>
        `${timestamp} | ${level.toUpperCase()} | ${message}`
    )
  ),
  transports: [
    new winston.transports.File({ filename: "logs/requests.log" }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
  ],
});

// Console logging only in development
if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console());
}

export default logger;
