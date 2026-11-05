/**
 * CEDIREKO Films Portfolio - Zero-Dependency Chrome CDP Driver
 * Automated headless browser interaction via Chrome DevTools Protocol over WebSockets.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

class CdpBrowser {
  constructor(options = {}) {
    this.port = options.port || (9223 + Math.floor(Math.random() * 500));
    this.chromePath = options.chromePath || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    this.proc = null;
    this.tmpDir = null;
    this.ws = null;
    this.msgId = 1;
    this.pendingCommands = new Map();
    this.eventListeners = new Map();
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  async launch() {
    this.tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `cedireko-cdp-${this.port}-`));

    const flags = [
      '--headless=new',
      `--remote-debugging-port=${this.port}`,
      `--user-data-dir=${this.tmpDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-component-extensions-with-background-pages',
      '--disable-background-networking',
      '--disable-default-apps',
      '--mute-audio',
      'about:blank'
    ];

    this.proc = spawn(this.chromePath, flags, { stdio: 'ignore' });

    // Wait for CDP endpoint to be ready and target of type "page"
    let targetWsUrl = null;
    for (let i = 0; i < 40; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.port}/json/list`);
        if (res.ok) {
          const list = await res.json();
          // Crucial: Only connect to target of type "page", NOT "browser_ui" or "service_worker"
          const pageTarget = list && list.find(t => t.type === 'page');
          if (pageTarget && pageTarget.webSocketDebuggerUrl) {
            targetWsUrl = pageTarget.webSocketDebuggerUrl;
            break;
          }
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 150));
      }
    }

    if (!targetWsUrl) {
      throw new Error(`Failed to find page target on Chrome DevTools Protocol port ${this.port}`);
    }

    await this.connectWs(targetWsUrl);

    // Enable domains
    await this.send('Page.enable');
    await this.send('DOM.enable');
    await this.send('Runtime.enable');
    await this.send('Network.enable');

    this.on('Runtime.exceptionThrown', (params) => {
      this.consoleErrors.push({
        text: params.exceptionDetails?.text || 'Uncaught error',
        exception: params.exceptionDetails
      });
    });

    this.on('Network.responseReceived', (params) => {
      if (params.response?.status >= 400) {
        this.networkErrors.push({
          url: params.response.url,
          status: params.response.status,
          statusText: params.response.statusText
        });
      }
    });

    return this;
  }

  connectWs(url) {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id && this.pendingCommands.has(data.id)) {
            const { resolve, reject } = this.pendingCommands.get(data.id);
            this.pendingCommands.delete(data.id);
            if (data.error) {
              reject(new Error(`CDP Error (${data.error.code}): ${data.error.message}`));
            } else {
              resolve(data.result);
            }
          } else if (data.method) {
            const listeners = this.eventListeners.get(data.method) || [];
            listeners.forEach(fn => fn(data.params));
          }
        } catch (e) {
          console.error('Error handling CDP message:', e);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.msgId++;
      this.pendingCommands.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, callback) {
    if (!this.eventListeners.has(method)) {
      this.eventListeners.set(method, []);
    }
    this.eventListeners.get(method).push(callback);
  }

  async navigate(url) {
    const loadPromise = new Promise((resolve) => {
      const onLoad = () => {
        resolve();
      };
      this.on('Page.loadEventFired', onLoad);
    });

    await this.send('Page.navigate', { url });
    await loadPromise;
    // Allow paint and script initialization
    await new Promise(r => setTimeout(r, 200));
  }

  async setViewport({ width, height, deviceScaleFactor = 1, isMobile = false }) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor,
      mobile: isMobile
    });
    // Wait for layout recalculation
    await new Promise(r => setTimeout(r, 100));
  }

  async evaluate(fnOrExpression) {
    const expr = typeof fnOrExpression === 'function'
      ? `(${fnOrExpression.toString()})()`
      : fnOrExpression;

    const result = await this.send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true
    });

    if (result.exceptionDetails) {
      throw new Error(`Evaluation Exception: ${result.exceptionDetails.text} (${JSON.stringify(result.exceptionDetails)})`);
    }

    return result.result?.value;
  }

  async waitForSelector(selector, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const exists = await this.evaluate(`!!document.querySelector(${JSON.stringify(selector)})`);
      if (exists) return true;
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for selector: ${selector}`);
  }

  async waitForFunction(fnStr, timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const result = await this.evaluate(fnStr);
      if (result) return result;
      await new Promise(r => setTimeout(r, 100));
    }
    throw new Error(`Timeout waiting for function condition: ${fnStr}`);
  }

  async click(selector) {
    const clicked = await this.evaluate(`(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) return false;
      el.scrollIntoView({ block: 'center', inline: 'center' });
      el.click();
      return true;
    })()`);

    if (!clicked) {
      throw new Error(`Element not found for click: ${selector}`);
    }
    await new Promise(r => setTimeout(r, 150));
  }

  async pressKey(key) {
    await this.send('Input.dispatchKeyEvent', {
      type: 'rawKeyDown',
      key: key,
      code: key === 'Escape' ? 'Escape' : key
    });
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key: key,
      code: key === 'Escape' ? 'Escape' : key
    });
    await new Promise(r => setTimeout(r, 100));
  }

  resetErrors() {
    this.consoleErrors = [];
    this.networkErrors = [];
  }

  async close() {
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
    }
    if (this.proc) {
      try {
        this.proc.kill('SIGTERM');
      } catch (e) {}
    }
    // Give OS time to release file locks before deleting temp profile
    await new Promise(r => setTimeout(r, 300));
    if (this.tmpDir) {
      try {
        fs.rmSync(this.tmpDir, { recursive: true, force: true, maxRetries: 3 });
      } catch (e) {}
    }
  }
}

module.exports = { CdpBrowser };
