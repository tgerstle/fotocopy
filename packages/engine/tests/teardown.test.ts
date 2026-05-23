import { describe, test, expect, vi } from "vitest";
import { TeardownManager } from "../src/teardown";

describe("TeardownManager", () => {
  test("synchronously dispatches cleanup tasks on SIGINT", async () => {
    let dummyDisposed = false;
    const dummyTask = async () => {
      dummyDisposed = true;
    };

    TeardownManager.registerTask(dummyTask);

    // Mock process.exit so we don't kill the test runner
    const exitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((() => {}) as any);

    // Instead of process.emit('SIGINT'), TeardownManager registers a listener on construction.
    // We can call the execute method by accessing it dynamically since it's private.
    await (TeardownManager as any).execute("SIGINT");

    expect(dummyDisposed).toBe(true);
    expect(exitSpy).toHaveBeenCalledWith(130);

    exitSpy.mockRestore();
  });
});
