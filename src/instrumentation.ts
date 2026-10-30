// Next compiles this file for both the Node and Edge runtimes. Everything Node-specific lives in
// instrumentation-node.ts and is only imported inside the nodejs branch (Next's documented pattern).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation-node");
    await registerNode();
  }
}
