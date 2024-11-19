import { useCallback, useEffect, useRef, useState } from "react";

type Callback<T> = (state: T) => void;

export default function useStateWithCallback<T>(initialState: T) {
  const [state, setState] = useState<T>(initialState);
  const cbRef = useRef<Callback<T> | null>(null);

  const updateState = useCallback(
    (newState: T | ((prevState: T) => T), cb?: Callback<T>) => {
      cbRef.current = cb || null;
      setState((prev) =>
        typeof newState === "function"
          ? (newState as (prevState: T) => T)(prev)
          : newState,
      );
    },
    [],
  );

  useEffect(() => {
    if (cbRef.current) {
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, updateState] as const;
}
