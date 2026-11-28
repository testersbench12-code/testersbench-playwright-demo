import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerCredentials } from '../config';

const counterFile = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'TestersBench',
  'registration-counter.txt',
);

let counter = 0;
if (fs.existsSync(counterFile)) {
  const parsed = Number.parseInt(fs.readFileSync(counterFile, 'utf8').trim(), 10);
  if (!Number.isNaN(parsed)) counter = parsed;
}

export function emailAt(number: number): string {
  return `${registerCredentials.emailPrefix}${number}${registerCredentials.emailDomain}`;
}

export function getNextStartNumber(): number {
  return counter + 1;
}

export function setEmailCounter(number: number): void {
  if (number <= counter) return;
  counter = number;
  fs.mkdirSync(path.dirname(counterFile), { recursive: true });
  fs.writeFileSync(counterFile, String(number), 'utf8');
}
