import { compiler } from "./modules/compiler.mjs";

let test = new compiler({
    output: 'function', code: `
input = 12
if input >= 18 (
  log "you are an adult"
) else if input >= 13 (
  log "you are a teenager" 
) else (
  log "you are a child" 
)

// the ast above is a representation of this script`
});

test()

// 'you are a child'