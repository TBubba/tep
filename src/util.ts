/**
 * Convert a time lapse (in milliseconds) to a more human readable format.
 * @param time Time lapse in milliseconds.
 * @returns Time, but in a more human readable format.
 */
export function timeToString(time: number): string {
  if      (time < 1000)    { return `${a(time      )}ms`;                          }
  else if (time < 60000)   { return `${a(time/1000 )}s ${a( time%1000       )}ms`; }
  else if (time < 3600000) { return `${a(time/60000)}m ${a((time%60000)/1000)}s`;  }
  return `${a(time/3600000)}h`;
  function a(n: number) { return Math.max(1, n | 0); }
}

/**
 * Wrap a function with an async function (effectively making it async).
 * @param fn Function to wrap.
 * @returns Asynchronous wrapper of the argument function.
 */
export function toAsync<T>(fn: (...args: any[]) => T): () => Promise<T> {
  return name(fn.name, () => new Promise<T>((resolve, reject) => {
    // Call function
    let result: any = undefined;
    let error: any = undefined;
    try { result = fn(); }
    catch(err) { error = err; }
    // Check if it's a promise
    if (result && typeof result.then === 'function' && typeof result.catch === 'function') {
      result.then(resolve).catch(reject);
    } else {
      if (error) { reject();  }
      else       { resolve(); }
    }
  }));
}

/**
 * Rename a function (with mutation).
 * @param name New name of the function.
 * @param fn Function to rename.
 * @returns Function passed in as the second argument (NOT a wrapper).
 */
export function name<T extends Function>(name: string, fn: T): T {
  Object.defineProperty(fn, "name", { value: name });
  return fn;
}
