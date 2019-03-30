export type Task = () => Promise<any>;

export type TaskExecResult = {
  /** Time it took to execute the task (in milliseconds). */
  time: number;
};

export type TaskExecutorSettings = {
  /** Number of tasks that can be executed at once (1 for serial, -1 for unlimited). */
  tasksAtOnce: number;
  /** If log messages should be emitted. */
  silent: boolean;
};

export type TaskExecutorEvent = (
  TaskExecutorDoneEvent |
  TaskExecutorErrorEvent |
  TaskExecutorEndEvent
);

export type TaskExecutorDoneEvent = {
  time: number;
}

export type TaskExecutorErrorEvent = {
  time: number;
  error: any;
}

export type TaskExecutorEndEvent = {

}

// ---------- Messages ---------- //

type MsgBase = {
  /** ID of the message. IDs are unique per communication direction (in & out). */
  id: number;
};

/** Message sent from a TaskFork Process to its parent process. */
export type TaskForkInMessage = (
  TaskForkInDoneMessage |
  TaskForkInAcknowledgeMessage |
  TaskForkInEventMessage
);

export type TaskForkInDoneMessage = MsgBase & {
  type: 'done';
  payload: {
    taskName: string;
    msgId: number;
    success: boolean;
    error?: any;
  };
};

export type TaskForkInAcknowledgeMessage = MsgBase & {
  type: 'acknowledge';
  payload: {
    /** ID of the message this is an acknowledgement of. */
    ackId: number;
  };
};

export type TaskForkInEventMessage = MsgBase & {
  type: 'event';
  payload: ({
    event: 'done';
    data: TaskExecutorDoneEvent;
  } | {
    event: 'error';
    data: TaskExecutorErrorEvent;
  } | {
    event: 'end';
    data: TaskExecutorEndEvent;
  });
};

/** Message sent from a process to a child TaskFork Process. */
export type TaskForkOutMessage = (
  TaskForkOutUselessMessage |
  TaskForkOutPushMessage |
  TaskForkOutStartMessage |
  TaskForkOutRegisterMessage |
  TaskForkOutUnregisterMessage
);

type TaskForkOutUselessMessage = MsgBase & {
  type: '';
  payload: null;
};

export type TaskForkOutPushMessage = MsgBase & {
  type: 'push';
  payload: {
    taskNames: string | string[];
  };
};

export type TaskForkOutStartMessage = MsgBase & {
  type: 'start';
  payload: {};
};

export type TaskForkOutRegisterMessage = MsgBase & {
  type: 'register';
  payload: {
    /** Event to register. */
    event: string;
  };
};

export type TaskForkOutUnregisterMessage = MsgBase & {
  type: 'unregister';
  payload: {
    /** Event to unregister. */
    event: string;
  };
};
