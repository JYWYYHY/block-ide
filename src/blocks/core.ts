import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

const ROUND = 2;
const HEX = 1;

export function registerCoreBlocks() {
  Blockly.common.defineBlocksWithJsonArray([

    // ===== 值 =====
    {
      type: 'js_number',
      message0: '%1',
      args0: [{ type: 'field_number', name: 'VAL', value: 0 }],
      output: 'Number',
      outputShape: 2,
      colour: 50,
    },
    {
      type: 'js_text',
      message0: '"%1"',
      args0: [{ type: 'field_input', name: 'VAL', text: '' }],
      output: 'String',
      outputShape: 2,
      colour: 50,
    },
    {
      type: 'js_boolean',
      message0: '%1',
      args0: [{
        type: 'field_dropdown', name: 'VAL',
        options: [['真', 'true'], ['假', 'false']],
      }],
      output: 'Boolean',
      outputShape: 1,
      colour: 50,
    },

    // ===== 变量 =====
    {
      type: 'js_let',
      message0: '创建变量 %1 = %2',
      args0: [
        { type: 'field_input', name: 'NAME', text: 'x' },
        { type: 'input_value', name: 'VALUE' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 330,
    },
    {
      type: 'js_set',
      message0: '把 %1 设为 %2',
      args0: [
        { type: 'field_input', name: 'NAME', text: 'x' },
        { type: 'input_value', name: 'VALUE' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 330,
    },
    {
      type: 'js_get',
      message0: '变量 %1',
      args0: [{ type: 'field_input', name: 'NAME', text: 'x' }],
      output: null,
      outputShape: 2,
      colour: 330,
    },

    // ===== 输出 =====
    {
      type: 'js_log',
      message0: '打印 %1',
      args0: [{ type: 'input_value', name: 'VAL' }],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },

    // ===== 运算 =====
    {
      type: 'js_math',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        {
          type: 'field_dropdown', name: 'OP',
          options: [['+', '+'], ['-', '-'], ['×', '*'], ['÷', '/'], ['%', '%']],
        },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      outputShape: 2,
      colour: 210,
    },
    {
      type: 'js_compare',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A' },
        {
          type: 'field_dropdown', name: 'OP',
          options: [
            ['=', '==='], ['≠', '!=='],
            ['<', '<'], ['>', '>'],
            ['≤', '<='], ['≥', '>='],
          ],
        },
        { type: 'input_value', name: 'B' },
      ],
      inputsInline: true,
      output: 'Boolean',
      outputShape: 1,
      colour: 210,
    },
    {
      type: 'js_logic',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Boolean' },
        {
          type: 'field_dropdown', name: 'OP',
          options: [['且', '&&'], ['或', '||']],
        },
        { type: 'input_value', name: 'B', check: 'Boolean' },
      ],
      inputsInline: true,
      output: 'Boolean',
      outputShape: 1,
      colour: 210,
    },
    {
      type: 'js_not',
      message0: '%1 不成立',
      args0: [{ type: 'input_value', name: 'VAL', check: 'Boolean' }],
      output: 'Boolean',
      outputShape: 1,
      colour: 210,
    },

    // ===== 控制 =====
    {
      type: 'js_if',
      message0: '如果 %1',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '那么 %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: 'js_if_else',
      message0: '如果 %1',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '那么 %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      message2: '否则 %1',
      args2: [{ type: 'input_statement', name: 'ELSE' }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: 'js_repeat',
      message0: '重复 %1 次',
      args0: [{ type: 'input_value', name: 'N', check: 'Number' }],
      message1: '做 %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: 'js_for',
      message0: '重复 %1 从 %2 到 %3',
      args0: [
        { type: 'field_input', name: 'VAR', text: 'i' },
        { type: 'input_value', name: 'FROM', check: 'Number' },
        { type: 'input_value', name: 'TO', check: 'Number' },
      ],
      message1: '做 %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },
    {
      type: 'js_while',
      message0: '当 %1 时',
      args0: [{ type: 'input_value', name: 'COND', check: 'Boolean' }],
      message1: '重复 %1',
      args1: [{ type: 'input_statement', name: 'DO' }],
      previousStatement: null,
      nextStatement: null,
      colour: 120,
    },

    // ===== 高级 =====
    {
      type: 'js_raw',
      message0: '原生 JS %1',
      args0: [{ type: 'field_input', name: 'CODE', text: '' }],
      previousStatement: null,
      nextStatement: null,
      colour: 0,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_number']  = (b) => [String(b.getFieldValue('VAL')), Order.ATOMIC];
  g.forBlock['js_text']    = (b) => [`"${b.getFieldValue('VAL')}"`, Order.ATOMIC];
  g.forBlock['js_boolean'] = (b) => [b.getFieldValue('VAL'), Order.ATOMIC];

  g.forBlock['js_let'] = (b, gen) => {
    const name = safeVarName(b.getFieldValue('NAME'));
    const val = gen.valueToCode(b, 'VALUE', Order.ASSIGNMENT) || 'undefined';
    return `let ${name} = ${val};\n`;
  };
  g.forBlock['js_set'] = (b, gen) => {
    const name = safeVarName(b.getFieldValue('NAME'));
    const val = gen.valueToCode(b, 'VALUE', Order.ASSIGNMENT) || 'undefined';
    return `${name} = ${val};\n`;
  };
  g.forBlock['js_get'] = (b) => [safeVarName(b.getFieldValue('NAME')), Order.ATOMIC];

  g.forBlock['js_log'] = (b, gen) => {
    const val = gen.valueToCode(b, 'VAL', Order.NONE) || 'undefined';
    return `console.log(${val});\n`;
  };

  g.forBlock['js_math'] = (b, gen) => {
    const op = b.getFieldValue('OP');
    const a = gen.valueToCode(b, 'A', Order.ADDITION) || '0';
    const c = gen.valueToCode(b, 'B', Order.ADDITION) || '0';
    return [`${a} ${op} ${c}`, Order.ADDITION];
  };
  g.forBlock['js_compare'] = (b, gen) => {
    const op = b.getFieldValue('OP');
    const a = gen.valueToCode(b, 'A', Order.EQUALITY) || '0';
    const c = gen.valueToCode(b, 'B', Order.EQUALITY) || '0';
    return [`${a} ${op} ${c}`, Order.EQUALITY];
  };
  g.forBlock['js_logic'] = (b, gen) => {
    const op = b.getFieldValue('OP');
    const a = gen.valueToCode(b, 'A', Order.LOGICAL_AND) || 'false';
    const c = gen.valueToCode(b, 'B', Order.LOGICAL_AND) || 'false';
    return [`${a} ${op} ${c}`, Order.LOGICAL_AND];
  };
  g.forBlock['js_not'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.UNARY_PREFIX) || 'false';
    return [`!(${v})`, Order.UNARY_PREFIX];
  };

  g.forBlock['js_if'] = (b, gen) => {
    const cond = gen.valueToCode(b, 'COND', Order.NONE) || 'false';
    const body = gen.statementToCode(b, 'DO');
    return `if (${cond}) {\n${body}}\n`;
  };
  g.forBlock['js_if_else'] = (b, gen) => {
    const cond = gen.valueToCode(b, 'COND', Order.NONE) || 'false';
    const doBody = gen.statementToCode(b, 'DO');
    const elseBody = gen.statementToCode(b, 'ELSE');
    return `if (${cond}) {\n${doBody}} else {\n${elseBody}}\n`;
  };
  g.forBlock['js_repeat'] = (b, gen) => {
    const n = gen.valueToCode(b, 'N', Order.NONE) || '0';
    const body = gen.statementToCode(b, 'DO');
    return `for (let _i = 0; _i < ${n}; _i++) {\n${body}}\n`;
  };
  g.forBlock['js_for'] = (b, gen) => {
    const v = safeVarName(b.getFieldValue('VAR'));
    const from = gen.valueToCode(b, 'FROM', Order.NONE) || '0';
    const to = gen.valueToCode(b, 'TO', Order.NONE) || '0';
    const body = gen.statementToCode(b, 'DO');
    return `for (let ${v} = ${from}; ${v} <= ${to}; ${v}++) {\n${body}}\n`;
  };
  g.forBlock['js_while'] = (b, gen) => {
    const cond = gen.valueToCode(b, 'COND', Order.NONE) || 'false';
    const body = gen.statementToCode(b, 'DO');
    return `while (${cond}) {\n${body}}\n`;
  };

  g.forBlock['js_raw'] = (b) => {
    const code = b.getFieldValue('CODE') || '';
    return code.endsWith('\n') ? code : code + '\n';
  };
}

function safeVarName(name: string): string {
  if (!name) return '_';
  let s = name.replace(/\s+/g, '_').replace(/[^\w$\u0080-\uFFFF]/g, '_');
  if (/^\d/.test(s)) s = '_' + s;
  return s;
}