import { useEffect, useState } from "react";

/** Steps through `count` frames every `ms` while on. */
export function useAutoplay(
  count: number,
  index: number,
  go: (next: number) => void,
  ms = 4200
) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!on) {
      return;
    }
    const t = setTimeout(() => go((index + 1) % count), ms);
    return () => clearTimeout(t);
  }, [on, index, count, go, ms]);
  return { on, setOn, toggle: () => setOn((v) => !v) };
}
