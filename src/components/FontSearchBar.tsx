"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const CATEGORIES = [
  { value: "all", label: "all" },
  { value: "sans-serif", label: "sans" },
  { value: "serif", label: "serif" },
  { value: "monospace", label: "mono" },
  { value: "display", label: "display" },
  { value: "handwriting", label: "hand" },
];

const SORTS = [
  { value: "trending", label: "trending" },
  { value: "downloads", label: "downloads" },
  { value: "updated", label: "updated" },
];

export function FontSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [focused, setFocused] = useState(false);
  const currentCategory = searchParams.get("cat") || "all";
  const currentSort = searchParams.get("sort") || "trending";
  const isRandom = currentSort === "random";
  const isVariable = searchParams.get("var") === "1";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const toggleRandom = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("sort") === "random") {
      params.delete("sort");
    } else {
      params.set("sort", "random");
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  const toggleVariable = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("var") === "1") {
      params.delete("var");
    } else {
      params.set("var", "1");
    }
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`flex-1 min-w-[200px] flex items-center gap-2 border px-3 py-2 text-sm transition-colors ${
          focused
            ? "border-[var(--accent)] bg-[var(--accent)]/5"
            : "border-[var(--border)] bg-[var(--surface)]"
        }`}
      >
        <span className="text-[var(--accent)] text-xs shrink-0">$</span>
        <input
          type="text"
          placeholder="grep fonts..."
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => updateParam("q", e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-[var(--text)] placeholder-[var(--muted)] outline-none text-xs"
        />
      </div>

      <div className="flex items-center border border-[var(--border)]">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => updateParam("cat", cat.value)}
            title={`filter: ${cat.label} fonts`}
            className={`px-2.5 py-2 text-xs transition-colors first:border-r border-[var(--border)] ${
              currentCategory === cat.value
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <select
        value={currentSort}
        onChange={(e) => updateParam("sort", e.target.value)}
        title="sort by"
        className="border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-xs text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)]"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        onClick={toggleVariable}
        title="filter: variable fonts only"
        className={`border px-3 py-2 text-xs transition-colors ${
          isVariable
            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
            : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hover)]"
        }`}
      >
        variable
      </button>

      <button
        onClick={toggleRandom}
        title="randomize order"
        className={`border px-3 py-2 text-xs transition-colors ${
          isRandom
            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
            : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--border-hover)]"
        }`}
      >
        shuffle
      </button>
    </div>
  );
}
