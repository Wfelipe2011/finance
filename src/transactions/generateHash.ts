import { createHash } from "crypto";

export function generateHash(data: string) {
    return createHash('sha256').update(data).digest('hex');
  }