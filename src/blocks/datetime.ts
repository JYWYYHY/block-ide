import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export function registerDatetimeBlocks() {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'js_now',
      message0: '当前时间戳',
      args0: [],
      output: 'Number',
      colour: 40,
      tooltip: '从 1970 年至今的毫秒数',
    },
    {
      type: 'js_date_str',
      message0: '当前日期时间',
      args0: [],
      output: 'String',
      colour: 40,
    },
    {
      type: 'js_date_part',
      message0: '当前的 %1',
      args0: [{
        type: 'field_dropdown', name: 'PART',
        options: [
          ['年', 'getFullYear'],
          ['月', 'getMonth'],
          ['日', 'getDate'],
          ['小时', 'getHours'],
          ['分钟', 'getMinutes'],
          ['秒', 'getSeconds'],
          ['星期', 'getDay'],
        ],
      }],
      output: 'Number',
      colour: 40,
      tooltip: '月份从 0 开始（0=一月）；星期从 0 开始（0=周日）',
    },
  ]);

  const g = javascriptGenerator;
  g.forBlock['js_now'] = () => ['Date.now()', Order.FUNCTION_CALL];
  g.forBlock['js_date_str'] = () => ['new Date().toLocaleString()', Order.FUNCTION_CALL];
  g.forBlock['js_date_part'] = (b) => {
    const part = b.getFieldValue('PART');
    return [`new Date().${part}()`, Order.FUNCTION_CALL];
  };
}