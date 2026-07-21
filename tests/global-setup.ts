import { ensureAdminExists, ensureAssistantExists } from './helpers/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

export default async function globalSetup() {
  dotenv.config({ path: path.resolve(__dirname, '../.env.test') });
  console.log('Running global setup to seed database...');
  await ensureAdminExists();
  await ensureAssistantExists();
  console.log('Global setup complete.');
}
