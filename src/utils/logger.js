// src/utils/logger.js
import fs from 'fs';
import path from 'path';

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

const ICONS = {
  debug: '🔍',
  info: '📋',
  warn: '⚠️ ',
  error: '❌',
  success: '✅',
  memory: '🧠',
  reward: '🏆',
  step: '👣',
  episode: '🎬',
  agent: '🤖',
  task: '📝',
  optimize: '⚡',
};

class Logger {
  constructor() {
    this.level = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];
    this.pretty = process.env.ENABLE_PRETTY_LOGS !== 'false';
    this.logFile = process.env.LOG_FILE;
    this._ensureLogDir();
  }

  _ensureLogDir() {
    if (this.logFile) {
      const dir = path.dirname(this.logFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  _write(level, icon, color, ...args) {
    if (LOG_LEVELS[level] < this.level) return;
    const ts = new Date().toISOString();
    const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ');

    if (this.pretty) {
      const prefix = `${COLORS.gray}${ts}${COLORS.reset} ${icon} ${color}${COLORS.bold}[${level.toUpperCase()}]${COLORS.reset} `;
      console.log(`${prefix}${msg}`);
    } else {
      console.log(`[${ts}] [${level.toUpperCase()}] ${msg}`);
    }

    if (this.logFile) {
      fs.appendFileSync(this.logFile, `[${ts}] [${level.toUpperCase()}] ${msg}\n`);
    }
  }

  debug(...args)   { this._write('debug', ICONS.debug,   COLORS.gray,    ...args); }
  info(...args)    { this._write('info',  ICONS.info,    COLORS.blue,    ...args); }
  warn(...args)    { this._write('warn',  ICONS.warn,    COLORS.yellow,  ...args); }
  error(...args)   { this._write('error', ICONS.error,   COLORS.red,     ...args); }
  success(...args) { this._write('info',  ICONS.success, COLORS.green,   ...args); }
  memory(...args)  { this._write('info',  ICONS.memory,  COLORS.magenta, ...args); }
  reward(...args)  { this._write('info',  ICONS.reward,  COLORS.yellow,  ...args); }
  step(...args)    { this._write('debug', ICONS.step,    COLORS.cyan,    ...args); }
  episode(...args) { this._write('info',  ICONS.episode, COLORS.blue,    ...args); }
  agent(...args)   { this._write('debug', ICONS.agent,   COLORS.white,   ...args); }
  task(...args)    { this._write('info',  ICONS.task,    COLORS.cyan,    ...args); }
  optimize(...args){ this._write('info',  ICONS.optimize,COLORS.magenta, ...args); }

  separator(label = '') {
    const line = '─'.repeat(60);
    if (label) {
      const pad = Math.max(0, Math.floor((60 - label.length - 2) / 2));
      const l = '─'.repeat(pad);
      console.log(`${COLORS.gray}${l} ${COLORS.cyan}${COLORS.bold}${label}${COLORS.reset} ${COLORS.gray}${l}${COLORS.reset}`);
    } else {
      console.log(`${COLORS.gray}${line}${COLORS.reset}`);
    }
  }

  table(data, title = '') {
    if (title) this.separator(title);
    if (Array.isArray(data)) {
      data.forEach((row, i) => {
        console.log(`  ${COLORS.gray}${i + 1}.${COLORS.reset} ${JSON.stringify(row)}`);
      });
    } else {
      Object.entries(data).forEach(([k, v]) => {
        console.log(`  ${COLORS.cyan}${k}:${COLORS.reset} ${JSON.stringify(v)}`);
      });
    }
  }
}

export const logger = new Logger();
