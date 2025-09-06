import { OSLUtils } from '../external/ASTgen.js';
const utils = new OSLUtils();

class compiler {
  constructor(options) {
    if (!options.code) throw new Error('Missing code for OSL compiler')
    this.ast = utils.generateFullAST({CODE: options.code});
    this.setupMethods()
    return this.compile(options)
  }

  setupMethods() {
    this.prepend = `function getOSLType(val) { if (val === null || val === undefined) return null; else if (Array.isArray(val)) return "array"; return typeof val }
    Object.clone=function(e){try{if(null===e)return null;if("object"==typeof e){if(Array.isArray(e))return e.map((e=>Object.clone(e)));if(e instanceof RegExp)return new RegExp(e);{let n={};for(let r in e)e.hasOwnProperty(r)&&(n[r]=Object.clone(e[r]));return n}}return e}catch{return JSON.parse(JSON.stringify(e))}};
    Object.merge=function(t,r){if(o === null||r===null)return null;function o(t){return t&&"object"==typeof t&&!Array.isArray(t)}const e={};for(const r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);const c=[{target:e,source:r}];for(;c.length;){const{target:t,source:r}=c.pop();for(const e in r)if(Object.prototype.hasOwnProperty.call(r,e)){const n=r[e];o(n)?(o(t[e])||(t[e]={}),c.push({target:t[e],source:n})):t[e]=n}}return e};
    Number.isPrime = function(n) { if (n <= 1) return false; if (n <= 3) return true; if (n % 2 === 0 || n % 3 === 0) return false; for (let i = 5; i * i <= n; i += 6) { if (n % i === 0 || n % (i + 2) === 0) return false; } return true; };
    function osl_maths(left, operator, right) {
      const tleft = typeof left
      const tright = typeof right
      if (tleft === "number" && tright === "number") { switch(operator) { case "+": return left + right; case "-": return left - right; case "*": return left * right; case "/": return left / right; case "%": return left % right; case "^": return left ** right; case "++": return \`\${left}\${right}\`; } }
      else if (tleft === "string" || tright === "string") { switch(operator) { case "+": return \`\${left} \${right}\`; case "-": return String(left).replaceAll(String(right), ""); case "++": return \`\${left}\${right}\`; } }
      switch(operator) {
        case '+': return (+left || 0) + (+right || 0);
        case '-': return (+left || 0) - (+right || 0);
        case '*': return (+left || 0) * (+right || 0);
        case '/': return (+left || 0) / (+right || 0);
        case '%': return (+left || 0) % (+right || 0);
        case '++': if (tleft === "object" && tright === "object") { if (Array.isArray(left) && Array.isArray(right)) return left.concat(right); else return Object.merge(left,right); } return \`\${left}\${right}\`;
        case '??': return left ?? right;
        case 'to': return Array.from({ length: Math.abs(right - left) + 1 }, (_, i) => (left < right ? left + i : left - i))
        default: throw new Error('Unknown math operator: ' + operator);
      }
    }
    function setVar(name, value) { name = \`\${name}\`; if (inner[name] !== undefined) inner[name] = value; else scope[name.toLowerCase()] = value; }
    function getVar(name) { name = \`\${name}\`; if (inner[name] !== undefined) return inner[name]; return scope[name.toLowerCase()]; }
    const scope = {};
    let inner = scope;\n`;
  }

  compile(options) {
    const ast = this.ast;
    let out = ``;
    for (let i = 0; i < ast.length; i++) {
      out += this.compileLine(ast[i]);
    }
    out = `${this.prepend}${out}`;
    this.out = out;
    this.fn = new Function('DATA', out);
    switch (options.output) {
      case 'none': return null;
      case 'string': return out;
      case 'function': return this.fn;
      default: throw new Error(`Unknown output option: ${options.output}`)
    }
  }

