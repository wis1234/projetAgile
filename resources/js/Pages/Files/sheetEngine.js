const ERROR_CODES = new Set([
  '#NULL!',
  '#DIV/0!',
  '#VALUE!',
  '#REF!',
  '#NAME?',
  '#NUM!',
  '#N/A',
  '#CIRCULAR!',
]);

const error = (code) => ({ kind: 'error', code });
const isError = (value) => value?.kind === 'error';
const columnToIndex = (column) => [...column.toUpperCase()].reduce(
  (index, letter) => index * 26 + letter.charCodeAt(0) - 64,
  0
) - 1;
const indexToColumn = (index) => {
  let column = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    column = String.fromCharCode(((value - 1) % 26) + 65) + column;
  }
  return column;
};

const parseReference = (text, defaultSheet) => {
  const match = text.match(/^(?:'((?:[^']|'')+)'|([A-Za-z_][A-Za-z0-9_.]*))!\$?([A-Z]{1,3})\$?(\d+)$/i);
  const localMatch = text.match(/^\$?([A-Z]{1,3})\$?(\d+)$/i);
  const sheet = match ? (match[1] || match[2]).replace(/''/g, "'") : defaultSheet;
  const column = match ? match[3] : localMatch?.[1];
  const row = match ? match[4] : localMatch?.[2];
  if (!column || !row || !sheet) return null;
  return { sheet, row: Number(row) - 1, col: columnToIndex(column) };
};

