import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export function registerObjectBlocks() {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'js_obj_create',
      message0: '创建空对象',
      args0: [],
      output: 'Object',
      colour: 200,
    },
    {
      type: 'js_obj_get',
      message0: '%1 的 %2',
      args0: [
        { type: 'input_value', name: 'OBJ' },
        { type: 'field_input', name: 'KEY', text: '名字' },
      ],
      output: null,
      colour: 200,
    },
    {
      type: 'js_obj_set',
      message0: '把 %1 的 %2 设为 %3',
      args0: [
        { type: 'input_value', name: 'OBJ' },
        { type: 'field_input', name: 'KEY', text: '名字' },
        { type: 'input_value', name: 'VAL' },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 200,
    },
    {
      type: 'js_obj_keys',
      message0: '%1 的所有字段名',
      args0: [{ type: 'input_value', name: 'OBJ' }],
      output: 'Array',
      colour: 200,
    },
    {
      type: 'js_obj_has',
      message0: '%1 有字段 %2',
      args0: [
        { type: 'input_value', name: 'OBJ' },
        { type: 'field_input', name: 'KEY', text: '名字' },
      ],
      output: 'Boolean',
      colour: 200,
    },
    {
      type: 'js_json_stringify',
      message0: '把 %1 转成 JSON 文字',
      args0: [{ type: 'input_value', name: 'VAL' }],
      output: 'String',
      colour: 200,
    },
    {
      type: 'js_json_parse',
      message0: '把 JSON 文字 %1 解析成数据',
      args0: [{ type: 'input_value', name: 'VAL' }],
      output: null,
      colour: 200,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_obj_create'] = () => ['{}', Order.ATOMIC];
  g.forBlock['js_obj_get'] = (b, gen) => {
    const o = gen.valueToCode(b, 'OBJ', Order.MEMBER) || '{}';
    const k = b.getFieldValue('KEY') || '';
    return [`(${o})[${JSON.stringify(k)}]`, Order.MEMBER];
  };
  g.forBlock['js_obj_set'] = (b, gen) => {
    const o = gen.valueToCode(b, 'OBJ', Order.MEMBER) || '{}';
    const k = b.getFieldValue('KEY') || '';
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || 'undefined';
    return `(${o})[${JSON.stringify(k)}] = ${v};\n`;
  };
  g.forBlock['js_obj_keys'] = (b, gen) => {
    const o = gen.valueToCode(b, 'OBJ', Order.MEMBER) || '{}';
    return [`Object.keys(${o})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_obj_has'] = (b, gen) => {
    const o = gen.valueToCode(b, 'OBJ', Order.MEMBER) || '{}';
    const k = JSON.stringify(b.getFieldValue('KEY') || '');
    return [`(${k} in (${o}))`, Order.ATOMIC];
  };
  g.forBlock['js_json_stringify'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || 'null';
    return [`JSON.stringify(${v})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_json_parse'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || '""';
    return [`JSON.parse(${v})`, Order.FUNCTION_CALL];
  };
}