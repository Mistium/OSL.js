import { compiler } from "./modules/compiler.mjs";

let test = new compiler({
    output: 'function', code: `
    goober`
});

test({ hi: "Hello, World!" });