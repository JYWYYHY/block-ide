import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export function registerIoBlocks() {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'js_prompt',
      message0: '读取用户输入 %1',
      args0: [{ type: 'field_input', name: 'MSG', text: '请输入' }],
      output: 'String',
      colour: 20,
      tooltip: '弹出输入框，让用户打字',
    },
    {
      type: 'js_alert',
      message0: '弹出提示 %1',
      args0: [{ type: 'input_value', name: 'VAL' }],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
    {
      type: 'js_confirm',
      message0: '弹窗询问 %1',
      args0: [{ type: 'input_value', name: 'VAL' }],
      output: 'Boolean',
      colour: 20,
      tooltip: '用户点"确定"返回真，否则返回假',
    },
    {
      type: 'js_show',
      message0: '在页面显示 %1',
      args0: [{ type: 'input_value', name: 'VAL' }],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
      tooltip: '把内容写进右边的预览页面（不弹窗）',
    },
    {
      type: 'js_clear_page',
      message0: '清空页面',
      args0: [],
      previousStatement: null,
      nextStatement: null,
      colour: 20,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_prompt'] = (b) => {
    const msg = JSON.stringify(b.getFieldValue('MSG') || '');
    return [`prompt(${msg})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_alert'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || '""';
    return `alert(${v});\n`;
  };
  g.forBlock['js_confirm'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || '""';
    return [`confirm(${v})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_show'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.NONE) || '""';
    return `__show(${v});\n`;
  };
  g.forBlock['js_clear_page'] = () => '__clearPage();\n';
}