// server.js - Web API Server
import 'dotenv/config';
import app from './src/api/server.js';
import { logger } from './src/utils/logger.js';

logger.separator('WEB SERVER STARTING');
logger.info('Starting Self-Improving RL Environment Web Interface...');
