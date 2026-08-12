import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        background: #11110f;
        font-family: ui-monospace, 'Cascadia Code', 'SF Mono', Menlo, Consolas, monospace;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #f1f1ec;
      }
      .mark {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
      }
      .name {
        font-size: 58px;
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .tag {
        font-size: 24px;
        color: #9c9c93;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
    </style>
  </head>
  <body>
    <div class="mark">
      <svg width="66" height="66" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="8" fill="#5290fa" />
        <circle cx="16" cy="16" r="4.5" fill="#11110f" />
      </svg>
      <span class="name">MonoMap</span>
    </div>
    <div class="tag">One tool. One purpose. Zero bloat.</div>
  </body>
</html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
const buffer = await page.screenshot({ path: 'static/og-image.png', type: 'png' });
await browser.close();
writeFileSync('static/og-image.png', buffer);
console.log('Wrote static/og-image.png');
