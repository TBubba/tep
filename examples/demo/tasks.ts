/**
 * This file is where all the tasks are defined.
 */

/**
 * A function that takes some lot of time to execute.
 * Used to simulate a useful synchronous function.
 */
export function hardWork(): void {
  for (let i = 0; i < 1000000000; i++) {
    Math.sqrt(123.456);
  }
}

/**
 * Wait for some time.
 * Used to simulate a useful asynchronous function.
 * @param time Time to wait (in milliseconds).
 */
export function wait(time: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, time));
}
