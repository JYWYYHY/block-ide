import * as Blockly from 'blockly/core';
import { javascriptGenerator, Order } from 'blockly/javascript';

export function registerMathBlocks() {
  Blockly.common.defineBlocksWithJsonArray([
    {
      type: 'js_math_round',
      message0: '%1 %2',
      args0: [
        { type: 'input_value', name: 'VAL', check: 'Number' },
        {
          type: 'field_dropdown', name: 'OP',
          options: [
            ['向下取整', 'floor'],
            ['向上取整', 'ceil'],
            ['四舍五入', 'round'],
            ['绝对值', 'abs'],
          ],
        },
      ],
      inputsInline: true,
      output: 'Number',
      
      colour: 230,
    },
    {
      type: 'js_math_minmax',
      message0: '%1 和 %2 中取 %3',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        { type: 'input_value', name: 'B', check: 'Number' },
        {
          type: 'field_dropdown', name: 'OP',
          options: [['较大值', 'max'], ['较小值', 'min']],
        },
      ],
      inputsInline: true,
      output: 'Number',
      
      colour: 230,
    },
    {
      type: 'js_math_pow',
      message0: '%1 的 %2 次方',
      args0: [
        { type: 'input_value', name: 'A', check: 'Number' },
        { type: 'input_value', name: 'B', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      
      colour: 230,
    },
    {
      type: 'js_math_sqrt',
      message0: '%1 的平方根',
      args0: [{ type: 'input_value', name: 'VAL', check: 'Number' }],
      output: 'Number',
      
      colour: 230,
    },
    {
      type: 'js_math_random',
      message0: '随机整数 从 %1 到 %2',
      args0: [
        { type: 'input_value', name: 'FROM', check: 'Number' },
        { type: 'input_value', name: 'TO', check: 'Number' },
      ],
      inputsInline: true,
      output: 'Number',
      
      colour: 230,
    },
    {
      type: 'js_math_pi',
      message0: '圆周率 π',
      output: 'Number',
      
      colour: 230,
    },
  ]);

  const g = javascriptGenerator;

  g.forBlock['js_math_round'] = (b, gen) => {
    const op = b.getFieldValue('OP');
    const v = gen.valueToCode(b, 'VAL', Order.FUNCTION_CALL) || '0';
    return [`Math.${op}(${v})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_math_minmax'] = (b, gen) => {
    const op = b.getFieldValue('OP');
    const a = gen.valueToCode(b, 'A', Order.NONE) || '0';
    const c = gen.valueToCode(b, 'B', Order.NONE) || '0';
    return [`Math.${op}(${a}, ${c})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_math_pow'] = (b, gen) => {
    const a = gen.valueToCode(b, 'A', Order.EXPONENTIATION) || '0';
    const c = gen.valueToCode(b, 'B', Order.EXPONENTIATION) || '0';
    return [`(${a}) ** (${c})`, Order.EXPONENTIATION];
  };
  g.forBlock['js_math_sqrt'] = (b, gen) => {
    const v = gen.valueToCode(b, 'VAL', Order.FUNCTION_CALL) || '0';
    return [`Math.sqrt(${v})`, Order.FUNCTION_CALL];
  };
  g.forBlock['js_math_random'] = (b, gen) => {
    const from = gen.valueToCode(b, 'FROM', Order.NONE) || '1';
    const to = gen.valueToCode(b, 'TO', Order.NONE) || '10';
    return [
      `Math.floor(Math.random() * ((${to}) - (${from}) + 1)) + (${from})`,
      Order.ADDITION,
    ];
  };
  g.forBlock['js_math_pi'] = () => ['Math.PI', Order.MEMBER];
}