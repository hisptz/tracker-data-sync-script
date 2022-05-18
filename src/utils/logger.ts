import {createLogger, format, transports} from "winston";


const logger = createLogger({
    level: "info",
    format:
        format.combine(
            format.timestamp(),
            format.json()
        ),
    transports: [
        new transports.Console({
            format: format.simple(),
        }),
        new transports.File({filename: "logs/error.log", level: "error"}),
        new transports.File({filename: "logs/info.log", level: "info"}),
    ]
});


export default logger;
