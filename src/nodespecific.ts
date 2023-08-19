import { Buffer } from "buffer";
import Process from "process";

window.global = globalThis;
globalThis.process = Process;
globalThis.Buffer = Buffer;
