/** Key-value storage on this device. Nothing stored here ever leaves the device (ADR 0001). */
export interface DeviceStorage {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  delete(key: string): Promise<void>;
}
