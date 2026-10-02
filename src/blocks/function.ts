import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export function registerFunctionBlocks() {
  Blockly.common.defineBlocksWithJsonArray([

    {
      type: 'js_func_def',
      message0: '定义函数 %1 ( %2 )',
      args0: [
        { type: 'field_input', name: 'NAME', text: '函数名' },
        { type: 'field_input', name: 'PARAMS', text: '' },
      ],
      message1: '做 %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: 290,
    },
    {
      type: 'js_func_call',
      message0: '%1 ( %2 , %3 , %4 )',
      args0: [
        { type: 'field_input', name: 'NAME', text: '函数名' },
        { type: 'input_value', name: 'A1' },
        { type: 'input_value', name: 'A2' },
        { type: 'input_value', name: 'A3' },
      ],
      inputsInline: true,
      previousStatement: null,
      nextStatement: null,
      colour: 290,
    },
    {
      type: 'js_func_call_value',
      message0: '%1 ( %2 , %3 , %4 )',
      args0: [
        { type: 'field_input', name: 'NAME', text: '函数名' },
        { type: 'input_value', name: 'A1' },
        { type: 'input_value', name: 'A2' },
        { type: 'input_value', name: 'A3' },
      ],
      inputsInline: true,
      output: null,
      outputShape: 2,
      colour: 290,
    },
    {
      type: 'js_return',
      message0: '返回 %1',
      args0: [{ type: 'input_value', name: 'VAL' }],
      previousStatement: null,
      colour: 290,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_func_def'] = (b, gen) => {
    const name = sanitize(b.getFieldValue('NAME')) || 'unnamed';
    const raw = String(b.getFieldValue('PARAMS') || '');
    const params = raw
      .split(/[,，]/)
      .map((s) => sanitize(s.trim()))
      .filter((s) => s !== '');

    let body = gen.statementToCode(b, 'DO');
    if (!body.trim()) body = '  \n';

    const code = `function ${name}(${params.join(', ')}) {\n${body}}`;

    const defs = (gen as unknown as { definitions_: Record<string, string> })
      .definitions_;
    defs['func_' + name] = code;

    return '';
  };

  g.forBlock['js_func_call'] = (b, gen) => {
    const name = sanitize(b.getFieldValue('NAME')) || 'unnamed';
    const args = collectArgs(b, gen);
    return `${name}(${args});\n`;
  };

  g.forBlock['js_func_call_value'] = (b, gen) => {
    const name = sanitize(b.getFieldValue('NAME')) || 'unnamed';
    const args = collectArgs(b, gen);
    return [`${name}(${args})`, Order.FUNCTION_CALL];
  };

  g.forBlock['js_return'] = (b, gen) => {
    const val = gen.valueToCode(b, 'VAL', Order.NONE) || 'undefined';
    return `return ${val};\n`;
  };
}

function collectArgs(b: Blockly.Block, gen: typeof javascriptGenerator): string {
  const out: string[] = [];
  for (const k of ['A1', 'A2', 'A3']) {
    const v = gen.valueToCode(b, k, Order.NONE);
    if (!v) break;
    out.push(v);
  }
  return out.join(', ');
}

function sanitize(name: string): string {
  if (!name) return '';
  const s = String(name).trim().replace(/\s+/g, '_');
  const cleaned = s.replace(/[^\w$\u0080-\uFFFF]/g, '_');
  return /^\d/.test(cleaned) ? '_' + cleaned : cleaned;
}