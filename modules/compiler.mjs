import { ast } from "./ast.mjs"

class compiler {
  constructor(options) {
    if (!options.code) throw new Error('Missing code for OSL compiler')
    this.ast = new ast(options.code)
    return this.compile(options)
  }

  compile(options) {
    const ast = this.ast;
    let out = `Object.clone=function(e){try{if(null===e)return null;if("object"==typeof e){if(Array.isArray(e))return e.map((e=>Object.clone(e)));if(e instanceof RegExp)return new RegExp(e);{let n={};for(let r in e)e.hasOwnProperty(r)&&(n[r]=Object.clone(e[r]));return n}}return e}catch{return JSON.parse(JSON.stringify(e))}};\n`;
    for (let i = 0; i < ast.length; i++) {
      out += this.compileLine(ast[i]);
    }
    this.fn = new Function('', out);
    switch (options.output) {
      case 'none': return null;
      case 'string': return out;
      case 'function': return this.fn;
      default: throw new Error(`Unknown output option: ${options.output}`)
    }
  }

  compileLine(line) {
    let val = [];
    for (let i = 0; i < line.length; i++) {
      val[i] = this.compileNode(line[i]);
    }
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
      case 'opr': return this.compileOPR(node);
      case 'cmp': return this.compileCMP(node);
      case 'num': return +node.data;
      case 'var': return node.data;
      case 'str': return JSON.stringify(dat);
      case 'blk': {
        const lines = [];
        for (let i = 0; i < dat.length; i++)
          lines.push(this.compileLine(dat[i]));
        return `\n${lines.join('')}`;
      }
      default: throw new Error(`Unknown node type: ${node.type}`);
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
          if (params[i] === 'else' && params[i + 1] === 'if') {
            out += ` else if (${params[i + 2]}) {${params[i + 3]}}`;
            i += 4;
          } else if (params[i] === 'else') {
            out += ` else {${params[i + 1]}}`;
            break;
          } else break;
        }
        return out;
      }
      case 'loop': return `for (let _ = 0; _ < (${params[0]}); _++) {${params[1]}}`;
      case 'return': return `return ${params[0]}`;
      default: throw new Error(`Unknown CMD name: ${node.data}`);
    }
  }

  compileASI(node) {
    let left = '';
    if (node.left.type === 'mtd') {
      const mtd = node.left.data;
      if (mtd[0].type === 'var' && mtd[0].data === 'this') {
        left += 'var ';
        mtd.shift();
      }
    }
    left += this.compileNode(node.left);
    const right = this.compileNode(node.right);
    switch (node.data) {
      case '=': return `${left} = Object.clone(${right})`;
      case '@=': return `${left} = ${right}`;
    }
    return ''
  }

  compileFNC(node) {
    const params = [];
    for (let i = 0; i < node.parameters.length; i++)
      params.push(this.compileNode(node.parameters[i]));

    switch (node.data) {
      case 'function': return `(function(${JSON.parse(params[0])}) {${params[1]}})`;
      default: return `${node.data}(${params.join(',')})`;
    }
  }

  compileMTD(node) {
    const out = [];
    for (let i = 0; i < node.data.length; i++)
      out.push(this.compileNode(node.data[i]));
    return out.join('.');
  }

  compileOPR(node) {
    const left = this.compileNode(node.left);
    const right = this.compileNode(node.right);
    switch (node.data) {
      case '+': return `${left} + ${right}`;
      case '-': return `${left} - ${right}`;
      case '*': return `${left} * ${right}`;
      case '/': return `${left} / ${right}`;
      case '%': return `${left} % ${right}`;
      default: throw new Error(`Unknown OPR: ${node.data}`);
    }
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
}

export { compiler }