const tokenize = (source) => {
  const tokens = [];
  let remaining = source.trim().replace(/^=/, '');
  while (remaining.length) {
    const whitespace = remaining.match(/^\s+/);
    if (whitespace) {
      remaining = remaining.slice(whitespace[0].length);
      continue;
    }

    const candidates = [
      ['error', /^#(?:NULL!|DIV\/0!|VALUE!|REF!|NAME\?|NUM!|N\/A|CIRCULAR!)/i],
      ['reference', /^(?:'(?:[^']|'')+'|[A-Za-z_][A-Za-z0-9_.]*)!\$?[A-Z]{1,3}\$?\d+/i],
      ['reference', /^\$?[A-Z]{1,3}\$?\d+/i],
      ['number', /^(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?/],
      ['identifier', /^[A-Za-z_][A-Za-z0-9_.]*/],
      ['operator', /^(?:<=|>=|<>|[+\-*/^&%=<>():,;])/],
    ];
    let matched = false;
    for (const [type, pattern] of candidates) {
      const match = remaining.match(pattern);
      if (!match) continue;
      tokens.push({ type, value: match[0] });
      remaining = remaining.slice(match[0].length);
      matched = true;
      break;
    }
    if (matched) continue;

    if (remaining[0] === '"') {
      let value = '';
      let index = 1;
      while (index < remaining.length) {
        if (remaining[index] === '"' && remaining[index + 1] === '"') {
          value += '"';
          index += 2;
        } else if (remaining[index] === '"') {
          index += 1;
          break;
        } else {
          value += remaining[index];
          index += 1;
        }
      }
      if (remaining[index - 1] !== '"') throw new Error('Unterminated string');
      tokens.push({ type: 'string', value });
      remaining = remaining.slice(index);
      continue;
    }

    throw new Error(`Unexpected token near "${remaining.slice(0, 12)}"`);
  }
  tokens.push({ type: 'eof', value: '' });
  return tokens;
};

const parseFormula = (source, currentSheet) => {
  const tokens = tokenize(source);
  let position = 0;
  const peek = () => tokens[position];
  const consume = (value) => {
    if (value !== undefined && peek().value !== value) {
      throw new Error(`Expected ${value}`);
    }
    return tokens[position++];
  };
  const node = (type, fields) => ({ type, ...fields });

  const parsePrimary = () => {
    const token = consume();
    if (token.type === 'number') return node('literal', { value: Number(token.value) });
    if (token.type === 'string') return node('literal', { value: token.value });
    if (token.type === 'error') return node('literal', { value: error(token.value.toUpperCase()) });
    if (token.value === '(') {
      const value = parseComparison();
      consume(')');
      return value;
    }
    if (token.type === 'reference') {
      const ref = parseReference(token.value, currentSheet);
      if (!ref) throw new Error('Invalid cell reference');
      return node('reference', { ref });
    }
    if (token.type === 'identifier') {
      const identifier = token.value.replace(/^_xlfn\./i, '');
      if (peek().value === '(') {
        consume('(');
        const args = [];
        while (peek().value !== ')') {
          if (peek().type === 'eof') throw new Error('Unclosed function call');
          args.push(parseComparison());
          if (peek().value !== ',' && peek().value !== ';') break;
          consume();
        }
        consume(')');
        return node('call', { name: identifier.toUpperCase(), args });
      }
      if (identifier.toUpperCase() === 'TRUE') return node('literal', { value: true });
      if (identifier.toUpperCase() === 'FALSE') return node('literal', { value: false });
      return node('name', { name: identifier });
    }
    throw new Error(`Unexpected token ${token.value}`);
  };

  const parseRange = () => {
    let left = parsePrimary();
    if (peek().value === ':') {
      consume(':');
      const right = parsePrimary();
      if (left.type !== 'reference' || right.type !== 'reference') {
        throw new Error('Range endpoints must be cell references');
      }
      if (left.ref.sheet === currentSheet && right.ref.sheet === currentSheet) {
        right.ref.sheet = left.ref.sheet;
      } else if (right.ref.sheet === currentSheet && left.ref.sheet !== currentSheet) {
        right.ref.sheet = left.ref.sheet;
      } else if (left.ref.sheet !== right.ref.sheet) {
        throw new Error('Range endpoints must be on the same sheet');
      }
      left = node('range', { start: left.ref, end: right.ref });
    }
    return left;
  };

  const parsePostfix = () => {
    let expression = parseRange();
    while (peek().value === '%') {
      consume('%');
      expression = node('postfix', { operator: '%', value: expression });
    }
    return expression;
  };
  const parseUnary = () => {
    if (peek().value === '+' || peek().value === '-') {
      const operator = consume().value;
      return node('unary', { operator, value: parseUnary() });
    }
    return parsePostfix();
  };
  const parsePower = () => {
    const left = parseUnary();
    if (peek().value === '^') {
      consume('^');
      return node('binary', { operator: '^', left, right: parsePower() });
    }
    return left;
  };
  const parseMultiplication = () => {
    let left = parsePower();
    while (peek().value === '*' || peek().value === '/') {
      const operator = consume().value;
      left = node('binary', { operator, left, right: parsePower() });
    }
    return left;
  };
  const parseAddition = () => {
    let left = parseMultiplication();
    while (peek().value === '+' || peek().value === '-') {
      const operator = consume().value;
      left = node('binary', { operator, left, right: parseMultiplication() });
    }
    return left;
  };
  const parseConcatenation = () => {
    let left = parseAddition();
    while (peek().value === '&') {
      const operator = consume().value;
      left = node('binary', { operator, left, right: parseAddition() });
    }
    return left;
  };
  const parseComparison = () => {
    let left = parseConcatenation();
    while (['=', '<>', '<', '>', '<=', '>='].includes(peek().value)) {
      const operator = consume().value;
      left = node('binary', { operator, left, right: parseConcatenation() });
    }
    return left;
  };

  const ast = parseComparison();
  if (peek().type !== 'eof') throw new Error(`Unexpected token ${peek().value}`);
  return ast;
};

const isRange = (value) => value?.kind === 'range';
const flatten = (value) => (isRange(value) ? value.values.flat() : [value]);
const scalar = (value) => (isRange(value) ? value.values[0]?.[0] ?? '' : value);
const toNumber = (value) => {
  const item = scalar(value);
  if (isError(item)) return item;
  if (item === '' || item === null || item === undefined || item === false) return 0;
  if (item === true) return 1;
  const numeric = Number(item);
  return Number.isFinite(numeric) ? numeric : error('#VALUE!');
};
const isBlank = (value) => value === '' || value === null || value === undefined;
const excelSerial = (date) => Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(1899, 11, 30)) / 86400000);
const excelDate = (serial) => {
  const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
  return Number.isNaN(date.getTime()) ? error('#NUM!') : date;
};

