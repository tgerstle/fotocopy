type CleanupTask = () => Promise<void> | void;

class TeardownManagerSingleton {
  private tasks: CleanupTask[] = [];
  private abortControllers: AbortController[] = [];
  private hasRun = false;

  constructor() {
    process.on("SIGINT", () => this.execute("SIGINT"));
    process.on("SIGTERM", () => this.execute("SIGTERM"));
  }

  public registerTask(task: CleanupTask) {
    this.tasks.push(task);
  }

  public registerAbortController(controller: AbortController) {
    this.abortControllers.push(controller);
  }

  private async execute(signal: string) {
    if (this.hasRun) return;
    this.hasRun = true;
    console.log(
      `\n[TeardownManager] Received ${signal}. Executing teardown sequence...`,
    );

    // Abort all controllers (e.g. fetch requests)
    for (const ac of this.abortControllers) {
      try {
        ac.abort();
      } catch (e) {
        console.error("[TeardownManager] Error aborting controller:", e);
      }
    }

    // Execute cleanup tasks (e.g. closing browsers)
    for (const task of this.tasks) {
      try {
        await task();
      } catch (e) {
        console.error("[TeardownManager] Error executing teardown task:", e);
      }
    }

    console.log("[TeardownManager] Teardown complete. Exiting.");
    process.exit(130);
  }
}

export const TeardownManager = new TeardownManagerSingleton();
