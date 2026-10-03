import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export function registerStringBlocks() {
  Blockly.common.defineBlocksWithJsonArray([

    {
      type: 'js_str_length',
      message0: '%1 的长度',
      args0: [{ type: 'input_value', name: 'VAL' }],
      output: 'Number',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_str_includes',
      message0: '%1 包含 %2',
      args0: [
        { type: 'input_value', name: 'A', check: 'String' },
        { type: 'input_value', name: 'B', check: 'String' },
      ],
      inputsInline: true,
      output: 'Boolean',
      outputShape: 1,
      colour: 160,
    },
    {
      type: 'js_str_charAt',
      message0: '%1 的第 %2 个字符',
      args0: [
        { type: 'input_value', name: 'A', check: 'String' },
        { type: 'input_value', name: 'N', check: 'Number' },
      ],
      inputsInline: true,
      output: 'String',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_str_substring',
      message0: '%1 的第 %2 到 %3 个字符',
      args0: [
        { type: 'input_value', name: 'STR', check: 'String' },
        { type: 'input_value', name: 'FROM', check: 'Number' },
        { type: 'input_value', name: 'TO', check: 'Number' },
      ],
      inputsInline: true,
      output: 'String',
      outputShape: 2,
      colour: 160,
      tooltip: '含起点，不含终点',
    },
    {
      type: 'js_str_indexOf',
      message0: '%1 中 %2 的位置',
      args0: [
        { type: 'input_value', name: 'STR', check: 'String' },
        { type: 'input_value', name: 'SUB', check: 'String' },
      ],
      inputsInline: true,
      output: 'Number',
      outputShape: 2,
      colour: 160,
      tooltip: '找不到返回 0',
    },
    {
      type: 'js_str_case',
      message0: '把 %1 变成 %2',
      args0: [
        { type: 'input_value', name: 'VAL', check: 'String' },
        {
          type: 'field_dropdown', name: 'OP',
          options: [['全大写', 'toUpperCase'], ['全小写', 'toLowerCase']],
        },
      ],
      inputsInline: true,
      output: 'String',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_str_trim',
      message0: '去掉 %1 两端的空格',
      args0: [{ type: 'input_value', name: 'VAL', check: 'String' }],
      output: 'String',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_str_replace',
      message0: '把 %1 里的 %2 换成 %3',
      args0: [
        { type: 'input_value', name: 'STR', check: 'String' },
        { type: 'input_value', name: 'FROM', check: 'String' },
        { type: 'input_value', name: 'TO', check: 'String' },
      ],
      inputsInline: true,
      output: 'String',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_str_split',
      message0: '把 %1 按 %2 分割',
      args0: [
        { type: 'input_value', name: 'A', check: 'String' },
        { type: 'input_value', name: 'SEP', check: 'String' },
      ],
      inputsInline: true,
      output: 'Array',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_to_string',
      message0: '把 %1 转成文本',
      args0: [{ type: 'input_value', name: 'VAL' }],
      output: 'String',
      outputShape: 2,
      colour: 160,
    },
    {
      type: 'js_to_number',
      message0: '把 %1 转成数字',
      args0: [{ type: 'input_value', name: 'VAL' }],
      output: 'Number',
      outputShape: 2,
      colour: 160,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_str_length'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.MEMBER) || '""';
    return [`(${v}).length`, Order.MEMBER];
  };
  g.forBlock['js_str_includes'] = (b, gen) => {
    const a = gen.valueToCode(b, 'A', Order.MEMBER) || '""';
    const c = gen.valueToCode(b, 'B', Order.NONE) || '""';
    return [`(${a}).includes(${c})`, Order.MEMBER];
  };
  g.forBlock['js_str_charAt'] = (b, gen) => {
    const a = gen.valueToCode(b, 'A', Order.MEMBER) || '""';
    const n = gen.valueToCode(b, 'N', Order.ADDITION) || '1';
    return [`(${a}).charAt((${n}) - 1)`, Order.MEMBER];
  };
  g.forBlock['js_str_substring'] = (b, gen) => {
    const s = gen.valueToCode(b, 'STR', Order.MEMBER) || '""';
    const from = gen.valueToCode(b, 'FROM', Order.ADDITION) || '1';
    const to = gen.valueToCode(b, 'TO', Order.ADDITION) || '0';
    return [`(${s}).substring((${from}) - 1, (${to}))`, Order.MEMBER];
  };
  g.forBlock['js_str_indexOf'] = (b, gen) => {
    const s = gen.valueToCode(b, 'STR', Order.MEMBER) || '""';
    const sub = gen.valueToCode(b, 'SUB', Order.NONE) || '""';
    return [`((${s}).indexOf(${sub}) + 1)`, Order.ADDITION];
  };
  g.forBlock['js_str_case'] = (b, gen) => {
    const op = b.getFieldValue('OP');
    const v = gen.valueToCode(b, 'VAL', Order.MEMBER) || '""';
    return [`(${v}).${op}()`, Order.MEMBER];
  };
  g.forBlock['js_str_trim'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.MEMBER) || '""';
    return [`(${v}).trim()`, Order.MEMBER];
  };
  g.forBlock['js_str_replace'] = (b, gen) => {
    const s = gen.valueToCode(b, 'STR', Order.MEMBER) || '""';
    const from = gen.valueToCode(b, 'FROM', Order.NONE) || '""';
    const to = gen.valueToCode(b, 'TO', Order.NONE) || '""';
    return [`(${s}).split(${from}).join(${to})`, Order.MEMBER];
  };
  g.forBlock['js_str_split'] = (b, gen) => {
    const a = gen.valueToCode(b, 'A', Order.MEMBER) || '""';
    const sep = gen.valueToCode(b, 'SEP', Order.NONE) || '""';
    return [`(${a}).split(${sep})`, Order.MEMBER];
  };
  g.forBlock['js_to_string'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || 'undefined';
    return [`String(${v})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_to_number'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || '""';
    return [`Number(${v})`, Order.FUNCTION_CALL];
  };
}