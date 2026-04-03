import { render } from "ink";
import { App } from "./App.js";

const instance = render(<App />);

await instance.waitUntilExit();
instance.clear();
