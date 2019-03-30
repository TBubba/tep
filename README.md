# tep
A task managing library. 

**NOTE:** This is a hobby project, mainly written for my own use.

## Getting started

```
npm i tep
```

### Top Level API
The top level API has various functions for easy task managing.
```typescript
tep.exec(task, [settings]) // Execute a task

tep.serial([ task... ])  // Execute several tasks, one at a time
tep.parallel([ task... ]) // Execute several tasks, all at once
tep.fork(file, taskLabel) // Execute a task in a new process

tep.task(func) // Create a task that executes that function
tep.name(name, func) // Rename a function (or name an anonymous function)

tep.exec([
  gotoStore,
  purchaseGroceries,
  goHome,
  tep.parallel([
    tep.serial([ fillPot, boilWater, cookPasta, drain ]),
    makeTable,
  ]),
]));
```
You can also check out the ``examples`` folder for more code examples.

## Terminology
These are some terms that are regularly used throughout the library.
* __Task__:
  A function that expects no arguments and returns a promise.
* __Meta Task__:
  A task that is a composition of other tasks.
  It's promise usually resolves once all composed tasks have been executed.
* __Task Fork__:
  A process that is dedicated to executing tasks.
  Can transmit messages to/from it's parent process.

## API

### ``exec(task, [settings]) => Promise<void>``
Execute one or more tasks.

When executing multiple tasks, this acts like a "serial" by default.

### ``serial([name], tasks, [settings]) => Task``
Compose a meta task.

When the meta task is executed, it executes the tasks one at a time.

It's promise resolves once all tasks are done executing.

### ``parallel([name], tasks, [settings]) => Task``
Compose a meta task.

When the meta task is executed, it executes the tasks all at the same time.

It's promise resolves once all tasks are done executing.

### ``fork(entry, taskLabel) => Task``
Compose a meta task.

When the meta task is executed, it:
* Starts a new Node.js child process with ``entry`` as the entry file.
* Then instructs the process to execute the task(s) with the provided task label(s).

It's promise resolves once all tasks are done executing.

The process is killed once the execution ends.

### ``task([name], func) => Task``
Create a task that executes the provided function.

If the provided function already is a task, it will be wrapped in another task.

If a name is provided, the task will be given that name (otherwise it will be given the name of the function).

### ``name(name, func) => Function``
Rename a function.
