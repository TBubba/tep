import { Task, TaskExecutorSettings, TaskExecutorDoneEvent, TaskExecutorEndEvent, TaskExecutorErrorEvent } from './interfaces';
import { EventEmitter } from 'events';
import { timeToString, toAsync } from './util';

export interface TaskExecutor {
  /** Fires when a task resolves. */
  on(event: 'done',  listener: (event: TaskExecutorDoneEvent)  => void): this;
  /** Fires when a task rejects. */
  on(event: 'error', listener: (event: TaskExecutorErrorEvent) => void): this;
  /** Fires when the task queue is empty and the last currently executed task finishes executing. */
  on(event: 'end',   listener: (event: TaskExecutorEndEvent)   => void): this;
}

/** Executes tasks. */
export class TaskExecutor extends EventEmitter {
  /** Queue of tasks to execute (first in first out). */
  private _queue: Task[] = [];
  /** Settings used by this executer. */
  private _settings: TaskExecutorSettings = createDefaultSettings();
  /** Number of currently executing tasks. */
  private _curExecCount: number = 0;

  constructor(settings?: Partial<TaskExecutorSettings>) {
    super();
    if (settings) { Object.assign(this._settings, settings); } // @TODO: Make a deep-replace instead of assign
  }

  /** Number of currently executing tasks. */
  runningTasks(): number {
    return this._curExecCount;
  }

  /**
   * Add one or more tasks to the end of the queue.
   * @param tasks Task or tasks to add to the end of the queue.
   */
  push(tasks: Task | Task[]): this {
    if (Array.isArray(tasks)) { Array.prototype.push.apply(this._queue, tasks); }
    else                      { this._queue.push(tasks);                        }
    return this;
  }
  
  /** Start executing tasks from the queue. */
  start(): this {
    this.executeNextTask();
    return this;
  }

  /** Try starting execution of the next task. */
  private executeNextTask() {
    // Check if this can execute another task at this time
    if (this._curExecCount < this._settings.tasksAtOnce ||
        this._settings.tasksAtOnce === -1) {
      // Try executing the next task in the queue
      const task = this._queue.shift();
      if (task) { // (Task found)
        this._curExecCount += 1;
        const onFinish = <T = any>(cb: (value: T) => void) => {
          return (value: any) => {
            time = Date.now() - time;
            this._curExecCount -= 1;
            cb(value);
            if (this._queue.length === 0 && this._curExecCount === 0) { this.emit('end', {}); }
            this.executeNextTask();
          };
        }
        // Execute the next task
        this.log(`Start "${getName(task)}"`);
        let time = Date.now();
        toAsync(task)()
        .then(onFinish(value => {
          this.log(`Done  "${getName(task)}" (in ${timeToString(time)})`);
          this.emit('done', { time });
        }))
        .catch(onFinish(error => {
          this.log(`Error "${getName(task)}" (in ${timeToString(time)})`);
          this.emit('error', { time, error });
        }));
        // Try starting execution of another task
        this.executeNextTask();
      } else if (this._curExecCount === 0) { // (No tasks left)
        this.emit('end', {});
      }
    }
  }
  
  private log(...args: any[]): void {
    if (!this._settings.silent) { console.log(...args); }
  }
}

function createDefaultSettings(): TaskExecutorSettings {
  return {
    tasksAtOnce: 1, // (serial)
    silent: false,
  };
}

function getName(fn: Function): string {
  return fn.name || '<anonymous>';
}
