import { describe, it, expect, beforeEach } from "vitest";
import {
  getTask,
  cancelTask,
  listTasks,
  TaskNotFoundError,
  InvalidStateError,
} from "../../a2a/task-manager.js";

describe("TaskNotFoundError", () => {
  it("should have correct properties", () => {
    const err = new TaskNotFoundError("task-1");
    expect(err.taskId).toBe("task-1");
    expect(err.message).toBe("Task not found: task-1");
    expect(err.name).toBe("TaskNotFoundError");
    expect(err instanceof Error).toBe(true);
  });
});

describe("InvalidStateError", () => {
  it("should have correct properties", () => {
    const err = new InvalidStateError("task-1", "completed", "input-required");
    expect(err.taskId).toBe("task-1");
    expect(err.currentState).toBe("completed");
    expect(err.expectedState).toBe("input-required");
    expect(err.message).toContain("completed");
    expect(err.message).toContain("input-required");
    expect(err.name).toBe("InvalidStateError");
  });
});

describe("getTask", () => {
  it("should return undefined for non-existent task", () => {
    expect(getTask("nonexistent-task-id")).toBeUndefined();
  });
});

describe("cancelTask", () => {
  it("should throw TaskNotFoundError for non-existent task", () => {
    expect(() => cancelTask("nonexistent-task-id")).toThrow(TaskNotFoundError);
  });
});

describe("listTasks", () => {
  it("should return an array", () => {
    const tasks = listTasks();
    expect(Array.isArray(tasks)).toBe(true);
  });

  it("should filter by state", () => {
    const tasks = listTasks("completed");
    expect(Array.isArray(tasks)).toBe(true);
    for (const task of tasks) {
      expect(task.status.state).toBe("completed");
    }
  });
});
