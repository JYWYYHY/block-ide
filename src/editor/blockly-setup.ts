import * as Blockly from 'blockly/core';
import * as ZhHans from 'blockly/msg/zh-hans';
import 'blockly/blocks';
import { registerAllBlocks } from '../blocks';

export function createWorkspace(container: HTMLElement) {
  Blockly.setLocale(ZhHans as any);
  registerAllBlocks();

  const ws = Blockly.inject(container, {
    renderer: 'zelos',
    media: import.meta.env.BASE_URL + 'blockly-media/',
    toolbox: {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category', name: '输入输出', colour: '20',
          contents: [
            { kind: 'block', type: 'js_log' },
            { kind: 'block', type: 'js_show' },
            { kind: 'block', type: 'js_clear_page' },
            { kind: 'block', type: 'js_prompt' },
            { kind: 'block', type: 'js_alert' },
            { kind: 'block', type: 'js_confirm' },
          ],
        },
        {
          kind: 'category', name: '值', colour: '50',
          contents: [
            { kind: 'block', type: 'js_number' },
            { kind: 'block', type: 'js_text' },
            { kind: 'block', type: 'js_boolean' },
          ],
        },
        {
          kind: 'category', name: '变量', colour: '330',
          contents: [
            { kind: 'block', type: 'js_let' },
            { kind: 'block', type: 'js_set' },
            { kind: 'block', type: 'js_get' },
          ],
        },
        {
          kind: 'category', name: '运算', colour: '210',
          contents: [
            { kind: 'block', type: 'js_math' },
            { kind: 'block', type: 'js_compare' },
            { kind: 'block', type: 'js_logic' },
            { kind: 'block', type: 'js_not' },
          ],
        },
        {
          kind: 'category', name: '控制', colour: '120',
          contents: [
            { kind: 'block', type: 'js_if' },
            { kind: 'block', type: 'js_if_else' },
            { kind: 'block', type: 'js_repeat' },
            { kind: 'block', type: 'js_for' },
            { kind: 'block', type: 'js_while' },
          ],
        },
        {
          kind: 'category', name: '函数', colour: '290',
          contents: [
            { kind: 'block', type: 'js_func_def' },
            { kind: 'block', type: 'js_func_call' },
            { kind: 'block', type: 'js_func_call_value' },
            { kind: 'block', type: 'js_return' },
          ],
        },
        {
          kind: 'category', name: '数学', colour: '230',
          contents: [
            { kind: 'block', type: 'js_math_round' },
            { kind: 'block', type: 'js_math_minmax' },
            { kind: 'block', type: 'js_math_pow' },
            { kind: 'block', type: 'js_math_sqrt' },
            { kind: 'block', type: 'js_math_random' },
            { kind: 'block', type: 'js_math_pi' },
          ],
        },
        {
          kind: 'category', name: '文字', colour: '160',
          contents: [
            { kind: 'block', type: 'js_str_length' },
            { kind: 'block', type: 'js_str_includes' },
            { kind: 'block', type: 'js_str_charAt' },
            { kind: 'block', type: 'js_str_substring' },
            { kind: 'block', type: 'js_str_indexOf' },
            { kind: 'block', type: 'js_str_case' },
            { kind: 'block', type: 'js_str_trim' },
            { kind: 'block', type: 'js_str_replace' },
            { kind: 'block', type: 'js_str_split' },
            { kind: 'block', type: 'js_to_string' },
            { kind: 'block', type: 'js_to_number' },
          ],
        },
        {
          kind: 'category', name: '列表', colour: '260',
          contents: [
            { kind: 'block', type: 'js_arr_create' },
            { kind: 'block', type: 'js_arr_push' },
            { kind: 'block', type: 'js_arr_get' },
            { kind: 'block', type: 'js_arr_set' },
            { kind: 'block', type: 'js_arr_length' },
            { kind: 'block', type: 'js_arr_remove' },
            { kind: 'block', type: 'js_arr_sort' },
            { kind: 'block', type: 'js_arr_reverse' },
            { kind: 'block', type: 'js_arr_includes' },
            { kind: 'block', type: 'js_arr_indexOf' },
            { kind: 'block', type: 'js_arr_join' },
            { kind: 'block', type: 'js_arr_slice' },
          ],
        },
        {
          kind: 'category', name: '对象', colour: '200',
          contents: [
            { kind: 'block', type: 'js_obj_create' },
            { kind: 'block', type: 'js_obj_get' },
            { kind: 'block', type: 'js_obj_set' },
            { kind: 'block', type: 'js_obj_keys' },
            { kind: 'block', type: 'js_obj_has' },
            { kind: 'block', type: 'js_json_stringify' },
            { kind: 'block', type: 'js_json_parse' },
          ],
        },
        {
          kind: 'category', name: '时间', colour: '40',
          contents: [
            { kind: 'block', type: 'js_now' },
            { kind: 'block', type: 'js_date_str' },
            { kind: 'block', type: 'js_date_part' },
          ],
        },
        {
          kind: 'category', name: '高级', colour: '0',
          contents: [{ kind: 'block', type: 'js_raw' }],
        },
      ],
    },
    grid: { spacing: 20, length: 3, colour: '#333', snap: true },
    zoom: { controls: true, wheel: true, startScale: 0.6, minScale: 0.2 },
    trashcan: true,
    sounds: false,
    theme: Blockly.Themes.Classic,
  });

  return ws;
}