const compareValues = (left, right) => {
  const a = scalar(left);
  const b = scalar(right);
  if (isError(a)) return a;
  if (isError(b)) return b;
  const an = a === '' ? 0 : Number(a);
  const bn = b === '' ? 0 : Number(b);
  if (a !== '' && b !== '' && Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
  return String(a ?? '').toLocaleLowerCase().localeCompare(String(b ?? '').toLocaleLowerCase());
};

const matchesCriterion = (value, criterion) => {
  const target = scalar(criterion);
  if (isError(target)) return false;
  const text = String(target ?? '');
  const match = text.match(/^(<=|>=|<>|=|<|>)(.*)$/);
  const operator = match?.[1] || '=';
  const expected = match ? match[2] : target;
  const actual = scalar(value);
  if (isError(actual)) return false;

  const wildcard = typeof expected === 'string' && /[*?~]/.test(expected);
  if (wildcard && ['=', '<>'].includes(operator)) {
    const pattern = String(expected)
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/~\*/g, '\\*')
      .replace(/~\?/g, '\\?')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const matched = new RegExp(`^${pattern}$`, 'i').test(String(actual ?? ''));
    return operator === '<>' ? !matched : matched;
  }

  const comparison = compareValues(actual, expected);
  if (isError(comparison)) return false;
  switch (operator) {
    case '=': return comparison === 0;
    case '<>': return comparison !== 0;
    case '<': return comparison < 0;
    case '>': return comparison > 0;
    case '<=': return comparison <= 0;
    case '>=': return comparison >= 0;
    default: return false;
  }
};

const formatNumber = (value, format) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || !format) return value;
  if (/^0(?:\.0+)?%$/.test(format)) {
    const decimals = (format.split('.')[1]?.replace('%', '').length) || 0;
    return `${(value * 100).toFixed(decimals)}%`;
  }
  const currency = format.match(/^([$€£])[^;]*/);
  if (currency) return `${currency[1]}${value.toFixed((format.split('.')[1] || '').replace(/[^0#]/g, '').length)}`;
  if (/^0(?:\.0+)?$/.test(format)) {
    const decimals = format.split('.')[1]?.length || 0;
    return value.toFixed(decimals);
  }
  if (/^yyyy[-/]mm[-/]dd$/i.test(format)) {
    const date = excelDate(value);
    if (isError(date)) return value;
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }
  return value;
};

