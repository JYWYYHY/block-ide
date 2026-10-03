import './style.css';
import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import { createWorkspace } from './editor/blockly-setup';
import { createVariablePanel } from './editor/variable-panel';
import { Preview } from './preview/iframe';
import { attachAutosave, loadSavedWorkspace, WORKSPACE_KEY } from './storage/autosave';
import { dbDelete } from './storage/db';
import { downloadText, pickFile, askFilename } from './io/file-io';
import { isSupported, openFolder, getRootName, writeFile, createFile } from './fs/fsa';
import { createFilePanel } from './fs/file-panel';

const blocklyHost = document.getElementById('blockly-host')!;
const previewWrap = document.getElementById('preview-wrap')!;
const consoleEl = document.getElementById('console')!;
const codeView = document.getElementById('code-view') as HTMLPreElement;
const btnRun = document.getElementById('btn-run')!;
const btnClear = document.getElementById('btn-clear')!;
const btnOpenFolder = document.getElementById('btn-open-folder')!;
const btnExportJs = document.getElementById('btn-export-js')!;
const btnExportProj = document.getElementById('btn-export-proj')!;
const btnImport = document.getElementById('btn-import')!;
const varList = document.getElementById('var-list')!;
const varAdd = document.getElementById('var-add') as HTMLButtonElement;
const filePanelEl = document.getElementById('file-panel')!;

const ws = createWorkspace(blocklyHost);
const preview = new Preview(previewWrap, consoleEl);
createVariablePanel(ws, varList, varAdd);

// ============================================================
// 文件面板
// ============================================================
const filePanel = createFilePanel(filePanelEl, {
  onOpen: (name, content) => {
    loadFileIntoCanvas(name, content);
  },
  onClose: () => {
    filePanelEl.hidden = true;
  },
});

/** 当前打开的文件名（用于自动保存写回），null 表示没打开文件夹 */
let currentFileName: string | null = null;
/** 当前文件对应的 handle */
let currentFileHandle: FileSystemFileHandle | null = null;

async function loadFileIntoCanvas(name: string, content: string) {
  const lower = name.toLowerCase();
  currentFileName = name;

  Blockly.Events.disable();
  ws.clear();
  Blockly.Events.enable();

  // 记录当前的 handle（先查，再决定怎么加载）
  const { listFiles } = await import('./fs/fsa');
  const files = await listFiles();
  const found = files.find((f) => f.name === name);
  currentFileHandle = found ? found.handle : null;

  // 空文件 → 画布留空，不要塞空积木块
  if (!content.trim()) {
    updateCodeView();
    return;
  }

  if (lower.endsWith('.json')) {
    // 工程文件：直接恢复
    try {
      const state = JSON.parse(content);
      Blockly.Events.disable();
      ws.clear();
      Blockly.Events.enable();
      Blockly.serialization.workspaces.load(state as object, ws);
    } catch (e) {
      alert('JSON 解析失败：' + e);
    }
  } else if (lower.endsWith('.js')) {
    // .js 文件：走解析器，尽量还原成积木块
    const { parseJsToBlocks } = await import('./io/js-parser');
    const { json, warnings } = parseJsToBlocks(content);

    try {
      Blockly.serialization.workspaces.load(json as object, ws);
    } catch (e) {
      console.error('解析失败，回退到原生 JS 块：', e);
      // 解析失败兜底：整段塞进原生 JS
      const block = ws.newBlock('js_raw');
      block.initSvg();
      const f = block.getField('CODE');
      if (f) f.setValue(content);
      block.render();
      block.moveBy(40, 40);
    }

    if (warnings.length > 0) {
      console.warn(
        `[导入] ${name} 有 ${warnings.length} 处无法还原：`,
        warnings,
      );
    }
  } else {
    // .html / .css 等：暂时塞进"原生 JS"（以后会换成对应的积木块）
    const block = ws.newBlock('js_raw');
    block.initSvg();
    const f = block.getField('CODE');
    if (f) f.setValue(content);
    block.render();
    block.moveBy(40, 40);
  }

  updateCodeView();
}

/** 把画布内容写回当前文件 */
async function saveCurrentFile() {
  if (!currentFileHandle || !currentFileName) return;
  const lower = currentFileName.toLowerCase();
  let content: string;

  if (lower.endsWith('.json')) {
    content = JSON.stringify(
      Blockly.serialization.workspaces.save(ws),
      null,
      2,
    );
  } else {
    const raw = javascriptGenerator.workspaceToCode(ws);
    content = cleanGeneratedCode(raw) + '\n';
  }

  try {
    await writeFile(currentFileHandle, content);
  } catch (e) {
    console.error('[文件] 自动保存失败：', e);
  }
}

// 打开文件夹
btnOpenFolder.addEventListener('click', async () => {
  if (!isSupported()) {
    alert(
      '你的浏览器不支持"打开文件夹"功能。\n' +
      '请使用 Chrome 或 Edge 最新版。',
    );
    return;
  }
  try {
    await openFolder();
    filePanelEl.hidden = false;
    filePanel.setRoot(getRootName() ?? '工作区');
    await filePanel.render();
  } catch (e: any) {
    if (e?.name === 'AbortError') return;  // 用户取消
    alert('打开文件夹失败：' + e);
  }
});

// ============================================================
// 尺寸自适应
// ============================================================
const resize = () => Blockly.svgResize(ws);
window.addEventListener('resize', resize);
new ResizeObserver(resize).observe(blocklyHost);

// ============================================================
// 标签页
// ============================================================
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

// ============================================================
// 代码生成 + 后处理
// ============================================================
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

  // 代码视图防抖更新
  if (codeTimer !== null) clearTimeout(codeTimer);
  codeTimer = window.setTimeout(updateCodeView, 300);

  // 如果打开了文件夹里的文件，自动写回（防抖 1 秒）
  if (currentFileHandle) {
    if (fileSaveTimer !== null) clearTimeout(fileSaveTimer);
    fileSaveTimer = window.setTimeout(saveCurrentFile, 1000);
  }
});
let fileSaveTimer: number | null = null;

// ============================================================
// 运行 / 清空
// ============================================================
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

// ============================================================
// 导出 JS / 工程
// ============================================================
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

// ============================================================
// 导入
// ============================================================
btnImport.addEventListener('click', async () => {
  const file = await pickFile('.js,.json,.blocks.json,application/json,text/javascript');
  if (!file) return;

  const text = await file.text();
  const isJson = file.name.toLowerCase().endsWith('.json');

  if (isJson) {
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

  // JS 文件：尝试解析成积木块
  if (!confirm('导入会覆盖当前画布，继续吗？')) return;

  const { parseJsToBlocks } = await import('./io/js-parser');
  const { json, warnings } = parseJsToBlocks(text);

  Blockly.Events.disable();
  ws.clear();
  Blockly.Events.enable();

  try {
    Blockly.serialization.workspaces.load(json as object, ws);
  } catch (e) {
    alert('积木块加载失败：\n' + e);
    return;
  }

  updateCodeView();

  if (warnings.length > 0) {
    // 有看不懂的部分，弹个提示
    const head = warnings.slice(0, 5).join('\n');
    const more = warnings.length > 5 ? `\n……还有 ${warnings.length - 5} 条` : '';
    alert(
      `导入完成，但有 ${warnings.length} 处代码无法还原成积木块，\n` +
      `已用"原生 JS"积木块保留：\n\n${head}${more}`,
    );
  }
});

// ============================================================
// 启动
// ============================================================
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