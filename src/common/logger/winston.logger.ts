import { createLogger, format, transports } from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export const winstonLogger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
  ),
  transports: [
    // Console ga chiroyli chiqarish
    new transports.Console({
      format: format.combine(
        format.colorize(),
        nestWinstonModuleUtilities.format.nestLike('CRM', {
          prettyPrint: true,
          colors: true,
        }),
      ),
    }),

    // Barcha loglar
    new transports.File({
      filename: 'logs/combined.log',
      format: format.combine(format.timestamp(), format.json()),
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),

    // Faqat xatolar
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(format.timestamp(), format.json()),
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],
});
