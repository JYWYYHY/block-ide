import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

const ROUND = 2;
const HEX = 1;

export function registerArrayBlocks() {
  Blockly.common.defineBlocksWithJsonArray([

    {
      type: 'js_arr_create',
      message0: '创建空列表',
      args0: [],
      output: 'Array',
      outputShape: 2,
      colour: 260,
    },
    {
      type: 'js_arr_push',
      message0: '向 %1 添加 %2',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'ITEM' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: 'js_arr_get',
      message0: '%1 的第 %2 项',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'N', check: 'Number' },
      ],
      inputsInline: true,
      output: null,
      outputShape: 2,
      colour: 260,
    },
    {
      type: 'js_arr_set',
      message0: '把 %1 的第 %2 项设为 %3',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'N', check: 'Number' },
        { type: 'input_value', name: 'VAL' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: 'js_arr_length',
      message0: '%1 的项数',
      args0: [{ type: 'input_value', name: 'ARR', check: 'Array' }],
      output: 'Number',
      outputShape: 2,
      colour: 260,
    },
    {
      type: 'js_arr_remove',
      message0: '删除 %1 的第 %2 项',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'N', check: 'Number' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: 'js_arr_sort',
      message0: '把 %1 从小到大排序',
      args0: [{ type: 'input_value', name: 'ARR', check: 'Array' }],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: 'js_arr_reverse',
      message0: '把 %1 反转',
      args0: [{ type: 'input_value', name: 'ARR', check: 'Array' }],
      previousStatement: null,
      nextStatement: null,
      colour: 260,
    },
    {
      type: 'js_arr_includes',
      message0: '%1 包含 %2',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'ITEM' },
      ],
      inputsInline: true,
      output: 'Boolean',
      outputShape: HEX,
      colour: 260,
    },
    {
      type: 'js_arr_indexOf',
      message0: '%1 中 %2 的位置',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'ITEM' },
      ],
      inputsInline: true,
      output: 'Number',
      outputShape: 2,
      colour: 260,
    },
    {
      type: 'js_arr_join',
      message0: '把 %1 用 %2 连接',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'SEP', check: 'String' },
      ],
      inputsInline: true,
      output: 'String',
      outputShape: 2,
      colour: 260,
    },
    {
      type: 'js_arr_slice',
      message0: '%1 的第 %2 到 %3 项',
      args0: [
        { type: 'input_value', name: 'ARR', check: 'Array' },
        { type: 'input_value', name: 'FROM', check: 'Number' },
        { type: 'input_value', name: 'TO', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Array',
      outputShape: 2,
      colour: 260,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_arr_create'] = () => ['[]', Order.ATOMIC];
  g.forBlock['js_arr_push'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const item = gen.valueToCode(b, 'ITEM', Order.NONE) || 'undefined';
    return `(${arr}).push(${item});\n`;
  };
  g.forBlock['js_arr_get'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const n = gen.valueToCode(b, 'N', Order.ADDITION) || '1';
    return [`(${arr})[(${n}) - 1]`, Order.MEMBER];
  };
  g.forBlock['js_arr_set'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const n = gen.valueToCode(b, 'N', Order.ADDITION) || '1';
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || 'undefined';
    return `(${arr})[(${n}) - 1] = ${v};\n`;
  };
  g.forBlock['js_arr_length'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    return [`(${arr}).length`, Order.MEMBER];
  };
  g.forBlock['js_arr_remove'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const n = gen.valueToCode(b, 'N', Order.ADDITION) || '1';
    return `(${arr}).splice((${n}) - 1, 1);\n`;
  };
  g.forBlock['js_arr_sort'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    return `(${arr}).sort((a, b) => a - b);\n`;
  };
  g.forBlock['js_arr_reverse'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    return `(${arr}).reverse();\n`;
  };
  g.forBlock['js_arr_includes'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const item = gen.valueToCode(b, 'ITEM', Order.NONE) || 'undefined';
    return [`(${arr}).includes(${item})`, Order.MEMBER];
  };
  g.forBlock['js_arr_indexOf'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const item = gen.valueToCode(b, 'ITEM', Order.NONE) || 'undefined';
    return [`((${arr}).indexOf(${item}) + 1)`, Order.ADDITION];
  };
  g.forBlock['js_arr_join'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const sep = gen.valueToCode(b, 'SEP', Order.NONE) || '""';
    return [`(${arr}).join(${sep})`, Order.MEMBER];
  };
  g.forBlock['js_arr_slice'] = (b, gen) => {
    const arr = gen.valueToCode(b, 'ARR', Order.MEMBER) || '[]';
    const from = gen.valueToCode(b, 'FROM', Order.ADDITION) || '1';
    const to = gen.valueToCode(b, 'TO', Order.ADDITION) || '0';
    return [`(${arr}).slice((${from}) - 1, (${to}))`, Order.MEMBER];
  };
}