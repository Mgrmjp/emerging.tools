"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [focused, setFocused] = useState(false);
  const currentType = searchParams.get("type") || "all";
  const currentSort = searchParams.get("sort") || "trending";
  const currentMax = searchParams.get("max") || "";
  const isRandom = currentSort === "random";

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

  const SORTS = [
    { value: "trending", label: "trending" },
    { value: "installs", label: "installs" },
    { value: "rating", label: "rating" },
    { value: "updated", label: "updated" },
  ];

  const MAXES = [
    { value: "", label: "no max" },
    { value: "1000", label: "1K" },
    { value: "5000", label: "5K" },
    { value: "10000", label: "10K" },
    { value: "25000", label: "25K" },
    { value: "50000", label: "50K" },
    { value: "100000", label: "100K" },
  ];

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
          placeholder="grep themes..."
          defaultValue={searchParams.get("q") || ""}
          onChange={(e) => updateParam("q", e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-[var(--text)] placeholder-[var(--muted)] outline-none text-xs"
        />
      </div>

      <div className="flex items-center border border-[var(--border)]">
        <button
          onClick={() => updateParam("type", currentType === "dark" ? "all" : "dark")}
          title="filter: dark themes"
          className={`px-3 py-2 text-xs transition-colors first:border-r border-[var(--border)] ${
            currentType === "dark"
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          dark
        </button>
        <button
          onClick={() => updateParam("type", currentType === "light" ? "all" : "light")}
          title="filter: light themes"
          className={`px-3 py-2 text-xs transition-colors text-[var(--muted)] hover:text-[var(--text)] ${
            currentType === "light"
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : ""
          }`}
        >
          light
        </button>
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

      <select
        value={currentMax}
        onChange={(e) => updateParam("max", e.target.value)}
        title="max installs"
        className="border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-xs text-[var(--text)] outline-none cursor-pointer focus:border-[var(--accent)]"
      >
        {MAXES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

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