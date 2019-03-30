import { TaskForkInMessage, TaskForkOutMessage, TaskForkOutPushMessage, Task, TaskExecutorDoneEvent, TaskExecutorErrorEvent, TaskExecutorEndEvent, TaskForkOutStartMessage, TaskForkOutRegisterMessage, TaskForkOutUnregisterMessage, TaskExecutorEvent } from './interfaces';
import { TaskExecutor } from './TaskExecutor';
import { TaskRegister } from './TaskRegister';
import { toAsync } from './util';

/** "Main class" for each TaskFork process. */
export class TaskForkProcess {
  /** If this is initialized. */
  private _isInit: boolean = false;
  /** ID of the next message. */
  private _nextId: number = 0;
  /** Executor of tasks. */
  private _executor: TaskExecutor = new TaskExecutor();
  /** Names of events that will be broadcasted to the parent process. */
  private _broadcastEvents: { [key: string]: boolean | undefined } = {};
  /** Register containing all tasks this can execute. */
  private _register: TaskRegister;

  constructor(register?: TaskRegister) {
    this._register = register || new TaskRegister();
    // Add event listeners
    this._executor.on('done',  this.onExecutorDone.bind(this));
    this._executor.on('error', this.onExecutorError.bind(this));
    this._executor.on('end',   this.onExecutorEnd.bind(this));
  }

  /**
   * Initialize this.
   * Start listening for messages from the parent process.
   */
  init(): this {
    if (!this._isInit) {
      this._isInit = true;
      process.on('message', this.onMessage.bind(this));
    }
    return this;
  }

  /** Message handler for messages from TaskFork. */
  private onMessage(msg: TaskForkOutMessage) {
    // console.log('> TFP', JSON.stringify(msg)); // Log message
    switch (msg.type) {
      case 'push':       this.onPushMsg(msg);       break;
      case 'start':      this.onStartMsg(msg);      break;
      case 'register':   this.onRegisterMsg(msg);   break;
      case 'unregister': this.onUnregisterMsg(msg); break;
      default:
        console.log(`TaskFork Process received a message of unknown type ("${msg.type}")`);
        break;
    }
  }
  
  private onPushMsg(msg: TaskForkOutPushMessage): void {
    // Get tasks from names
    const taskNames = msg.payload.taskNames;
    let tasks: Task | Task[];
    if (Array.isArray(taskNames)) {
      tasks = taskNames.map(name => this.wrapTask(this.getTask(name)));
    } else {
      tasks = this.wrapTask(this.getTask(taskNames));
    }
    // Push tasks
    this._executor.push(tasks);
    // Acknowledge
    this.acknowledge(msg);
  }

  private onStartMsg(msg: TaskForkOutStartMessage) {
    this._executor.start();
    this.acknowledge(msg);
  }

  private onRegisterMsg(msg: TaskForkOutRegisterMessage) {
    const event = msg.payload.event;
    if (!this._broadcastEvents[event]) { // (Not already registered)
      this._broadcastEvents[event] = true;
    }
    this.acknowledge(msg);
  }

  private onUnregisterMsg(msg: TaskForkOutUnregisterMessage) {
    const event = msg.payload.event;
    if (this._broadcastEvents[event]) {
      this._broadcastEvents[event] = false;
    }
    this.acknowledge(msg);
  }
  
  private onExecutorDone(event: TaskExecutorDoneEvent) {
    this.broadcast('done', event);
  }

  private onExecutorError(event: TaskExecutorErrorEvent) {
    this.broadcast('error', event);
  }

  private onExecutorEnd(event: TaskExecutorEndEvent) {
    this.broadcast('end', event);
  }

  /** Broadcast an event to the parent process. */
  private broadcast(event: string, data: TaskExecutorEvent): void {
    if (this._broadcastEvents[event]) {
      this.send({
        id: this.nextId(),
        type: 'event',
        payload: {
          event: event as any,
          data: data as any,
        }
      });
    }
  }
  
  /** Send a message to TaskFork. */
  private send(msg: TaskForkInMessage): void {
    if (!process.send) { throw new Error('"process.send" not found. Are you sure this is this running in a forked process?'); }
    process.send(msg);
  }

  /** Send an acknowledgement for a message. */
  private acknowledge(msg: TaskForkOutMessage): void {
    this.send({
      id: this.nextId(),
      type: 'acknowledge',
      payload: {
        ackId: msg.id,
      }
    });
  }

  /** Get the next message ID and increment it (to prepare for the next message). */
  private nextId(): number {
    return this._nextId++;
  }

  /** Wrap a task in another task that tracks it. */
  private wrapTask(task: Task): Task {
    return toAsync(task);
  }

  /** Get a task. */
  private getTask(taskName: string): Task {
    const task = this._register.get(taskName);
    if (!task) { throw new Error(`Failed to find task "${taskName}".`); }
    return task;
  }
}
