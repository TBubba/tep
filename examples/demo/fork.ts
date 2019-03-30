/**
 * This file is the entry point for the task fork processes used in this example.
 */
import * as tep from '../../src';
import * as tasks from './tasks';

// Create a task register with all exported tasks from the tasks file
// (Note: all non-task properties will be ignored)
const taskRegister = tep.TaskRegister.fromMap(tasks);

// Create a task fork process and initialize it
const fork = new tep.TaskForkProcess(taskRegister);
fork.init();
