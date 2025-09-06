import { compiler } from "./modules/compiler.mjs";

let arrayTest = new compiler({
    output: 'function', code: `
arr = [1, 2, 2, 3, 3, 3]
log "Original array with duplicates:"
log arr

arr.deDupe()
log "After deDupe():"
log arr

arr2 = [5, 1, 3, 2, 4]
log "Unsorted array:"
log arr2

arr2.sort()
log "After sort():"
log arr2

str = "hello"
log "Original string:"
log str

result = str.reverse()
log "String reversed:"
log result
`
});

arrayTest();
