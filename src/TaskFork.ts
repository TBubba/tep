import { fork, ChildProcess } from 'child_process';
import { TaskForkInMessage, TaskForkOutMessage, TaskForkInAcknowledgeMessage } from './interfaces';
import { EventEmitter } from 'events';

export interface TaskFork {
  on(event: 'done', listener: () => void): Promise<void>;
  on(event: 'end', listener: () => void): Promise<void>;
  on(event: 'done', listener: () => void): Promise<void>;
}

export class TaskFork {
  private _proc: ChildProcess | undefined;
  private _nextId: number = 0;
  private _emitter: EventEmitter = new EventEmitter();

  /**
   * Set the child process this is connected to.
   * If this is already connected to a process that process will be killed first.
   * @param procOrPath Child process to connect this to or the path to a file to "fork" a process from.
   */
  proc(procOrPath: ChildProcess | string): this {
    if (this._proc) { this.kill(); }
    const proc = this._proc = (typeof procOrPath === 'string') ? fork(procOrPath) : procOrPath;
    proc.on('message', this.onMessage.bind(this));
    return this;
  }
  
  /**
   * Add tasks at the end of the queue.
   * @param taskNames Name of task(s) to add.
   * @returns A promise that resolves once the action is completed.
   */
  push(taskNames: string | string[]): Promise<TaskForkInAcknowledgeMessage['payload']> {
    return new Promise((resolve, reject) => {
      const proc = this.getProc();
      const msgId = this.nextId();
      proc.on('message', function onMsg(msg: TaskForkInMessage) {
        if (msg.type === 'acknowledge' && msg.payload.ackId === msgId) {
          proc.off('message', onMsg);
          resolve(msg.payload);
        }
      });
      this.send({
        type: 'push',
        payload: { taskNames: taskNames },
        id: msgId,
      });
    });
  }
  
  /**
   * Start executing tasks.
   * @returns A promise that resolves once the action is completed.
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = this.getProc();
      const msgId = this.nextId();
      waitForAcknowledge(proc, msgId, msg => resolve());
      this.send({
        type: 'start',
        payload: {},
        id: msgId,
      });
    });
  }
  
  /**
   * Subscribe an event listener to an event.
   * @param event Event to subscribe to.
   * @param listener Event listener to subscribe.
   * @returns A promise that resolves once the action is completed.
   */
  on(event: string, listener: (...args: any[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = this.getProc();
      const msgId = this.nextId();
      this._emitter.on(event, listener);
      waitForAcknowledge(proc, msgId, msg => resolve());
      if (this._emitter.listeners(event).length === 1) { // (First listener of this event)
        this.send({
          type: 'register',
          payload: { event },
          id: msgId,
        });
      }
    });
  }

  /**
   * Unsubscribe an event listener from an event.
   * @param event Event to unsubscribe from.
   * @param listener Event listener to unsubscribe.
   * @returns A promise that resolves once the action is completed.
   */
  off(event: string, listener: (...args: any[]) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = this.getProc();
      const msgId = this.nextId();
      this._emitter.off(event, listener);
      waitForAcknowledge(proc, msgId, msg => resolve());
      if (this._emitter.listeners(event).length === 0) { // (Last listener of this event)
        this.send({
          type: 'unregister',
          payload: { event },
          id: msgId,
        });        
      }
    });
  }

  /**
   * Kill this fork's process (or do nothing if the process is already killed).
   * This also removes all event listeners.
   * @returns If the process was killed (if false, it is already dead).
   */
  kill(): boolean {
    if (this._proc) {
      this._proc.kill();
      this._proc = undefined;
      this._emitter.removeAllListeners();
      return true;
    }
    return false;
  }

  private onMessage(msg: TaskForkInMessage): void {
    // console.log('> TF ', JSON.stringify(msg)); // Log message
    switch (msg.type) {
      case 'event':
        this._emitter.emit(msg.payload.event, msg.payload.data);
        break;
    }
  }

  private getProc(): ChildProcess {
    if (!this._proc) { throw new Error('TaskFork is not connected to a child process.'); }
    return this._proc;
  }

  private send(msg: TaskForkOutMessage): void {
    if (this._proc) { this._proc.send(msg); }
  }

  /** Get the next message ID and increment it (to prepare for the next message). */
  private nextId(): number {
    return this._nextId++;
  }
}

/** Call the callback once an acknowledge message is sent with the given ack. id. */
function waitForAcknowledge(proc: ChildProcess, msgId: number, cb: (msg: TaskForkInAcknowledgeMessage) => void) {
  proc.on('message', function onMsg(msg: TaskForkInMessage) {
    if (msg.type === 'acknowledge' && msg.payload.ackId === msgId) {
      proc.off('message', onMsg);
      cb(msg);
    }
  });
}
