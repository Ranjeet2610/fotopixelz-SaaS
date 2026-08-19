export function getServiceHealth(name: string) {
  return { service: name, status: 'ok' as const, timestamp: new Date().toISOString() }
}

