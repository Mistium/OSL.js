import { tokenise } from "./tokenise.mjs"

class ast {
  constructor(CODE) {
    this.tokeniser = new tokenise()
    this.operators = ["+", "++", "-", "*", "/", "//", "%", "??", "^", "b+", "b-", "b/", "b*", "b^"]
    this.comparisons = ["!=", "==", "!==", "===", ">", "<", "!>", "!<", ">=", "<=", "in", "notIn"]
    this.logic = ["and", "or", "nor", "xor", "xnor", "nand"]
    this.bitwise = ["|", "&", "<<", ">>", "^^"]
    return this.generateFullAST({ CODE });
  }

  generateFullAST({ CODE, MAIN = true }) {
    let line = 0;
    CODE = (MAIN ? `/@line ${++line}\n` : "") + CODE.replace(/("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')|[,{\[]\s*\n\s*[}\]]?|\n\s*[}\.\]]|;|(?<=[)"\]}a-zA-Z\d])\[|(?<=[)\]])\(|\n/gm, (match) => {
      if (match === "\n") return MAIN ? `\n/@line ${++line}\n` : "\n";
      if (match === ";") return "\n";
      if (match === "(") return ".call(";
      if (match === "[") return ".[";
      if ([",", "{", "}", "[", "]"].includes(match.trim()[0])) { line++; return match }
      if (match.startsWith("\n")) { line++; return match.replace(/\n\s*\./, ".") };
      return match;
    });
    CODE = this.tokeniser.autoTokenise(CODE, "\n").map(line => {
      line = line.trim();
      if (line === "endef") return ")";
      if (line.startsWith("def ") && !(line.endsWith("(") || line.endsWith(")"))) return line + " (";
      return line;
    }).join("\n");

    let lines = this.tokeniser.tokeniseLines(CODE).map((line) => {
      line = line.trim();
      if (line.startsWith("//") || line === "") return null;
      return this.generateAST({ CODE: line, MAIN: true });
    });

    for (let i = 0; i < lines.length; i++) {
      const cur = lines[i]
      if (!cur) continue;
      const type = cur?.[0]?.type;
      const data = cur?.[0]?.data;
      if (type === "unk" && data === "/@line") {
        let next = lines[i + 1];
        lines.splice(i--, 1);
        if (!next?.[0]) continue;
        next[0].line = cur[1].data;
      }
      if (type === "cmd" && ["for", "each", "class"].includes(data)) {
        if (data === "each") {
          if (cur?.[4]?.type === "blk") {
            cur[2].type = "str";
            continue;
          }
          const id = "EACH_I_" + randomString(10);
          lines.splice(i, 0, [{ ...cur[0], type: "asi", data: "=", left: this.evalToken(id), right: this.evalToken("0") }]);
          cur[3].data.splice(0, 0, [{ ...cur[0], type: "asi", data: "++", left: this.evalToken(id) }])
        }
        cur[1].type = "str"
        i++
      }
    }

    return lines.filter((line) =>
      line !== null &&
      line?.[0]?.data !== "/@line"
    );
  }

  generateAST({ CODE, START, MAIN }) {
    CODE = CODE + "";
    const start = CODE.split("\n", 1)[0]
    // tokenise and handle lambda and inline funcs
    let ast = []
    let tokens = this.tokeniser.tokeniseLineOSL(CODE)
    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i].trim()
      if (cur === "->") {
        ast.push({ type: "inl", data: "->" })
        ast.push({ type: "str", data: tokens[i + 1].trim() })
        i += 1
        continue
      }
      ast.push(this.evalToken(cur))
    }

    // modifier node creation
    let modifiers = false;
    for (let token of ast) {
      if (modifiers && token.type === "unk") {
        token.type = "mod"
        const pivot = token.data.indexOf("#") + 1
        token.data = [token.data.substring(0, pivot - 1), this.evalToken(token.data.substring(pivot))]
      }
      if (token.type === "mod_indicator") modifiers = true
    }

    // join together nodes that should be a single node
    const types = ["inl", "opr", "cmp", "qst", "bit", "log"];
    for (let type of types) {
      for (let i = START ?? (["asi", "inl"].includes(type) ? 1 : 2); i < ast.length; i++) {
        const cur = ast[i];
        let prev = ast[i - 1];
        let next = ast[i + 1];

        if (cur?.type === type) {
          if (type === "qst") {
            cur.left = prev;
            cur.right = next;
            cur.right2 = ast[i + 2];
            ast.splice(i - 1, 1);
            ast.splice(i, 2);
            i -= 1;
            continue;
          }
          if (!cur.left) {
            cur.left = prev;
            cur.right = next;
            cur.source = `${prev?.source ?? ""} ${cur?.source ?? ""} ${next?.source ?? ""}`
            ast.splice(i - 1, 1);
            ast.splice(i, 1);
            i -= 1;
          }
        }
      }
    }

    // eval static nodes
    const evalASTNode = node => {
      if (!node) return node;
      if (node.type === "inl") {
        const params = (node?.left?.parameters || []).map(p => p.data).join(",");
        const right = node.right;
        if (typeof right.data === "string" && !right.data.trim().startsWith("(\n")) {
          right.data = `(\nreturn ${right.data}\n)`;
        }
        return {
          type: "fnc",
          data: "function",
          parameters: [
            {
              type: "str",
              data: params
            },
            this.generateAST({ CODE: right.data, START: 0 })[0]
          ]
        }
      }
      if (node.type === "opr" && node.left && node.right) {
        // Recursively evaluate left and right nodes first
        node.left = evalASTNode(node.left);
        node.right = evalASTNode(node.right);

        // If both operands are numbers, evaluate the operation
        if (node.left.type === "num" && node.right.type === "num" && ["+", "-", "/", "*", "%", "^"].includes(node.data)) {
          let result;
          switch (node.data) {
            case "^": result = +Math.pow(+node.left.data, +node.right.data); break;
            case "+": result = +node.left.data + +node.right.data; break;
            case "-": result = +node.left.data - +node.right.data; break;
            case "*": result = +node.left.data * +node.right.data; break;
            case "/": result = +node.left.data / +node.right.data; break;
            case "%": result = +node.left.data % +node.right.data; break;
          }
          if (result) return {
            type: "num",
            data: +result
          };
        }
      }
      return node;
    }

    // Evaluate each node in the AST
    for (let i = 0; i < ast.length; i++) {
      ast[i] = evalASTNode(ast[i]);
    }

    // def command -> assignment conversion
    const first = ast[0] ?? {};
    const second = ast[1] ?? {};
    if (
      first.type === "var" &&
      first.data === "def" &&
      second.type === "fnc"
    ) {
      first.data = second.data;
      ast.splice(1, 0, {
        type: "asi",
        data: "=",
        source: start
      });
      ast[2] = {
        type: "fnc",
        data: "function",
        parameters: [
          {
            type: "str",
            data: second.parameters.map(p => (p.set_type ? `${p.set_type} ` : "") + (
              p.type === "mtd" ?
                p.data.map(p2 => p2.data).join(".") :
                p.data
            )).join(",")
          },
          ast[3]
        ]
      };
      ast.splice(3, 1);
    }

    if (ast.length === 0) return [];

    // method commands
    if (ast[0].type === "mtd" &&
      ast[0].data[1].type === "mtv" &&
      ast.length === 1 && MAIN
    ) {
      ast.unshift(ast[0].data[0], {
        type: "asi",
        data: "=??",
        source: start
      });
    }

    // assignment node creation
    for (let i = START ?? 1; i < ast.length; i++) {
      const cur = ast[i];
      let prev = ast[i - 1];
      let next = ast[i + 1];

      if (cur?.type === "asi") {
        if (ast[0].data === "local") {
          prev = this.generateAST({ CODE: "this." + prev.data, START: 0 })[0];
          ast.splice(0, 1);
          i -= 1;
        }
        if (ast.length > 1 && i > 1) {
          cur.set_type = ast[i - 2].data;
          ast.splice(i - 2, 1);
          i -= 1;
        }
        if (!cur.left) {
          cur.left = prev;
          cur.right = next;
          ast.splice(i - 1, 1);
          ast.splice(i, 1);
          i -= 1;
        }
        cur.source = start;
      }
    }

    if (ast.length === 0) return null;

    // increment and decrement
    const t1 = ast[1]
    if (ast.length === 2 &&
      ast[0].type === "var" &&
      ast.length === 2 &&
      (t1?.data === "--" &&
        t1?.type === "unk" &&
        !t1?.right) ||
      (t1?.data === "++" &&
        t1?.type === "opr" &&
        !t1?.right)
    ) {
      ast[0] = {
        type: "asi",
        data: ast[1].data,
        left: ast[0],
        source: CODE
      }
      ast.splice(1, 1);
    }

    if (ast[0].type === "var" && MAIN) {
      ast[0].type = "cmd";
      ast[0].source = CODE.split("\n", 1)[0];
    }

    // switch statements
    if (ast[0].type === "cmd" &&
      ast[0].data === "switch"
    ) {
      if (ast[2]?.type === "blk") {
        let cases = { type: "array", all: [] }
        const blk = ast[2]?.data ?? []
        for (let i = 0; i < blk.length; i++) {
          const cur = blk[i];
          if (cur[0].data === "case") cases.all.push([cur[1], i])
          if (cur[0].data === "default") cases.default = i
        }
        if (cases.all.every(v => ["str", "num"].includes(v[0].type))) {
          const newCases = {}
          cases.all.map(v => {
            if (v[0]?.data) newCases[String(v[0]?.data ?? "").toLowerCase()] = v[1]
          })
          cases.type = "object"
          cases.all = newCases;
        }
        ast[0].cases = cases
      }
    }

    return ast.filter(token => (
      token.type &&
      token.type.length === 3 &&
      !(String(token.data).startsWith("/*") && token.type === "unk")
    ))
  }

  evalToken(cur, param) {
    const out = this.stringToToken(cur, param)
    out.source = out.type === "blk" ? "[ast BLK]" : cur;
    return out
  }

  stringToToken(cur, param) {
    const tk = this.tokeniser;
    if ((cur[0] === "{" && cur[cur.length - 1] === "}") || (cur[0] === "[" && cur[cur.length - 1] === "]")) {
      try {
        if (cur[0] === "[") {
          if (cur == "[]") return { type: "arr", data: [] }

          let tokens = tk.autoTokenise(cur.substring(1, cur.length - 1), ",");
          for (let i = 0; i < tokens.length; i++) {
            tokens[i] = this.generateAST({ CODE: ("" + tokens[i]).trim(), START: 0 })[0];
          }

          if (param) return { type: "mtv", data: "item", parameters: tokens };
          return { type: "arr", data: tokens }
        } else if (cur[0] === "{") {
          if (cur == "{}") return { type: "obj", data: {} }

          let output = {};
          let tokens = tk.autoTokenise(cur.substring(1, cur.length - 1), ",")
            .filter((token) => token.trim() !== "");
          for (let token of tokens) {
            let [key, value] = tk.autoTokenise(token, ":");
            key = key.trim();
            if (key[0] === "\"" && key[key.length - 1] === "\"") {
              key = key.substring(1, key.length - 1);
            }
            if (value === undefined) output[key] = null;
            else output[key] = this.generateAST({ CODE: ("" + value).trim(), START: 0 })[0];
          }
          return { type: "obj", data: output };
        }
      } catch (e) {
        console.error(e)
        return { type: "unk", data: cur }
      }
    }
    else if (cur[0] + cur[cur.length - 1] === '""') return { type: "str", data: tk.destr(cur) }
    else if (cur[0] + cur[cur.length - 1] === "''") return { type: "str", data: tk.destr(cur, "'") }
    else if (cur[0] + cur[cur.length - 1] === "``") {
      return {
        type: "tsr", data: parseTemplate(destr(cur, "`")).filter(v => v !== "").map(v => {
          if (v.startsWith("${")) return this.generateAST({ CODE: v.slice(2, -1), START: 0 })[0]
          else return { type: "str", data: v }
        })
      }
    }
    else if (!isNaN(+cur)) return { type: "num", data: +cur }
    else if (cur === "true" || cur === "false") return { type: "var", data: cur === "true" }
    else if (this.operators.indexOf(cur) !== -1) return { type: "opr", data: cur }
    else if (this.comparisons.indexOf(cur) !== -1) return { type: "cmp", data: cur }
    else if (cur === "?") return { type: "qst", data: cur }
    else if (this.logic.indexOf(cur) !== -1) return { type: "log", data: cur }
    else if (this.bitwise.indexOf(cur) !== -1) return { type: "bit", data: cur }
    else if (tk.autoTokenise(cur, ".").length > 1) {
      let method = tk.autoTokenise(cur, ".")
      method = method.map((input, index) => this.evalToken(input, index > 0))
      return { type: "mtd", data: method };
    }
    else if (cur === "null") return { type: "unk", data: null }
    else if (cur.match(/^(!+)?[a-zA-Z_][a-zA-Z0-9_]*$/)) return { type: "var", data: cur }
    else if (cur === "->") return { type: "inl", data: "->" }
    else if (cur.startsWith("(\n") && cur.endsWith(")")) return { type: "blk", data: this.generateFullAST({ CODE: cur.substring(2, cur.length - 1).trim(), START: 0, MAIN: false }) }
    else if (cur.startsWith("(") && cur.endsWith(")")) {
      let end = this.findMatchingParentheses(cur, 0);
      if (end === -1) return { type: "unk", data: cur };
      const body = cur.substring(1, end).trim();
      return this.generateAST({ CODE: body, START: 0 })[0]
    }
    else if (cur.endsWith(")")) {
      let out = { type: param ? "mtv" : "fnc", data: cur.substring(0, cur.indexOf("(")), parameters: [] }
      if (cur.endsWith("()")) return out
      let method = tk.autoTokenise(cur.substring(cur.indexOf("(") + 1, cur.length - 1), ",")
      method = method.map(v => {
        const tkns = tk.autoTokenise(v.trim(), " ");
        if (tkns.length === 2) {
          const ast = this.generateAST({ CODE: tkns[1].trim(), START: 0 })[0]
          ast.set_type = tkns[0]
          return ast
        }
        return this.generateAST({ CODE: v.trim(), START: 0 })[0]
      })
      out.parameters = method
      return out
    }
    else if (cur === ":") return { type: "mod_indicator", data: ":" };
    else if (cur.endsWith("=")) return { type: "asi", data: cur }
    else return { type: "unk", data: cur }
  }
}

export { ast }