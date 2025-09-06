# OSL.js - Origin Scripting Language

OSL.js is a compiler and runtime for the Origin Scripting Language (OSL), a powerful and intuitive scripting language with modern features.

## Features

- 🚀 Fast compilation to JavaScript
- 🔧 Rich built-in methods for strings, arrays, and numbers
- 📦 Easy CLI installation and usage
- 🌐 Integration with Origin platform
- ⚡ Auto-assignment operators for method chaining
- 🧮 Advanced math operations and functions

## Quick Start

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mistium/OSL.js.git
   cd OSL.js
   ```

2. **Install the CLI globally:**
   ```bash
   ./install.sh
   ```
   
   Or manually:
   ```bash
   npm install -g .
   ```

### Basic Usage

Once installed, you can use the `osl` command:

```bash
# Compile an OSL file to JavaScript
osl compile script.osl

# Run an OSL file directly
osl run script.osl

# Open Origin website
osl origin

# Update OSL.js from GitHub
osl update

# Show help
osl help
```

## CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `compile <file>` | Compile OSL file to JavaScript | `osl compile script.osl` |
| `run <file>` | Compile and run OSL file | `osl run script.osl` |
| `origin` | Open Origin website | `osl origin` |
| `update` | Update from GitHub | `osl update` |
| `version` | Show version info | `osl version` |
| `help` | Show help message | `osl help` |

## OSL Language Features

### Variables and Basic Operations
```osl
message = "Hello, World!"
number = 42
result = number + 10
log message
log result
```

### Array Operations
```osl
numbers = [3, 1, 4, 1, 5, 9]
numbers.sort()          // Auto-assigns sorted array back to numbers
log numbers             // [1, 1, 3, 4, 5, 9]

numbers.deDupe()        // Remove duplicates
log numbers             // [1, 3, 4, 5, 9]
```

### String Methods
```osl
text = "Hello World"
reversed = text.reverse()
log reversed            // "dlroW olleH"

text.toUpper()          // Auto-assigns uppercase version
log text                // "HELLO WORLD"
```

### Math Functions
```osl
x = 16
log x.sqrt()            // 4
log x.isPrime()         // false

angle = 90
log angle.radSin()      // Math.sin(90)
```

### Control Flow
```osl
x = 5
if x > 10 (
    log "Greater than 10"
) else if x > 0 (
    log "Positive number"
) else (
    log "Zero or negative"
)
```

### Loops
```osl
i = 0
while i < 5 (
    log "Count: " ++ i
    i += 1
)

loop 3 (
    log "This runs 3 times"
)
```

## Available Methods

### String Methods
- `chr()` - Convert number to character
- `ask()` - Show prompt dialog
- `reverse()` - Reverse string
- `toUpper()` / `toLower()` - Change case
- `split(delimiter)` - Split into array
- `left(n)` / `right(n)` - Get substring
- `first()` / `last()` - Get first/last character
- `strip()` - Remove whitespace
- `padStart(char, length)` / `padEnd(char, length)` - Pad string

### Array Methods
- `sort()` - Sort array
- `reverse()` - Reverse array
- `deDupe()` - Remove duplicates
- `fill(value)` - Fill with value
- `join(separator)` - Join to string
- `pop()` / `shift()` - Remove elements
- `first()` / `last()` - Get first/last element

### Number Methods
- `sqrt()` - Square root
- `round()` / `floor()` / `ceiling()` - Rounding
- `abs()` - Absolute value
- `isPrime()` - Check if prime
- `asin()` / `acos()` / `atan()` - Trigonometric functions
- `log()` / `ln()` - Logarithms

## Development

### Project Structure
```
OSL.js/
├── bin/
│   └── osl.mjs          # CLI script
├── modules/
│   └── compiler.mjs     # Main compiler
├── external/
│   └── ASTgen.js        # AST generator
├── package.json         # Package configuration
├── install.sh           # Installation script
└── README.md           # This file
```

### Using as a Library
```javascript
import { compiler } from './modules/compiler.mjs';

// Compile to JavaScript string
const jsCode = new compiler({
    output: 'string',
    code: 'log "Hello, World!"'
}).out;

// Compile to executable function
const fn = new compiler({
    output: 'function', 
    code: 'log "Hello, World!"'
});

fn(); // Executes the OSL code
```

## Examples

Check out `example.osl` for a comprehensive example showcasing various OSL features.

## Links

- 🌐 **Origin Platform**: https://origin.mistium.com
- 📁 **GitHub Repository**: https://github.com/Mistium/OSL.js
- 📖 **Documentation**: Available on Origin platform

## License

MIT License - see the repository for details.