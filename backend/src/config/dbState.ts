let dbReady = false;

export function setDbReady(ready: boolean): void {
  dbReady = ready;
}

export function isDbReady(): boolean {
  return dbReady;
}
