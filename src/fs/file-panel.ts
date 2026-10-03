import { listFiles, readFile, createFile, deleteFile } from './fsa';
import type { WorkspaceFile } from './fsa';

export interface FilePanelCallbacks {
  /** 用户点了一个文件，要把内容加载到画布 */
  onOpen: (name: string, content: string) => void;
  /** 用户点了"关闭文件夹" */
  onClose: () => void;
}

export function createFilePanel(
  rootEl: HTMLElement,
  callbacks: FilePanelCallbacks,
) {
  const titleEl = document.createElement('div');
  titleEl.className = 'file-panel-title';

  const listEl = document.createElement('div');
  listEl.className = 'file-list';

  const addBtn = document.createElement('button');
  addBtn.className = 'file-add';
  addBtn.textContent = '+ 新建文件';
  addBtn.addEventListener('click', async () => {
    const name = prompt('文件名（含扩展名，如 app.js）：', 'app.js');
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await createFile(trimmed);
      await render();
    } catch (e) {
      alert('新建失败：' + e);
    }
  });

  rootEl.innerHTML = '';
  rootEl.appendChild(titleEl);
  rootEl.appendChild(listEl);
  rootEl.appendChild(addBtn);

  let currentName: string | null = null;

  async function render() {
    listEl.innerHTML = '';
    const files = await listFiles();

    if (files.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'file-empty';
      empty.textContent = '（文件夹是空的）';
      listEl.appendChild(empty);
      return;
    }

    for (const f of files) {
      const row = document.createElement('div');
      row.className = 'file-item';
      if (f.name === currentName) row.classList.add('active');
      row.title = f.name;

      const label = document.createElement('span');
      label.className = 'file-name';
      label.textContent = f.name;

      const del = document.createElement('button');
      del.className = 'file-del';
      del.textContent = '✕';
      del.title = '删除这个文件';
      del.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('删除 "' + f.name + '"？此操作不可撤销。')) return;
        try {
          await deleteFile(f.name);
          if (currentName === f.name) currentName = null;
          await render();
        } catch (err) {
          alert('删除失败：' + err);
        }
      });

      row.appendChild(label);
      row.appendChild(del);
      row.addEventListener('click', async () => {
        try {
          const content = await readFile(f.handle);
          currentName = f.name;
          callbacks.onOpen(f.name, content);
          await render();
        } catch (err) {
          alert('读取失败：' + err);
        }
      });

      listEl.appendChild(row);
    }
  }

  function setRoot(name: string) {
    titleEl.textContent = name;
  }

  function clear() {
    titleEl.textContent = '';
    listEl.innerHTML = '';
  }

  return { render, setRoot, clear };
}

export type { WorkspaceFile };