import './style.css';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { createWorkspace } from './editor/blockly-setup';
import { createVariablePanel } from './editor/variable-panel';
import { Preview } from './preview/iframe';
import { attachAutosave, loadSavedWorkspace, WORKSPACE_KEY } from './storage/autosave';
import { dbDelete } from './storage/db';

const blocklyHost = document.getElementById('blockly-host')!;
const previewWrap = document.getElementById('preview-wrap')!;
const consoleEl = document.getElementById('console')!;
const codeView = document.getElementById('code-view') as HTMLPreElement;
const btnRun = document.getElementById('btn-run')!;
const btnClear = document.getElementById('btn-clear')!;
const varList = document.getElementById('var-list')!;
const varAdd = document.getElementById('var-add') as HTMLButtonElement;

const ws = createWorkspace(blocklyHost);
const preview = new Preview(previewWrap, consoleEl);
createVariablePanel(ws, varList, varAdd);

// ---------- 尺寸自适应 ----------
const resize = () => Blockly.svgResize(ws);
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(blocklyHost);

// ---------- 标签页切换 ----------
const tabs = document.querySelectorAll<HTMLButtonElement>('#tab-bar .tab');
const codeWrap = document.getElementById('code-wrap')!;
tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab as 'preview' | 'code');
  });
});

function switchTab(which: 'preview' | 'code') {
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === which));
  if (which === 'code') {
    previewWrap.hidden = true;
    codeWrap.hidden = false;
    updateCodeView();
  } else {
    previewWrap.hidden = false;
    codeWrap.hidden = true;
  }
}

// ---------- 代码生成 + 后处理 ----------

/**
 * 把生成的 JS 做两件事：
 *
 * 1. 还原被 Blockly 转义的标识符：_E6_89_93 → "打"。
 *    Blockly 默认假设目标语言不支持 Unicode 标识符，
 *    把非 ASCII 字符的每个 UTF-8 字节转成 _HH 形式。
 *    但现代 JS 完全支持中文标识符，所以还原回来。
 *
 * 2. 删掉 Blockly 自动插入的顶层 "var x;" 行。
 *    这些是给变量/参数做"前置声明"用的，但我们的代码里
 *    变量由"创建变量"积木块自己声明，重复声明会报错。
 */
function cleanGeneratedCode(code: string): string {
  // 1. 还原 _HH 转义
  let out = code.replace(/(?:_[0-9A-Fa-f]{2})+/g, (match) => {
    try {
      const bytes = match.slice(1).split('_').map((h) => parseInt(h, 16));
      const text = new TextDecoder('utf-8', { fatal: true }).decode(
        new Uint8Array(bytes),
      );
      // 只还原成合法的标识符字符（字母、数字、下划线、$、以及非 ASCII）
      if (/^[\w$\u0080-\uFFFF]+$/.test(text)) return text;
      return match;
    } catch {
      return match;
    }
  });

  // 2. 删掉顶层单独的 "var 某标识符;" 行
  out = out.replace(/^var\s+[\w$\u0080-\uFFFF]+\s*;\s*$/gm, '');

  // 3. 清掉连续空行
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trim();
}

let codeTimer: number | null = null;

function updateCodeView() {
  const raw = javascriptGenerator.workspaceToCode(ws);
  const clean = cleanGeneratedCode(raw);
  codeView.textContent = clean || '// 画布为空';
}

ws.addChangeListener((e: Blockly.Events.Abstract) => {
  if (e.isUiEvent) return;
  if (codeTimer !== null) clearTimeout(codeTimer);
  codeTimer = window.setTimeout(updateCodeView, 300);
});

// ---------- 运行 / 清空 ----------
btnRun.addEventListener('click', () => {
  const raw = javascriptGenerator.workspaceToCode(ws);
  const clean = cleanGeneratedCode(raw);
  console.log('--- 生成的代码 ---\n' + clean);
  updateCodeView();

  switchTab('preview');
  preview.run(clean);
});

btnClear.addEventListener('click', async () => {
  if (!confirm('确定清空当前工作区吗？此操作不可撤销。')) return;
  Blockly.Events.disable();
  ws.clear();
  Blockly.Events.enable();
  updateCodeView();
  await dbDelete(WORKSPACE_KEY);
});

// ---------- 启动 ----------
(async () => {
  const restored = await loadSavedWorkspace(ws);
  if (!restored) {
    loadDemo(ws);
  }
  attachAutosave(ws);
  updateCodeView();
})();

function loadDemo(ws: Blockly.WorkspaceSvg) {
  Blockly.serialization.workspaces.load(
    {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'js_for',
            fields: { VAR: 'i' },
            inputs: {
              FROM: { block: { type: 'js_number', fields: { VAL: 1 } } },
              TO: { block: { type: 'js_number', fields: { VAL: 5 } } },
              DO: {
                block: {
                  type: 'js_log',
                  inputs: {
                    VAL: { block: { type: 'js_get', fields: { NAME: 'i' } } },
                  },
                },
              },
            },
          },
        ],
      },
    },
    ws,
  );
}