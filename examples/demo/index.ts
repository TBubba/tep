/**
 * This file is the entry point for the main process.
 */
import * as tep from '../../src';
import { wait, hardWork } from './tasks';
import * as tasks from './tasks';

demo();

async function demo() {
  // Execute an async task
  await tep.exec(() => wait(1500));

  // Wrap a synchronous function in a task, then execute it
  await tep.exec(tep.task(hardWork));

  // Execute multiple "blocking" tasks in a process each
  // (Unfortunately this is the easiest way I know of locating the entry file)
  const forkPath = './dist-examples/examples/demo/fork.js';
  await tep.exec(tep.parallel([
    tep.serial([ tep.fork(forkPath, tasks.hardWork.name), tep.task(() => console.log('---- Process 1 Complete! ----')) ]),
    tep.serial([ tep.fork(forkPath, tasks.hardWork.name), tep.task(() => console.log('---- Process 2 Complete! ----')) ]),
    tep.serial([ tep.fork(forkPath, tasks.hardWork.name), tep.task(() => console.log('---- Process 3 Complete! ----')) ]),
    tep.serial([ tep.fork(forkPath, tasks.hardWork.name), tep.task(() => console.log('---- Process 4 Complete! ----')) ]),
  ]));
}
