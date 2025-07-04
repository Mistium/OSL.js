class tokenise {
  tokeniseEscaped(CODE, DELIMITER) {
    try {
      let letter = 0;
      let depth = "";
      let brackets = 0;
      let b_depth = 0;
      let out = [];
      let split = [];
      let escaped = false;
      const len = CODE.length;

      while (letter < len) {
        depth = CODE[letter];
        if (brackets === 0 && !escaped) {
          if (depth === "[" || depth === "{" || depth === "(") b_depth++
          if (depth === "]" || depth === "}" || depth === ")") b_depth--
          b_depth = b_depth < 0 ? 0 : b_depth;
        }
        if (depth === '"' && !escaped) {
          brackets = 1 - brackets;
          out.push('"');
        } else if (depth === '\\' && !escaped) {
          escaped = !escaped;
          out.push("\\");
        } else {
          out.push(depth);
          escaped = false;
        }
        letter++;

        if (brackets === 0 && CODE[letter] === DELIMITER && b_depth === 0) {
          split.push(out.join(""));
          out = [];
          letter++;
        }
      }
      split.push(out.join(""));
      return split;
    } catch (e) {
      return [];
    }
  }

  tokeniseLineOSL(code) {
    code = code.replace(/("(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|'(?:[^'\\]|\\.)*')|(?<=[\]"}\w\)])(?:\+\+|\?\?|->|==|!=|<=|>=|[><?+*^%/\-|&])(?=\S)/g, v => {
      if (v.startsWith('"') || v.startsWith("'") || v.startsWith('`')) return v;
      return ` ${v} `
    })
    try {
      let letter = 0;
      let depth = "";
      let quotes = 0;
      let squotes = 0;
      let m_comm = 0;
      let b_depth = 0;
      let out = [];
      let split = [];
      let escaped = false;
      const len = code.length;

      while (letter < len) {
        depth = code[letter];
        if (quotes === 0 && squotes === 0 && !escaped) {
          if (depth === "[" || depth === "{" || depth === "(") b_depth++
          if (depth === "]" || depth === "}" || depth === ")") b_depth--
          b_depth = b_depth < 0 ? 0 : b_depth;
        }
        if (depth === '"' && !escaped && squotes === 0) quotes = 1 - quotes;
        else if (depth === "'" && !escaped && quotes === 0) squotes = 1 - squotes;
        else if (depth === "/" && code[letter + 1] === "*" && quotes === 0 && squotes === 0) m_comm = 1;
        else if (depth === "*" && code[letter + 1] === "/" && quotes === 0 && squotes === 0 && m_comm === 1) m_comm = 0;
        else if (depth === '\\' && !escaped) escaped = !escaped;
        else escaped = false;
        out.push(depth);
        letter++;

        if (quotes === 0 &&
          squotes === 0 &&
          b_depth === 0 &&
          m_comm === 0 &&
          (
            code[letter] === " " ||
            code[letter] === ")"
          )
        ) {
          if ([" ", ")"].includes(code[letter]) === false) {
            split.push(depth);
          } else {
            split.push(out.join(""));
          }
          out = [];
          letter++;
        }
      }
      split.push(out.join(""));
      return split;
    } catch (e) {
      console.error("Error in tokeniseLineOSL:", e);
      return [];
    }
  }

  tokeniseLines(CODE) {
    try {
      let letter = 0;
      let depth = "";
      let brackets = 0;
      let b_depth = 0;
      let out = [];
      let split = [];
      let escaped = false;
      const len = CODE.length;

      while (letter < len) {
        depth = CODE[letter];
        if (brackets === 0 && !escaped) {
          if (depth === "[" || depth === "{" || depth === "(") b_depth++
          if (depth === "]" || depth === "}" || depth === ")") b_depth--
          b_depth = b_depth < 0 ? 0 : b_depth;
        }
        if (depth === '"' && !escaped) {
          brackets = 1 - brackets;
          out.push('"');
        } else if (depth === '\\' && !escaped) {
          escaped = !escaped;
          out.push("\\");
        } else {
          out.push(depth);
          escaped = false;
        }
        letter++;

        if (brackets === 0 && ["\n", ";"].includes(CODE[letter]) && b_depth === 0) {
          split.push(out.join(""));
          out = [];
          letter++;
        }
      }
      split.push(out.join(""));
      return split;
    } catch (e) {
      return [];
    }
  }

  parseEscaped(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '\\') {
        i++;
        const esc = str[i];
        switch (esc) {
          case 'n': result += '\n'; break;
          case 't': result += '\t'; break;
          case 'r': result += '\r'; break;
          case '"': result += '"'; break;
          case "'": result += "'"; break;
          case '\\': result += '\\'; break;
          default: result += esc;
        }
      } else {
        result += str[i];
      }
    }
    return result;
  }

  destr(t, e = '"') {
    if ("object" == typeof t || "symbol" == typeof t) return t;
    const n = t + "", r = e + "";
    if (n.startsWith(r) && n.endsWith(r)) {
      let t = n.substring(1, n.length - 1);
      return this.parseEscaped(t);
    }
    return t
  };

  autoTokenise(CODE, DELIMITER) {
    if (CODE.indexOf("\\") !== -1) {
      return this.tokeniseEscaped(CODE, DELIMITER ?? " ");
    } else if (CODE.indexOf('"') !== -1 || CODE.indexOf("[") !== -1 || CODE.indexOf("{") !== -1 || CODE.indexOf("(") !== -1) {
      try {
        let letter = 0;
        let depth = "";
        let brackets = 0;
        let b_depth = 0
        let out = [];
        let split = [];
        const len = CODE.length;

        while (letter < len) {
          depth = CODE[letter];
          if (depth === '"') {
            brackets = 1 - brackets;
            out.push('"');
          } else {
            out.push(depth);
          }
          if (brackets === 0) {
            if (depth === "[" || depth === "{" || depth === "(") b_depth++
            if (depth === "]" || depth === "}" || depth === ")") b_depth--
            b_depth = b_depth < 0 ? 0 : b_depth;
          }
          letter++;

          if (brackets === 0 && CODE[letter] === DELIMITER && b_depth === 0) {
            split.push(out.join(""));
            out = [];
            letter++;
          }
        }
        split.push(out.join(""));
        return split;
      } catch (e) {
        return [];
      }
    } else {
      return CODE.split(DELIMITER ?? " ");
    }
  }
}

export { tokenise }