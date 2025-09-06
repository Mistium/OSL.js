import { compiler } from "./modules/compiler.mjs";

console.log("Testing compiler output types...");

// Test string output
const stringResult = new compiler({
    output: 'string', 
    code: 'log "test"'
});

console.log('String result type:', typeof stringResult);
console.log('String result constructor:', stringResult.constructor.name);

// Test function output  
const functionResult = new compiler({
    output: 'function',
    code: 'log "test"'
});

console.log('Function result type:', typeof functionResult);
console.log('Function result constructor:', functionResult.constructor.name);
