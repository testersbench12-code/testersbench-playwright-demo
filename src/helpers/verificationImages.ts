import * as fs from 'fs';
import * as path from 'path';
import { verifyProfileFields } from '../config';

export type VerificationImageSet = {
  idFrontPath: string;
  idBackPath: string;
};

export function getRandomIdVerificationImages(
  folderPath = verifyProfileFields.idVerificationImageFolder,
): VerificationImageSet {
  if (!fs.existsSync(folderPath)) {
    throw new Error(`ID verification image folder not found: ${folderPath}`);
  }

  const files = fs
    .readdirSync(folderPath)
    .map((name) => path.join(folderPath, name))
    .filter((file) => ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase()));

  if (files.length === 0) {
    throw new Error(`No ID verification images found in ${folderPath}.`);
  }

  const front = files[Math.floor(Math.random() * files.length)];
  const alternatives = files.filter((file) => file !== front);
  const back =
    alternatives.length === 0
      ? front
      : alternatives[Math.floor(Math.random() * alternatives.length)];

  return {
    idFrontPath: path.resolve(front),
    idBackPath: path.resolve(back),
  };
}
