function getOSLType(val) { if (val === null || val === undefined) return null; else if (Array.isArray(val)) return "array"; return typeof val }
    Object.clone=function(e){try{if(null===e)return null;if("object"==typeof e){if(Array.isArray(e))return e.map((e=>Object.clone(e)));if(e instanceof RegExp)return new RegExp(e);{let n={};for(let r in e)e.hasOwnProperty(r)&&(n[r]=Object.clone(e[r]));return n}}return e}catch{return JSON.parse(JSON.stringify(e))}};
    Object.merge=function(t,r){if(o === null||r===null)return null;function o(t){return t&&"object"==typeof t&&!Array.isArray(t)}const e={};for(const r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);const c=[{target:e,source:r}];for(;c.length;){const{target:t,source:r}=c.pop();for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e)){const n=r[e];o(n)?(o(t[e])||(t[e]={}),c.push({target:t[e],source:n})):t[e]=n}}return e};
    Number.isPrime = function(n) { if (n <= 1) return false; if (n <= 3) return true; if (n % 2 === 0 || n % 3 === 0) return false; for (let i = 5; i * i <= n; i += 6) { if (n % i === 0 || n % (i + 2) === 0) return false; } return true; };
    function osl_maths(left, operator, right) {
      const tleft = typeof left
      const tright = typeof right
      if (tleft === "number" && tright === "number") { switch(operator) { case "+": return left + right; case "-": return left - right; case "*": return left * right; case "/": return left / right; case "%": return left % right; case "^": return left ** right; case "++": return `${left}${right}`; } }
      else if (tleft === "string" || tright === "string") { switch(operator) { case "+": return `${left} ${right}`; case "-": return String(left).replaceAll(String(right), ""); case "++": return `${left}${right}`; } }
      switch(operator) {
        case '+': return (+left || 0) + (+right || 0);
        case '-': return (+left || 0) - (+right || 0);
        case '*': return (+left || 0) * (+right || 0);
        case '/': return (+left || 0) / (+right || 0);
        case '%': return (+left || 0) % (+right || 0);
        case '++': if (tleft === "object" && tright === "object") { if (Array.isArray(left) && Array.isArray(right)) return left.concat(right); else return Object.merge(left,right); } return `${left}${right}`;
        case '??': return left ?? right;
        case 'to': return Array.from({ length: Math.abs(right - left) + 1 }, (_, i) => (left < right ? left + i : left - i))
        default: throw new Error('Unknown math operator: ' + operator);
      }
    }
    function setVar(name, value) { name = `${name}`; if (inner[name] !== undefined) inner[name] = value; else scope[name.toLowerCase()] = value; }
    function getVar(name) { name = `${name}`; if (inner[name] !== undefined) return inner[name]; return scope[name.toLowerCase()]; }
    const scope = {};
    let inner = scope;
{const n="message"; let ctx = Object.hasOwn(inner, n) ? inner : scope; ctx[n] = Object.clone("Hello from OSL!")};
console.log(getVar("message"));
{const n="numbers"; let ctx = Object.hasOwn(inner, n) ? inner : scope; ctx[n] = Object.clone([3, 1, 4, 1, 5, 9, 2, 6])};
console.log("Original numbers:");
console.log(getVar("numbers"));
{const n="numbers"; let ctx = Object.hasOwn(inner, n) ? inner : scope; { const val = getVar("numbers").slice().sort(); if ((val ?? "") !== "") { ctx[n] = (typeof val === "object" && val !== null) ? Object.clone(val) : val; } }};
console.log("Sorted numbers:");
console.log(getVar("numbers"));
{const n="text"; let ctx = Object.hasOwn(inner, n) ? inner : scope; ctx[n] = Object.clone("Hello World")};
console.log("Original text:");
console.log(getVar("text"));
{const n="reversed"; let ctx = Object.hasOwn(inner, n) ? inner : scope; ctx[n] = Object.clone((Array.isArray(getVar("text")) ? getVar("text").slice().reverse() : String(getVar("text")).split("").reverse().join("")))};
console.log("Reversed text:");
console.log(getVar("reversed"));
{const n="x"; let ctx = Object.hasOwn(inner, n) ? inner : scope; ctx[n] = Object.clone(42)};
console.log(osl_maths(osl_maths(osl_maths("Square root of ", "++", getVar("x")), "++", " is "), "++", Math.sqrt((+getVar("x") || 0))));
