export class Preview {
  private wrap: HTMLElement;
  private consoleEl: HTMLElement;
  private iframe: HTMLIFrameElement | null = null;

  private onMessage = (e: MessageEvent) => {
    const d = e.data;
    if (!d || d.__blockide !== true) return;
    this.appendLog(d.level, d.args);
  };

  constructor(wrap: HTMLElement, consoleEl: HTMLElement) {
    this.wrap = wrap;
    this.consoleEl = consoleEl;
    window.addEventListener('message', this.onMessage);
  }

  run(userCode: string) {
    this.consoleEl.innerHTML = '';

    // 关键：每次运行都换一个全新的 iframe，
    // 避免上一次运行的全局作用域残留
    if (this.iframe) {
      this.iframe.remove();
    }
    const iframe = document.createElement('iframe');
    this.wrap.appendChild(iframe);
    this.iframe = iframe;

    const html = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body>
<script>
(function(){
  const send = (level, args) => parent.postMessage(
    { __blockide: true, level, args: args.map(String) }, '*'
  );
  ['log','warn','error','info'].forEach(k => {
    const orig = console[k];
    console[k] = (...a) => { send(k, a); orig.apply(console, a); };
  });
  window.onerror = (msg, src, line, col) => {
    send('error', [msg + ' (line ' + line + ')']);
  };
  try {
${userCode}
  } catch (e) {
    send('error', [String(e)]);
  }
})();
<\/script>
</body></html>`;

    iframe.srcdoc = html;
  }

  private appendLog(level: string, args: string[]) {
    const line = document.createElement('div');
    if (level === 'error') line.className = 'err';
    line.textContent = `[${level}] ${args.join(' ')}`;
    this.consoleEl.appendChild(line);
    this.consoleEl.scrollTop = this.consoleEl.scrollHeight;
  }
}