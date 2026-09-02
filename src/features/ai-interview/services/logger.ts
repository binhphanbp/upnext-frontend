export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "VAD" | "STT" | "TTS" | "API";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  details?: string | undefined;
}

class AppLoggerService {
  private logs: LogEntry[] = [];
  private maxLogs = 2000;

  constructor() {
    this.log("INFO", "SYSTEM", "Client App Logger initialized.");
  }

  public log(level: LogLevel, tag: string, message: string, details?: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      details: details
        ? typeof details === "object"
          ? JSON.stringify(details)
          : String(details)
        : undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const formattedConsole = `[${entry.timestamp}] [${level}] [${tag}] ${message}`;
    if (level === "ERROR") {
      console.error(formattedConsole, details || "");
    } else if (level === "WARN") {
      console.warn(formattedConsole, details || "");
    } else {
      console.log(formattedConsole, details || "");
    }
  }

  public info(tag: string, message: string, details?: unknown) {
    this.log("INFO", tag, message, details);
  }

  public warn(tag: string, message: string, details?: unknown) {
    this.log("WARN", tag, message, details);
  }

  public error(tag: string, message: string, details?: unknown) {
    this.log("ERROR", tag, message, details);
  }

  public vad(message: string, details?: unknown) {
    this.log("VAD", "AUDIO_VAD", message, details);
  }

  public stt(message: string, details?: unknown) {
    this.log("STT", "SPEECH_RECOG", message, details);
  }

  public tts(message: string, details?: unknown) {
    this.log("TTS", "SYNTHESIS", message, details);
  }

  public api(message: string, details?: unknown) {
    this.log("API", "BACKEND_HTTP", message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public getFormattedLogText(): string {
    return this.logs
      .map((l) => {
        let line = `[${l.timestamp}] [${l.level.padEnd(5)}] [${l.tag}] ${l.message}`;
        if (l.details) {
          line += `\n  Details: ${l.details}`;
        }
        return line;
      })
      .join("\n");
  }

  public downloadLogFile(filename?: string) {
    if (typeof window === "undefined") return;
    const text = this.getFormattedLogText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const nowStr = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = filename || `interview_client_${nowStr}.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  public clear() {
    this.logs = [];
    this.info("SYSTEM", "Logs cleared.");
  }
}

export const appLogger = new AppLoggerService();