  compileLine(line) {
    if (!line || line.length === 0) return '';  // Handle empty lines
    let val = [];
    for (let i = 0; i < line.length; i++) val[i] = this.compileNode(line[i]);
    if (!val[0]) return '';  // Handle undefined first element
    if (typeof val[0] === 'string') return `${val[0]};\n`;
    switch (val[0].type) {
      case 'cmd': return `${this.compileCMD(val[0], val.slice(1))};\n`;
      default: throw new Error(`Unknown line starter type: ${val[0].type}`);
    }
  }

  compileNode(node) {
    const dat = node.data
    switch (node.type) {
      case 'cmd': return node;
      case 'asi': return this.compileASI(node);
      case 'fnc': return this.compileFNC(node);
      case 'mtd': return this.compileMTD(node);
      case 'mtv': return this.compileMTV(node);
      case 'opr': return this.compileOPR(node);
      case 'cmp': return this.compileCMP(node);
      case 'log': return this.compileLOG(node);
      case 'obj': return this.compileOBJ(node);
      case 'arr': return this.compileARR(node);
      case 'evl': return this.compileNode(node.data);
      case 'num': return +node.data;
      case 'var': return this.compileVAR(node);
      case 'str': return JSON.stringify(dat);
      case 'rmt': return this.compileRMT(node);
      case 'unk': return node.data;;
      case 'blk': {
        const lines = [];
        for (let i = 0; i < dat.length; i++) {
          const compiled = this.compileLine(dat[i]);
          lines.push(compiled);
        }
        return `\n${lines.join('')}`;
      }
      default: {
        throw new Error(`Unknown node type: ${node.type}`);
      }
    }
  }

  compileCMD(node, params) {
    // compiles CMD nodes
    switch (node.data) {
      case 'log': return `console.log(${params.join(',')})`;
      case 'if': {
        if (params.length < 2) throw new Error("If command requires at least 2 parameters");
        let out = `if (${params[0]}) {${params[1]}}`;
        let i = 2;
        while (i < params.length) {
          // Check if the next element is "else" by examining the compiled getVar("else")
          if (i + 1 < params.length && 
              params[i] === 'getVar("else")' && 
              params[i + 1] === 'getVar("if")' && 
              i + 3 < params.length) {
            // else if case
            out += ` else if (${params[i + 2]}) {${params[i + 3]}}`;
            i += 4;
          } else if (i + 1 < params.length && params[i] === 'getVar("else")') {
            // else case
            out += ` else {${params[i + 1]}}`;
            i += 2;
            break;
          } else {
            break;
          }
        }
        return out;
      }
      case 'loop': return `for (let _ = 0; _ < (${params[0]}); _++) {${params[1]}}`;
      case 'return': return `{const ret = ${params[0]}; inner = scope; return ret}`;
      case 'while': return `while (${params[0]}) {${params[1]}}`;
      default: throw new Error(`Unknown CMD name: ${node.data}`);
    }
  }

  compileRMT(node) {
    node.left = node.objPath
    node.left.push(node.final)
    return this.compileMTD({
      type: 'mtd',
      data: node.left
    })
  }

  compileASI(node) {
    const value = !node?.right ? null : this.compileNode(node.right);
    let name;
    let out = ""
    const node_type = node.left.type
    if (node_type === "rmt" || node_type === "mtd") {
      let values = node.left.objPath
      let end = node.left.final
      if (end === undefined) { values = node.left.data.slice(); end = values.pop() }
      out += `{const ctx = ${this.compileNode(values.length === 1 ? values[0] : { type: "mtd", data: values })}; `
      if (end.type === 'mtv') {
        switch (end.data) {
          case 'item':
            name = this.compileNode(end.parameters[0]);
            break;
          default:
            throw new Error(`Cannot use "${end.data}" as a final assignment method`)
        }
      } else {
        name = JSON.stringify(end.data)
      }
      out += `const n=${name};`
      out += `if (Array.isArray(ctx[n])) { n |= 0; n -= 1; } `

    } else {
      name = `${node.left.data}`
      out += `{const n="${name}"; let ctx = Object.hasOwn(inner, n) ? inner : scope; `
    }
    switch (node.data) {
      case '=': out += `ctx[n] = Object.clone(${value})}`; break
      case '@=': out += `ctx[n] = ${value}}`; break
      case '++': out += `ctx[n] = (+ctx[n] || 0) + 1}`; break
      case '--': out += `ctx[n] = (+ctx[n] || 0) - 1}`; break
      case '=??': out += `{ const val = ${value}; if ((val ?? "") !== "") { ctx[n] = (typeof val === "object" && val !== null) ? Object.clone(val) : val; } }}`; break
      default: out += `ctx[n] = osl_maths(ctx[n], "${node.data.slice(0, -1)}", ${value})}`
    }
    return out
  }

