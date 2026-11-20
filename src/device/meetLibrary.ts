import { openMeet, type Meet, type OpenMeetResult } from "../meet";
import type { DeviceStorage } from "./storage";

const MEET_FILE = "meet-file";

/** The one meet kept on this device: opened from a file, restored on the next visit, removable. */
export interface MeetLibrary {
  /** Opens the file and, if it is a meet, keeps it in place of the previous one. */
  open(bytes: Uint8Array): Promise<OpenMeetResult>;
  /** The meet kept from an earlier visit, or null if there is none or it can't be read. */
  restore(): Promise<Meet | null>;
  remove(): Promise<void>;
}

export function createMeetLibrary(storage: DeviceStorage): MeetLibrary {
  return {
    async open(bytes) {
      const result = openMeet(bytes);
      if (result.ok) await storage.set(MEET_FILE, bytes);
      return result;
    },

    async restore() {
      try {
        const bytes = await storage.get(MEET_FILE);
        if (!(bytes instanceof Uint8Array)) return null;
        const result = openMeet(bytes);
        return result.ok ? result.meet : null;
      } catch {
        return null;
      }
    },

    remove: () => storage.delete(MEET_FILE),
  };
}
