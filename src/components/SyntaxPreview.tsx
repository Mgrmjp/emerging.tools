"use client";

import { useState, useEffect, useMemo } from "react";
import { Theme } from "@/lib/types";

const CODE_SNIPPETS = [
    {
        name: "debug.ts",
        code: [
            "function debug(everything) {",
            "    console.log('idk why', everything);",
            "    debugger;",
            "    throw new Error('help');",
            "}",
            "",
            "// TODO: fix this later",
            "debug(life);",
        ],
    },
    {
        name: "production.js",
        code: [
            "const pray = () => {",
            "    if (works) return;",
            "    // it works on my machine",
            "    throw new Error('🙏');",
            "}",
            "",
            "pray();",
        ],
    },
    {
        name: "api.ts",
        code: [
            "async function fetchData() {",
            "    const r = await fetch('/api/v1/beta/test');",
            "    if (Math.random() > 0.5) {",
            "        return await r.json();",
            "    }",
            "    return { error: '¯\\_(ツ)_/¯' };",
            "}",
        ],
    },
    {
        name: "refactor.js",
        code: [
            "// before: 500 lines",
            "// after: 500 lines",
            "// but now it's functional",
            "const fn = (x) => x.map(x=>x).flat();",
        ],
    },
    {
        name: "regex.ts",
        code: [
            "// validate email",
            "const email = /^[a-z]+@[a-z]+.[a-z]+$/;",
            "// this works 99% of the time",
            "email.test('you@know-this.works');",
        ],
    },
    {
        name: "async.js",
        code: [
            "async function main() {",
            "    console.log('one');",
            "    await new Promise(r => setTimeout(r, 1000));",
            "    console.log('two');",
            "}",
            "",
            "main(); // finally... async/await",
        ],
    },
    {
        name: "merge.ts",
        code: [
            "const config = {",
            "    ...defaults,",
            "    ...userConfig,",
            "    ...ohNoItsBroken,",
            "};",
        ],
    },
    {
        name: "todo.js",
        code: [
            "// TODO: implement binary search",
            "// TODO: write tests",
            "// TODO: fix edge cases",
            "// deadline: yesterday",
            "const search = (arr, target) => arr[0];",
        ],
    },
];

function hl(line: string, t: Theme): string {
  const c = (i: number, f: string) => t.colors[i]?.hex || f;
  const fg = c(1, "#e8e8ed");
  const kw = c(2, "#3cf73c");
  const str = c(3, "#f7d73c");
  const cm = c(4, "#5a5a66");
  const vr = c(5, "#f73c3c");
  const fn = c(6, "#3c9cf7");
  const nm = c(7, "#f7d73c");

  let r = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  r = r.replace(/(\/\/.*)$/, `<span style="color:${cm}">$1</span>`);
  r = r.replace(/(".*?")/g, `<span style="color:${str}">$1</span>`);
  r = r.replace(/\b(function|const|let|var|for|if|return|new|type|interface|async|await)\b/g, `<span style="color:${kw}">$1</span>`);
  r = r.replace(/\b(number|string|boolean|void|any|true|false|null)\b/g, `<span style="color:${kw}">$1</span>`);
  r = r.replace(/\b(\d+)\b/g, `<span style="color:${nm}">$1</span>`);
  r = r.replace(/\b(console|Error|debugger|fetch|Promise)\b/g, `<span style="color:${vr}">$1</span>`);
  r = r.replace(/\b(map|flat|filter|find|push|slice|log|debug|test|random)\b/g, `<span style="color:${fn}">$1</span>`);
  return `<span style="color:${fg}">${r}</span>`;
}

export function SyntaxPreview({ theme }: { theme: Theme }) {
  const bg = theme.colors[0]?.hex || "#111114";
  const [snippet, setSnippet] = useState(CODE_SNIPPETS[0]);

  useEffect(() => {
    setSnippet(CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]);
  }, []);

  return (
    <div className="overflow-hidden border border-[var(--border)]" style={{ backgroundColor: bg }}>
      <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-3 py-1.5 bg-[var(--surface)]">
        <span className="w-2 h-2 bg-[#f73c3c]/60" />
        <span className="w-2 h-2 bg-[#f7d73c]/60" />
        <span className="w-2 h-2 bg-[#3cf73c]/60" />
        <span className="ml-2 text-[10px] text-[var(--muted)]">{snippet.name}</span>
      </div>
      <div className="p-3 text-xs leading-5 font-mono overflow-x-auto">
        {snippet.code.map((line, i) => (
          <div key={i} className="flex leading-5 whitespace-pre">
            <span className="mr-4 inline-block w-5 select-none text-right text-[var(--muted)] opacity-40 tabular-nums">
              {i + 1}
            </span>
            <span dangerouslySetInnerHTML={{ __html: hl(line, theme) }} />
          </div>
        ))}
      </div>
    </div>
  );
}