const evaluateCall = (name, args, context) => {
  const evaluate = (index) => index < args.length ? evaluateAst(args[index], context) : '';
  const value = (index) => scalar(evaluate(index));
  const values = (index) => flatten(evaluate(index));
  const numericValues = (index) => values(index).map(toNumber).filter(item => !isError(item));
  const firstError = (items) => items.find(isError);
  const arity = (min, max = min) => args.length < min || args.length > max;
  const errorArity = () => error('#VALUE!');

  if (name === 'IF') {
    if (arity(2, 3)) return errorArity();
    const condition = value(0);
    if (isError(condition)) return condition;
    return condition ? value(1) : value(2);
  }
  if (name === 'IFERROR') {
    if (arity(2)) return errorArity();
    const result = evaluate(0);
    return isError(scalar(result)) ? value(1) : result;
  }
  if (name === 'IFNA') {
    if (arity(2)) return errorArity();
    const result = value(0);
    return isError(result) && result.code === '#N/A' ? value(1) : result;
  }
  if (name === 'IFS') {
    if (!args.length || args.length % 2 !== 0) return errorArity();
    for (let index = 0; index < args.length; index += 2) {
      const condition = value(index);
      if (isError(condition)) return condition;
      if (condition) return value(index + 1);
    }
    return error('#N/A');
  }

  if (name === 'SUMIFS' || name === 'COUNTIFS' || name === 'AVERAGEIFS') {
    if (args.length < (name === 'COUNTIFS' ? 2 : 3) || args.length % 2 === (name === 'COUNTIFS' ? 1 : 0)) return errorArity();
    const countOnly = name === 'COUNTIFS';
    const sumRange = countOnly ? null : evaluate(0);
    if (!countOnly && !isRange(sumRange)) return error('#VALUE!');
    const criteriaStart = countOnly ? 0 : 1;
    const criteriaRanges = [];
    for (let index = criteriaStart; index < args.length; index += 2) {
      const range = evaluate(index);
      if (!isRange(range)) return error('#VALUE!');
      criteriaRanges.push({ range, criterion: value(index + 1) });
    }
    const criteriaBase = criteriaRanges[0]?.range;
    const rows = criteriaBase?.values.length ?? 0;
    const cols = criteriaBase?.values[0]?.length ?? 0;
    if (!countOnly && (sumRange.values.length !== rows || (sumRange.values[0]?.length ?? 0) !== cols)) return error('#VALUE!');
    if (criteriaRanges.some(({ range }) => range.values.length !== rows || (range.values[0]?.length ?? 0) !== cols)) return error('#VALUE!');
    let total = 0;
    let count = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const matches = criteriaRanges.every(({ range, criterion }) => matchesCriterion(range.values[row][col], criterion));
        if (!matches) continue;
        if (countOnly) {
          count += 1;
        } else {
          const rawItem = sumRange.values[row][col];
          if (isError(rawItem)) return rawItem;
          const item = toNumber(rawItem);
          if (!isError(item)) {
            total += item;
            count += 1;
          }
        }
      }
    }
    return name === 'COUNTIFS' ? count : name === 'AVERAGEIFS' ? (count ? total / count : error('#DIV/0!')) : total;
  }
  if (['SUMIF', 'COUNTIF', 'AVERAGEIF'].includes(name)) {
    if (arity(2, 3)) return errorArity();
    const criteriaRange = evaluate(0);
    if (!isRange(criteriaRange)) return error('#VALUE!');
    const sumRange = name === 'COUNTIF' ? criteriaRange : (args[2] ? evaluate(2) : criteriaRange);
    if (!isRange(sumRange) || sumRange.values.length !== criteriaRange.values.length) return error('#VALUE!');
    let total = 0;
    let count = 0;
    for (let row = 0; row < criteriaRange.values.length; row += 1) {
      for (let col = 0; col < criteriaRange.values[row].length; col += 1) {
        if (!matchesCriterion(criteriaRange.values[row][col], value(1))) continue;
        if (name !== 'COUNTIF') {
          const rawItem = sumRange.values[row]?.[col];
          if (isError(rawItem)) return rawItem;
          const item = toNumber(rawItem);
          if (isError(item)) continue;
          total += item;
        }
        count += 1;
      }
    }
    return name === 'COUNTIF' ? count : name === 'AVERAGEIF' ? (count ? total / count : error('#DIV/0!')) : total;
  }
  if (name === 'VLOOKUP') {
    if (arity(3, 4)) return errorArity();
    const lookup = value(0);
    const table = evaluate(1);
    const colNumber = toNumber(value(2));
    if (isError(lookup) || isError(colNumber)) return isError(lookup) ? lookup : colNumber;
    if (!isRange(table) || colNumber < 1 || colNumber > (table.values[0]?.length ?? 0)) return error('#REF!');
    const exact = args.length < 4 || !value(3);
    let candidate = -1;
    for (let row = 0; row < table.values.length; row += 1) {
      const comparison = compareValues(table.values[row][0], lookup);
      if (comparison === 0) return table.values[row][colNumber - 1] ?? '';
      if (!exact && comparison <= 0) candidate = row;
      if (exact && comparison > 0) break;
    }
    return candidate >= 0 ? table.values[candidate][colNumber - 1] ?? '' : error('#N/A');
  }
  if (name === 'INDEX') {
    if (arity(2, 3)) return errorArity();
    const range = evaluate(0);
    const row = toNumber(value(1));
    const col = args[2] ? toNumber(value(2)) : 1;
    if (isError(row) || isError(col)) return isError(row) ? row : col;
    if (!isRange(range) || row < 1 || col < 1) return error('#REF!');
    return range.values[row - 1]?.[col - 1] ?? error('#REF!');
  }
  if (name === 'MATCH') {
    if (arity(2, 3)) return errorArity();
    const lookup = value(0);
    const range = evaluate(1);
    const mode = args[2] ? toNumber(value(2)) : 1;
    if (!isRange(range) || isError(mode)) return error('#N/A');
    const items = range.values.flat();
    let candidate = -1;
    for (let index = 0; index < items.length; index += 1) {
      const comparison = compareValues(items[index], lookup);
      if (comparison === 0) return index + 1;
      if (mode === 0 && typeof lookup === 'string' && /[*?]/.test(lookup)) {
        if (matchesCriterion(items[index], lookup)) return index + 1;
      } else if (mode === 1 && comparison <= 0) candidate = index;
      else if (mode === -1 && comparison >= 0 && candidate < 0) candidate = index;
      else if (mode === 0) continue;
      else if (mode === 1 && comparison > 0) break;
    }
    return candidate >= 0 ? candidate + 1 : error('#N/A');
  }
  if (name === 'DATE') {
    if (arity(3)) return errorArity();
    const parts = [0, 1, 2].map(index => toNumber(value(index)));
    if (parts.some(isError)) return firstError(parts);
    const [year, month, day] = parts;
    const normalizedYear = year >= 0 && year < 1900 ? year + 1900 : year;
    return excelSerial(new Date(Date.UTC(normalizedYear, month - 1, day)));
  }
  if (name === 'TODAY' || name === 'NOW') {
    if (arity(0)) return errorArity();
    const now = new Date();
    const serial = excelSerial(now);
    return name === 'TODAY' ? serial : serial + (now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds()) / 86400;
  }

  const evaluated = args.map((_, index) => evaluate(index));
  const flat = evaluated.flatMap(flatten);
  const directError = firstError(flat);
  if (directError && !['COUNT', 'COUNTA'].includes(name)) return directError;
  switch (name) {
    case 'SUM':
      return flat.map(toNumber).filter(item => !isError(item)).reduce((sum, item) => sum + item, 0);
    case 'AVERAGE': {
      const numbers = flat.map(toNumber).filter(item => !isError(item));
      return numbers.length ? numbers.reduce((sum, item) => sum + item, 0) / numbers.length : error('#DIV/0!');
    }
    case 'COUNT': return flat.filter(item => !isBlank(item) && !isError(toNumber(item))).length;
    case 'COUNTA': return flat.filter(item => !isBlank(item)).length;
    case 'MIN': {
      const numbers = flat.map(toNumber).filter(item => !isError(item));
      return numbers.length ? Math.min(...numbers) : 0;
    }
    case 'MAX': {
      const numbers = flat.map(toNumber).filter(item => !isError(item));
      return numbers.length ? Math.max(...numbers) : 0;
    }
    case 'CONCAT':
    case 'CONCATENATE':
    case 'TEXTJOIN': {
      if (name === 'TEXTJOIN') {
        if (arity(3)) return errorArity();
        const delimiter = String(value(0) ?? '');
        const ignoreEmpty = Boolean(value(1));
        const text = evaluated.slice(2).flatMap(flatten).filter(item => !(ignoreEmpty && isBlank(item))).map(item => String(item ?? ''));
        return text.join(delimiter);
      }
      return flat.map(item => String(item ?? '')).join('');
    }
    case 'LEFT':
    case 'RIGHT': {
      if (arity(1, 2)) return errorArity();
      const text = String(value(0) ?? '');
      const count = args[1] ? toNumber(value(1)) : 1;
      if (isError(count) || count < 0) return error('#VALUE!');
      return name === 'LEFT' ? text.slice(0, count) : text.slice(-count || text.length);
    }
    case 'MID': {
      if (arity(3)) return errorArity();
      const text = String(value(0) ?? '');
      const start = toNumber(value(1));
      const length = toNumber(value(2));
      if (isError(start) || isError(length) || start < 1 || length < 0) return error('#VALUE!');
      return text.slice(start - 1, start - 1 + length);
    }
    case 'LEN': return arity(1) ? errorArity() : String(value(0) ?? '').length;
    case 'TRIM': return arity(1) ? errorArity() : String(value(0) ?? '').trim().replace(/\s+/g, ' ');
    case 'UPPER': return arity(1) ? errorArity() : String(value(0) ?? '').toLocaleUpperCase();
    case 'LOWER': return arity(1) ? errorArity() : String(value(0) ?? '').toLocaleLowerCase();
    case 'PROPER': return arity(1) ? errorArity() : String(value(0) ?? '').toLocaleLowerCase().replace(/(^|[^\p{L}\p{N}])(\p{L})/gu, (_, before, letter) => before + letter.toLocaleUpperCase());
    case 'VALUE': {
      if (arity(1)) return errorArity();
      const numeric = Number(String(value(0)).replace(/,/g, ''));
      return Number.isFinite(numeric) ? numeric : error('#VALUE!');
    }
    case 'ROUND':
    case 'ROUNDUP':
    case 'ROUNDDOWN': {
      if (arity(2)) return errorArity();
      const number = toNumber(value(0));
      const places = toNumber(value(1));
      if (isError(number) || isError(places)) return isError(number) ? number : places;
      const factor = 10 ** places;
      if (name === 'ROUND') return Math.round(number * factor) / factor;
      if (name === 'ROUNDUP') return Math.sign(number) * Math.ceil(Math.abs(number) * factor) / factor;
      return Math.sign(number) * Math.floor(Math.abs(number) * factor) / factor;
    }
    case 'ABS':
    case 'INT':
    case 'SQRT':
    case 'POWER':
    case 'MOD': {
      if (arity(name === 'POWER' || name === 'MOD' ? 2 : 1)) return errorArity();
      const numbers = [0, 1].slice(0, name === 'POWER' || name === 'MOD' ? 2 : 1).map(index => toNumber(value(index)));
      if (numbers.some(isError)) return firstError(numbers);
      const [a, b] = numbers;
      if (name === 'ABS') return Math.abs(a);
      if (name === 'INT') return Math.floor(a);
      if (name === 'SQRT') return a < 0 ? error('#NUM!') : Math.sqrt(a);
      if (name === 'MOD') return b === 0 ? error('#DIV/0!') : a - b * Math.floor(a / b);
      return a ** b;
    }
    case 'AND': return flat.every(Boolean);
    case 'OR': return flat.some(Boolean);
    case 'NOT': return arity(1) ? errorArity() : !Boolean(value(0));
    case 'ISBLANK': return arity(1) ? errorArity() : isBlank(value(0));
    case 'ISNUMBER': return arity(1) ? errorArity() : typeof value(0) === 'number' && Number.isFinite(value(0));
    case 'ISTEXT': return arity(1) ? errorArity() : typeof value(0) === 'string' && !isError(value(0));
    case 'IFNA': return arity(2) ? errorArity() : (isError(value(0)) && value(0).code === '#N/A' ? value(1) : value(0));
    default: return error('#NAME?');
  }
};