  compileFNC(node) {
    const params = [];
    for (let i = 0; i < node.parameters.length; i++)
      params.push(this.compileNode(node.parameters[i]));

    switch (node.data) {
      case 'function': return `(function(${JSON.parse(params[0])}) {\ninner={};\n${params[1]}\ninner=scope})`;
      case 'getArgument': return `DATA[${params[0]}]`;
      default: return `getVar("${node.data}")(${params.join(',')})`;
    }
  }

  compileMTD(node) {
    const data = node.data
    let result = this.compileNode(data[0])  // Start with the base object
    
    for (let i = 1; i < data.length; i++) {
      const nodeData = data[i]
      
      if (nodeData.type === 'var' && nodeData.data === 'len') {
        // Special case: convert .len to .length
        result += '.length'
      } else if (nodeData.type === 'mtv') {
        // Handle method calls that transform the result
        const methodName = nodeData.data;
        const params = nodeData.parameters ? nodeData.parameters.map(p => this.compileNode(p)) : [];
        
        switch (methodName) {
          // Number methods
          case 'chr':
            result = `String.fromCharCode(${result})`;
            break;
          case 'round':
            result = `Math.round(${result})`;
            break;
          case 'asin':
            result = `((Math.asin((+${result} || 0)) * 180) / Math.PI)`;
            break;
          case 'acos':
            result = `((Math.acos((+${result} || 0)) * 180) / Math.PI)`;
            break;
          case 'atan':
            result = `((Math.atan((+${result} || 0)) * 180) / Math.PI)`;
            break;
          case 'sqrt':
            result = `Math.sqrt((+${result} || 0))`;
            break;
          case 'ceiling':
            result = `Math.ceil((+${result} || 0))`;
            break;
          case 'floor':
            result = `Math.floor((+${result} || 0))`;
            break;
          case 'log':
            result = `(Math.log((+${result} || 0)) / Math.LN10)`;
            break;
          case 'ln':
            result = `Math.log((+${result} || 0))`;
            break;
          case 'abs':
            result = `Math.abs((+${result} || 0))`;
            break;
          case 'invabs':
            result = `(0 - Math.abs((+${result} || 0)))`;
            break;
          case 'radSin':
            result = `Math.sin(${result})`;
            break;
          case 'radCos':
            result = `Math.cos(${result})`;
            break;
          case 'radTan':
            result = `Math.tan(${result})`;
            break;
          case 'sign':
            result = `(${result} < 0 ? "-" : "+")`;
            break;
          case 'isPrime':
            result = `Number.isPrime(${result})`;
            break;
          case 'newString':
            result = `" ".repeat(${result})`;
            break;
          case 'chance':
            result = `(Math.random() <= ${result} / 100)`;
            break;
          case 'padStart':
            if (params.length >= 2) {
              result = `String(${result}).padStart(${params[1]}, ${params[0]})`;
            } else if (params.length === 1) {
              result = `String(${result}).padStart(${params[0]})`;
            }
            break;
          case 'padEnd':
            if (params.length >= 2) {
              result = `String(${result}).padEnd(${params[1]}, ${params[0]})`;
            } else if (params.length === 1) {
              result = `String(${result}).padEnd(${params[0]})`;
            }
            break;
            
          // String methods
          case 'strip':
            if (params.length > 0) {
              result = `${result}.replace(new RegExp(\`^[\${${params[0]}}]+|[\${${params[0]}}]+$\`, 'g'), '')`;
            } else {
              result = `${result}.replace(/^\\s+|\\s+$/g, '')`;
            }
            break;
          case 'confirm':
            result = `confirm(${result})`;
            break;
          case 'ask':
            result = `prompt(${result})`;
            break;
          case 'left':
            if (params.length > 0) {
              result = `${result}.slice(0, (+${params[0]} || 1))`;
            } else {
              result = `${result}.slice(0, 1)`;
            }
            break;
          case 'right':
            if (params.length > 0) {
              result = `${result}.slice(-Math.max(1, +${params[0]} || 1))`;
            } else {
              result = `${result}.slice(-1)`;
            }
            break;
          case 'first':
            result = `${result}[0]`;
            break;
          case 'last':
            result = `${result}[${result}.length - 1]`;
            break;
          case 'atob':
            result = `atob(${result})`;
            break;
          case 'btoa':
            result = `btoa(${result})`;
            break;
          case 'ord':
            result = `${result}.charCodeAt(0)`;
            break;
          case 'split':
            if (params.length >= 2) {
              result = `${result}.split(${params[0]}, ${params[1]} ?? undefined)`;
            } else if (params.length === 1) {
              result = `${result}.split(${params[0]})`;
            } else {
              result = `${result}.split()`;
            }
            break;
          case 'replaceFirst':
            if (params.length >= 2) {
              result = `String(${result}).replace(${params[0]}, ${params[1]})`;
            }
            break;
          case 'toUpper':
            result = `${result}.toUpperCase()`;
            break;
          case 'toLower':
            result = `${result}.toLowerCase()`;
            break;
          case 'reverse':
            // For arrays: use slice().reverse(), for strings: split/reverse/join
            result = `(Array.isArray(${result}) ? ${result}.slice().reverse() : String(${result}).split("").reverse().join(""))`;
            break;
          case 'hashMD5':
            result = `md5(String(${result}))`;
            break;
          case 'hashSHA1':
            result = `(CryptoJS.SHA1(String(${result})) + "")`;
            break;
          case 'hashSHA256':
            result = `(CryptoJS.SHA256(String(${result})) + "")`;
            break;
          case 'hashSHA512':
            result = `(CryptoJS.SHA512(String(${result})) + "")`;
            break;
          case 'append':
            if (params.length > 0) {
              result = `\`\${${result}}\${${params[0]}}\``;
            }
            break;
          case 'prepend':
            if (params.length > 0) {
              result = `\`\${${params[0]}}\${${result}}\``;
            }
            break;
          case 'startsWith':
            if (params.length > 0) {
              result = `${result}.startsWith(${params[0]})`;
            }
            break;
          case 'endsWith':
            if (params.length > 0) {
              result = `${result}.endsWith(${params[0]})`;
            }
            break;
            
          // Array methods
          case 'fill':
            if (params.length > 0) {
              result = `${result}.fill(${params[0]})`;
            }
            break;
          case 'deDupe':
            result = `Array.from(new Set(${result}))`;
            break;
          case 'freezeLen':
            result = `Object.seal(${result})`;
            break;
          case 'clone':
            result = `Object.clone(${result})`;
            break;
          case 'sort':
            result = `${result}.slice().sort()`;
            break;
          case 'pop':
            result = `${result}.pop()`;
            break;
          case 'shift':
            result = `${result}.shift()`;
            break;
          case 'join':
            if (params.length > 0) {
              result = `${result}.join(${params[0]})`;
            } else {
              result = `${result}.join()`;
            }
            break;
            
          // Object methods
          case 'bind':
            if (params.length > 0) {
              result = `{ const obj = Object.clone(${result}); obj._self = ${params[0]}; return obj }`;
            }
            break;
          case 'isDef':
            result = `(${result}?._symbol === origin.symbols.function)`;
            break;
            
          case 'item':
            result += `[${this.compileNode(nodeData.parameters[0])}]`;
            break;
          default:
            const compiled = this.compileNode(nodeData)
            if (compiled.startsWith('?.')) {
              result += compiled
            } else if (compiled.startsWith('[')) {
              result += compiled  // Array access doesn't need a dot
            } else {
              result += '.' + compiled
            }
        }
      } else {
        const compiled = this.compileNode(nodeData)
        if (compiled.startsWith('?.')) {
          result += compiled
        } else if (compiled.startsWith('[')) {
          result += compiled  // Array access doesn't need a dot
        } else {
          result += '.' + compiled
        }
      }
    }
    return result;
  }

