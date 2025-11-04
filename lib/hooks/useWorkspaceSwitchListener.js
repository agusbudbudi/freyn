"use client";

import { useEffect } from "react";

const EVENT_NAME = "workspace-switched";

export function useWorkspaceSwitchListener(handler) {
  useEffect(() => {
    if (typeof window === "undefined" || typeof handler !== "function") {
      return undefined;
    }

    const wrapped = (event) => {
      handler(event?.detail || {});
    };

    window.addEventListener(EVENT_NAME, wrapped);
    return () => {
      window.removeEventListener(EVENT_NAME, wrapped);
    };
  }, [handler]);
}
