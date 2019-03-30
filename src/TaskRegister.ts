import { Task } from './interfaces';

type Map = { [key: string]: Task };

export class TaskRegister {
  private _map: Map = {};
  
  get(name: string): Task | undefined {
    return this._map[name];
  }

  register(name: string, task: Task): void {
    this._map[name] = task;
  }

  unregister(name: string): void {
    delete this._map[name];
  }

  /**
   * Create a task register and try to register all properties of an object to it,
   * using the keys as labels and the value as tasks (the values are wrapped in tasks).
   * Note: All non-function values will be ignored and NOT registered.
   * @param map Map of labels and functions.
   * @returns The task register.
   */
  public static fromMap(map: { [key: string]: any }): TaskRegister {
    const register = new TaskRegister();
    for (let key in map) {
      const value = map[key];
      if (typeof value === 'function') { register._map[key] = value; }
    }
    return register;
  }
}