  compileMTV(node) {
    const data = node.data
    if (node.parameters) {
      switch (data) {
        case 'item':
          return `[${this.compileNode(node.parameters[0])}]`;
        case 'chr':
          return `String.fromCharCode(${node.parameters.map((param) => `${this.compileNode(param)}`).join(',')})`;
        case 'ask':
          return `prompt(${node.parameters.map((param) => `${this.compileNode(param)}`).join(',')})`;
        default:
          return `${data}(${node.parameters.map((param) => `${this.compileNode(param)}`).join(',')})`;
      }
    } else {
      switch (data) {
        case 'len':
          return 'length'
        case 'chr':
          return 'String.fromCharCode'
        case 'ask':
          return 'prompt'
        default:
          return `${data}`
      }
    }
  }

  compileVAR(node) {
    switch (node.data) {
      case 'timestamp': return `Date.now()`;
      case 'performance': return `performance.now()`;
      case 'this': return `inner`;
      default: return `getVar("${node.data}")`
    }
  }

  compileOPR(node) {
    const left = this.compileNode(node.left);
    const right = this.compileNode(node.right);
    return `osl_maths(${left}, "${node.data}", ${right})`
  }

  compileCMP(node) {
    const left = this.compileNode(node.left);
    const right = this.compileNode(node.right);
    switch (node.data) {
      case '==': return `String(${left} ?? "").toLowerCase() == String(${right} ?? "").toLowerCase()`;
      case '===': return `${left} === ${right}`;
      case '!=': return `String(${left} ?? "").toLowerCase() != String(${right} ?? "").toLowerCase()`;
      case '!==': return `${left} !== ${right}`;
      case '>': return `${left} > ${right}`;
      case '<': return `${left} < ${right}`;
      case '>=': return `${left} >= ${right}`;
      case '<=': return `${left} <= ${right}`;
      default: throw new Error(`Unknown CMP: ${node.data}`);
    }
  }

  compileLOG(node) {
    const left = this.compileNode(node.left);
    const right = this.compileNode(node.right);
    switch (node.data) {
      case 'and': return `(${left} && ${right})`;
      case 'or': return `(${left} || ${right})`;
      case 'nor': return `!(${left} || ${right})`;
      case 'nand': return `!(${left} && ${right})`;
      case 'xor': return `(${left} && !${right}) || (!${left} && ${right})`;
      case 'xand': return `(${left} || ${right}) && !(${left} && ${right})`;
      default: throw new Error(`Unknown LOG: ${node.data}`);
    }
  }

  compileOBJ(node) {
    if (Object.keys(node.data).length === 0) return '{}';
    const out = [];
    for (const key in node.data) {
      if (node.data.hasOwnProperty(key)) {
        out.push(`${JSON.stringify(key)}: ${this.compileNode(node.data[key])}`);
      }
    }
    return `{${out.join(', ')}}`;
  }

  compileARR(node) {
    const out = [];
    for (let i = 0; i < node.data.length; i++) {
      out.push(this.compileNode(node.data[i]));
    }
    return `[${out.join(', ')}]`;
  }
}

export { compiler }