import { render } from "ink";
import { App } from "./App.js";

if (process.stdout.isTTY) {
  process.stdout.write("\x1b[?1049h");
}

const instance = render(<App />);

await instance.waitUntilExit();

if (process.stdout.isTTY) {
  process.stdout.write("\x1b[?1049l");
}
