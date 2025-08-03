// Polyfills pour les variables globales Node.js dans l'environnement navigateur
if (typeof window !== 'undefined') {
  // Polyfill pour process
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = {
      env: {},
      version: '',
      platform: 'browser',
      nextTick: (fn: Function) => setTimeout(fn, 0),
    };
  }

  // Polyfill pour Buffer
  if (typeof (window as any).Buffer === 'undefined') {
    (window as any).Buffer = {
      from: (data: any) => new Uint8Array(data),
      alloc: (size: number) => new Uint8Array(size),
      allocUnsafe: (size: number) => new Uint8Array(size),
    };
  }

  // Polyfill pour global
  if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
  }
}

export {}; 