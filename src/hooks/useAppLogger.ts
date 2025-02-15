import { useState } from 'react';

type LogMessage = {
  message: string;
  component: string;
  type: 'debug' | 'info' | 'warn' | 'error';
};

const useAppLogger = () => {
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const logMessage = (message: string, component?: string, type?: LogMessage['type']) => {
    const logType = type || 'info';
    const logComponent = component || 'app';
    setLogs((prevLogs) => [...prevLogs, { message, component: logComponent, type: logType }]);
  };
  return { logs, logMessage };
};

export default useAppLogger;
