/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppLoggerContext, LogMessage } from '@/components/AppLogger';
import { useContext } from 'react';

export interface Logger {
  logInfo: (msg: string, ...args: any[]) => void;
  logError: (msg: string, ...args: any[]) => void;
  logWarn: (msg: string, ...args: any[]) => void;
  logDebug: (msg: string, ...args: any[]) => void;
}

export const useAppLogger = (loggerName?: string): Logger & { logs: LogMessage[] } => {
  const context = useContext(AppLoggerContext);
  if (context === undefined) {
    throw new Error('useAppLogger must be used within an AppLoggerProvider');
  }

  return {
    logs: context.logs,
    logInfo: (msg: string, ...args: any[]) =>
      context.logMessage(`${msg} ${args?.map((e) => JSON.stringify(e))}`, loggerName, 'info'),
    logError: (msg: string, ...args: any[]) =>
      context.logMessage(`${msg} ${args?.map((e) => JSON.stringify(e))}`, loggerName, 'error'),
    logWarn: (msg: string, ...args: any[]) =>
      context.logMessage(`${msg} ${args?.map((e) => JSON.stringify(e))}`, loggerName, 'warn'),
    logDebug: (msg: string, ...args: any[]) =>
      context.logMessage(`${msg} ${args?.map((e) => JSON.stringify(e))}`, loggerName, 'debug'),
  };
};

export default useAppLogger;
