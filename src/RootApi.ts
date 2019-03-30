import { TaskExecutorSettings, Task } from './interfaces';
import { TaskFork } from './TaskFork';
import { TaskExecutor } from './TaskExecutor';
import { toAsync, name } from './util';

// Exports from other files
export { name } from './util';

type AnyFunction = (...args: any[]) => any;
type PartialSettings = Partial<TaskExecutorSettings>;

/**
 * Execute one or more tasks.
 * When executing multiple tasks, this acts like a "serial" by default.
 * @param tasks Task(s) to execute.
 * @param settings Settings to execute with.
 * @returns A promise that resolves when the last task is done executing, and rejects if any task rejects or throws an error.
 */
export function exec(tasks: Task | Task[], settings?: PartialSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    new TaskExecutor(settings)
    .on('end',   () => { resolve();       })
    .on('error', e  => { reject(e.error); })
    .push(tasks)
    .start();
  });
}

/**
 * Compose a meta task.
 * When executed, it executes the tasks one at a time.
 * It's promise resolves once all tasks are done executing.
 * @param name Name of the meta task.
 * @param tasks Tasks to execute.
 * @param settings Settings to execute with.
 * @returns The composed meta task.
 */
export function serial(name: string | Task[], tasks: Task[] | PartialSettings, settings?: PartialSettings): Task;
/**
 * Compose a meta task.
 * When executed, it executes the tasks one at a time.
 * It's promise resolves once all tasks are done executing.
 * @param tasks Tasks to execute.
 * @param settings Settings to execute with.
 * @returns The composed meta task.
 */
export function serial(tasks: Task[], settings?: PartialSettings): Task;
export function serial(nameOrTasks: string | Task[], tasksOrSettings?: Task[] | PartialSettings, settings?: PartialSettings): Task {
  // Validate types
  if (typeof nameOrTasks === 'string' && Array.isArray(tasksOrSettings)) { // (name, tasks, settings?)
    // Do nothing. All arguments already have the correct type.
  } else if (Array.isArray(nameOrTasks) && !Array.isArray(tasksOrSettings)) { // (tasks, settings?)
    settings = tasksOrSettings;
    tasksOrSettings = nameOrTasks;
    nameOrTasks = '[serial]';
    const a = tasksOrSettings;
  } else { throw new Error('One or more argument has an invalid type.'); }
  // ...
  settings = Object.assign({}, settings);
  settings.tasksAtOnce = 1;
  return name(nameOrTasks, () => exec(tasksOrSettings as Task[], settings));
}

/**
 * Compose a meta task.
 * When executed, it executes the tasks all at the same time.
 * It's promise resolves once all tasks are done executing.
 * @param name Name of the meta task.
 * @param tasks Tasks to execute.
 * @param settings Settings to execute with.
 * @returns The composed meta task.
 */
export function parallel(name: string, tasks: Task[], settings?: PartialSettings): Task;
  /**
   * Compose a meta task.
   * When executed, it executes the tasks all at the same time.
   * It's promise resolves once all tasks are done executing.
   * @param tasks Tasks to execute.
   * @param settings Settings to execute with.
   * @returns The composed meta task.
   */
export function parallel(tasks: Task[], settings?: PartialSettings): Task;
export function parallel(nameOrTasks: string | Task[], tasksOrSettings?: Task[] | PartialSettings, settings?: PartialSettings): Task {
  // Validate types
  if (typeof nameOrTasks === 'string' && Array.isArray(tasksOrSettings)) { // (name, tasks, settings?)
    // Do nothing. All arguments already have the correct type.
  } else if (Array.isArray(nameOrTasks) && !Array.isArray(tasksOrSettings)) { // (tasks, settings?)
    settings = tasksOrSettings;
    tasksOrSettings = nameOrTasks;
    nameOrTasks = '[parallel]';
    const a = tasksOrSettings;
  } else { throw new Error('One or more argument has an invalid type.'); }
  // ...
  settings = Object.assign({}, settings);
  settings.tasksAtOnce = -1;
  return name(nameOrTasks, () => exec(tasksOrSettings as Task[], settings));
}

/**
 * Compose a meta task.
 * When executed, it starts a new Node.js child process with "entry" as the entry file,
 * then instructs it to execute the task(s) with the provided task label(s).
 * It's promise resolves once all tasks are done executing.
 * The process is killed once the execution ends.
 * @param entry Path to the entry file for the task fork process.
 * @param tasks Label(s) of the tasks to execute.
 * @returns The composed meta task.
 */
export function fork(entry: string, tasks: string | string[]): Task {
  return name('[fork]', () => new Promise((resolve, reject) => {
    const fork = new TaskFork().proc(entry);
    fork.on('end', (...args: any[]) => {
      fork.kill();
      resolve();
    });
    fork.on('error', e => {
      fork.kill();
      reject(e.error);
    });
    fork.push(tasks);
    fork.start();
  }));
}

/**
 * Crease a task.
 * @param fn Function the task will execute.
 */
export function task(fn: AnyFunction): Task;
/**
 * Crease a task.
 * @param name Name of the task.
 * @param fn Function the task will execute.
 */
export function task(name: string, fn: AnyFunction): Task;
export function task(nameOrFn: string | AnyFunction, fn?: AnyFunction): Task {
  if (typeof nameOrFn === 'function') {
    return toAsync(nameOrFn);
  } else if (typeof nameOrFn === 'string' && typeof fn === 'function') {
    return name(nameOrFn, toAsync(fn));
  } else { throw new TypeError(`Incorrect combination of argument types.`); }
}
