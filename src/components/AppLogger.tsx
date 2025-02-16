import { createContext, useState, ReactNode } from 'react';

type LogMessage = {
  message: string;
  timestamp: string;
  component: string;
  level: 'debug' | 'info' | 'warn' | 'error';
};

type AppLoggerContextType = {
  logs: LogMessage[];
  logMessage: (message: string, component?: string, type?: LogMessage['level']) => void;
};

export const AppLoggerContext = createContext<AppLoggerContextType | undefined>(undefined);

export const AppLoggerProvider = ({ children }: { children: ReactNode }) => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logMessage = (message: string, component?: string, type?: LogMessage['level']) => {
    const logType = type || 'info';
    const logComponent = component || 'app';
    const timestamp = new Date().toISOString();
    console.log(`${logComponent} [${logType}] ${message}`);
    setLogs((prevLogs) => [...prevLogs, { timestamp, message, component: logComponent, level: logType }]);
  };

  return <AppLoggerContext.Provider value={{ logs, logMessage }}>{children}</AppLoggerContext.Provider>;
};

export default AppLoggerProvider;
