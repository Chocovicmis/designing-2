import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorage(key: string, defaultValue: string): [string, (value: string) => void] {
  const [value, setValue] = useState<string>(() => defaultValue);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(stored);
      }
    } catch (error) {
      console.warn(`Unable to read localStorage key "${key}"`, error);
    }
  }, [key]);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      if (value === defaultValue) return;
    }
    try {
      if (value) {
        window.localStorage.setItem(key, value);
      } else {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Unable to persist localStorage key "${key}"`, error);
    }
  }, [defaultValue, key, value]);

  const update = useCallback((next: string) => {
    setValue(next);
  }, []);

  return [value, update];
}