const evaluateAst = (ast, context) => {
  if (ast.type === 'literal') return ast.value;
  if (ast.type === 'name') return error('#NAME?');
  if (ast.type === 'reference') return context.resolve(ast.ref);
  if (ast.type === 'range') return context.resolveRange(ast.start, ast.end);
  if (ast.type === 'call') return evaluateCall(ast.name, ast.args, context);
  if (ast.type === 'postfix') {
    const value = toNumber(evaluateAst(ast.value, context));
    return isError(value) ? value : value / 100;
  }
  if (ast.type === 'unary') {
    const value = ast.value.type === 'range' ? evaluateAst(ast.value, context) : evaluateAst(ast.value, context);
    if (isError(value)) return value;
    const numeric = toNumber(value);
    return isError(numeric) ? numeric : ast.operator === '-' ? -numeric : numeric;
  }
  if (ast.type === 'binary') {
    const left = scalar(evaluateAst(ast.left, context));
    const right = scalar(evaluateAst(ast.right, context));
    if (isError(left)) return left;
    if (isError(right)) return right;
    if (ast.operator === '&') return `${left ?? ''}${right ?? ''}`;
    if (['=', '<>', '<', '>', '<=', '>='].includes(ast.operator)) {
      const comparison = compareValues(left, right);
      if (isError(comparison)) return comparison;
      return {
        '=': comparison === 0,
        '<>': comparison !== 0,
        '<': comparison < 0,
        '>': comparison > 0,
        '<=': comparison <= 0,
        '>=': comparison >= 0,
      }[ast.operator];
    }
    const a = toNumber(left);
    const b = toNumber(right);
    if (isError(a)) return a;
    if (isError(b)) return b;
    if (ast.operator === '/' && b === 0) return error('#DIV/0!');
    const result = {
      '+': () => a + b,
      '-': () => a - b,
      '*': () => a * b,
      '/': () => a / b,
      '^': () => a ** b,
    }[ast.operator]?.();
    return Number.isFinite(result) ? result : error('#NUM!');
  }
  return error('#VALUE!');
};

