import { randomBytes } from "crypto";

export function createVisitorToken(): string {
  return randomBytes(24).toString("hex");
}
