import './style.css';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { createWorkspace } from './editor/blockly-setup';
import { createVariablePanel } from './editor/variable-panel';
import { Preview } from './preview/iframe';
import { attachAutosave, loadSavedWorkspace, WORKSPACE_KEY } from './storage/autosave';
import { dbDelete } from './storage/db';
import { downloadText, pickFile, askFilename } from './io/file-io';

const blocklyHost = document.getElementById('blockly-host')!;
const previewWrap = document.getElementById('preview-wrap')!;
const consoleEl = document.getElementById('console')!;
const codeView = document.getElementById('code-view') as HTMLPreElement;
const btnRun = document.getElementById('btn-run')!;
const btnClear = document.getElementById('btn-clear')!;
const btnExportJs = document.getElementById('btn-export-js')!;
const btnExportProj = document.getElementById('btn-export-proj')!;
const btnImport = document.getElementById('btn-import')!;
const varList = document.getElementById('var-list')!;
const varAdd = document.getElementById('var-add') as HTMLButtonElement;

const ws = createWorkspace(blocklyHost);
const preview = new Preview(previewWrap, consoleEl);
createVariablePanel(ws, varList, varAdd);

// ---------- 尺寸自适应 ----------
const resize = () => Blockly.svgResize(ws);
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(blocklyHost);

// ---------- 标签页 ----------
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
function cleanGeneratedCode(code: string): string {
  let out = code.replace(/(?:_[0-9A-Fa-f]{2})+/g, (match) => {
    try {
      const bytes = match.slice(1).split('_').map((h) => parseInt(h, 16));
      const text = new TextDecoder('utf-8', { fatal: true }).decode(
        new Uint8Array(bytes),
      );
      if (/^[\w$\u0080-\uFFFF]+$/.test(text)) return text;
      return match;
    } catch {
      return match;
    }
  });
  out = out.replace(/^var\s+[\w$\u0080-\uFFFF]+\s*;\s*$/gm, '');
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

// ---------- 导出 JS ----------
btnExportJs.addEventListener('click', () => {
  const raw = javascriptGenerator.workspaceToCode(ws);
  const clean = cleanGeneratedCode(raw);
  if (!clean.trim()) {
    alert('画布是空的，没有代码可以导出');
    return;
  }
  const name = askFilename('main.js');
  if (!name) return;
  const filename = name.endsWith('.js') ? name : name + '.js';
  downloadText(filename, clean + '\n', 'text/javascript;charset=utf-8');
});

// ---------- 导出工程（完整积木结构，可重新导入） ----------
btnExportProj.addEventListener('click', () => {
  const state = Blockly.serialization.workspaces.save(ws);
  const name = askFilename('main.blocks.json');
  if (!name) return;
  const filename = name.endsWith('.json') ? name : name + '.blocks.json';
  downloadText(
    filename,
    JSON.stringify(state, null, 2),
    'application/json;charset=utf-8',
  );
});

// ---------- 导入 ----------
btnImport.addEventListener('click', async () => {
  const file = await pickFile('.js,.json,.blocks.json,application/json,text/javascript');
  if (!file) return;

  const text = await file.text();
  const isJson = file.name.toLowerCase().endsWith('.json');

  if (isJson) {
    // 工程文件 → 恢复画布
    let state: unknown;
    try {
      state = JSON.parse(text);
    } catch (e) {
      alert('工程文件不是合法的 JSON：\n' + e);
      return;
    }
    if (!confirm('导入工程会覆盖当前画布，继续吗？')) return;
    Blockly.Events.disable();
    ws.clear();
    Blockly.Events.enable();
    try {
      Blockly.serialization.workspaces.load(state as object, ws);
      updateCodeView();
    } catch (e) {
      alert('工程文件解析失败：\n' + e);
    }
    return;
  }

  // .js 文件 → 塞进"原生 JS"积木块
  if (!confirm(
    'JS 文件无法自动还原成积木块。\n' +
    '是否把它整体作为一个"原生 JS"积木块放到画布上？\n' +
    '（当前画布会被清空，可用 Ctrl+Z 撤销）',
  )) return;

  Blockly.Events.disable();
  ws.clear();
  Blockly.Events.enable();

  const block = ws.newBlock('js_raw');
  block.initSvg();
  const field = block.getField('CODE');
  if (field) field.setValue(text);
  block.render();
  block.moveBy(40, 40);

  updateCodeView();
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