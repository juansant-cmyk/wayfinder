const { spawn } = require("child_process");
const path = require("path");

const backendDir = path.resolve(__dirname, "../../backend");
const python = process.env.PYTHON || "python";
const port = process.env.API_PORT || "8000";

console.log("");
console.log("Starting Wayfinder API (FastAPI + uvicorn)...");
console.log(`  API JSON:  http://localhost:${port}/`);
console.log(`  API docs:  http://localhost:${port}/docs   <-- interactive webpage`);
console.log(`  Health:    http://localhost:${port}/health`);
console.log("");
console.log("This is the backend only — not the Expo app.");
console.log("For the Wayfinder UI, run in another terminal: npx expo start --port 8081");
console.log("");

const child = spawn(
  python,
  ["-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", port],
  {
    cwd: backendDir,
    stdio: "inherit",
    shell: false,
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
