const PREFIX = "[neu-processor]";

export function log(message: string): void {
  console.log(`${PREFIX} ${message}`);
}

export function createTimer(label: string): () => void {
  const start = performance.now();
  log(`${label}...`);
  return () => {
    const ms = (performance.now() - start).toFixed(0);
    log(`${label} done (${ms}ms)`);
  };
}