export const createWorkbook = (input, options = {}) => {
  const sheets = input?.sheets && !Array.isArray(input) ? input.sheets : input;
  const sheetNames = input?.sheetNames || Object.keys(sheets || {});
  const sheetLookup = new Map(sheetNames.map(name => [name.toLocaleLowerCase(), name]));
  const parseCache = new Map();
  const evaluationCache = new Map();

  const rawValue = ({ sheet, row, col }) => {
    const matrix = sheets?.[sheet];
    const cell = Array.isArray(matrix) ? matrix[row]?.[col] : matrix?.[`${indexToColumn(col)}${row + 1}`];
    if (cell && typeof cell === 'object' && !Array.isArray(cell)) {
      return {
        value: cell.value ?? cell.v ?? '',
        formula: cell.formula ?? cell.f ?? null,
        format: cell.fmt ?? cell.format ?? null,
      };
    }
    return { value: cell ?? '', formula: null, format: null };
  };

  const resolve = (ref, stack = []) => {
    const resolvedSheet = sheetLookup.get(String(ref.sheet).toLocaleLowerCase());
    if (!resolvedSheet) return error('#REF!');
    const coordinate = { ...ref, sheet: resolvedSheet };
    const key = `${resolvedSheet}!${coordinate.row}_${coordinate.col}`;
    if (stack.includes(key)) return error('#CIRCULAR!');
    if (evaluationCache.has(key) && stack.length === 0) return evaluationCache.get(key);
    const cell = rawValue(coordinate);
    let result = cell.formula
      ? evaluateFormula(cell.formula, resolvedSheet, [...stack, key])
      : cell.value;
    if (typeof result === 'string' && result.startsWith('=')) {
      result = evaluateFormula(result, resolvedSheet, [...stack, key]);
    }
    if (stack.length === 0) evaluationCache.set(key, result);
    return result;
  };

  const resolveRange = (start, end, stack = []) => {
    const startSheet = sheetLookup.get(String(start.sheet).toLocaleLowerCase());
    const endSheet = sheetLookup.get(String(end.sheet).toLocaleLowerCase());
    if (!startSheet || !endSheet || startSheet !== endSheet) return error('#REF!');
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);
    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    if ((maxRow - minRow + 1) * (maxCol - minCol + 1) > 100000) return error('#NUM!');
    const values = [];
    for (let row = minRow; row <= maxRow; row += 1) {
      const valuesRow = [];
      for (let col = minCol; col <= maxCol; col += 1) {
        valuesRow.push(resolve({ sheet: startSheet, row, col }, stack));
      }
      values.push(valuesRow);
    }
    return { kind: 'range', sheet: startSheet, start, end, values };
  };

  const evaluateFormula = (formula, currentSheet, stack = []) => {
    const normalized = String(formula).replace(/^=\s*/, '').replace(/_xlfn\./gi, '');
    const cacheKey = `${currentSheet}!${normalized}`;
    if (!stack.length && evaluationCache.has(cacheKey)) return evaluationCache.get(cacheKey);
    try {
      let ast = parseCache.get(cacheKey);
      if (!ast) {
        ast = parseFormula(normalized, currentSheet);
        parseCache.set(cacheKey, ast);
      }
      const result = evaluateAst(ast, {
        resolve: ref => resolve(ref, stack),
        resolveRange: (start, end) => resolveRange(start, end, stack),
      });
      if (!stack.length) evaluationCache.set(cacheKey, result);
      return result;
    } catch {
      return error('#VALUE!');
    }
  };

  const get = (sheet, address) => {
    const ref = parseReference(address, sheet);
    if (!ref) return null;
    const canonicalSheet = sheetLookup.get(String(ref.sheet).toLocaleLowerCase());
    if (!canonicalSheet) return null;
    const raw = rawValue({ ...ref, sheet: canonicalSheet });
    const result = resolve({ ...ref, sheet: canonicalSheet });
    return {
      sheet: canonicalSheet,
      address: `${indexToColumn(ref.col)}${ref.row + 1}`,
      value: isError(result) ? result.code : result,
      formula: raw.formula || (typeof raw.value === 'string' && raw.value.startsWith('=') ? raw.value : null),
      format: raw.format,
    };
  };

  const range = (sheet, address) => {
    const [startAddress, endAddress = startAddress] = String(address).split(':');
    const start = parseReference(startAddress, sheet);
    const end = parseReference(endAddress, sheet);
    if (!start || !end) return null;
    const result = resolveRange(start, end);
    if (!isRange(result)) return null;
    return {
      sheet: start.sheet,
      address: `${startAddress}:${endAddress}`,
      values: result.values.map(row => row.map(item => isError(item) ? item.code : item)),
    };
  };

  const show = (cell, format = cell?.format) => {
    if (!cell) return '';
    const value = cell.value;
    return isError(value) ? value.code : formatNumber(value, format?.numberFormat || format);
  };

  const chartFromRange = (selectedRange, config = {}) => {
    if (!selectedRange?.values?.length) return null;
    const [header, ...rows] = selectedRange.values;
    if (!rows.length) return null;
    const labels = rows.map(row => String(row[0] ?? ''));
    let datasets = header.slice(1).map((label, index) => ({
      label: String(label || `Série ${index + 1}`),
      data: rows.map(row => {
        const value = Number(row[index + 1]);
        return Number.isFinite(value) ? value : null;
      }),
    }));
    if (config.type === 'pie') datasets = datasets.slice(0, 1);
    return { ...config, labels, datasets };
  };

  return {
    get,
    show,
    range,
    chartFromRange,
    evaluate: (formula, sheet = sheetNames[0]) => {
      const result = evaluateFormula(formula, sheet);
      return isError(result) ? result.code : result;
    },
    sheetNames,
    now: options.now,
  };
};

export { indexToColumn, columnToIndex };
