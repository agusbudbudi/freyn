"use client";

import { useEffect, useMemo, useState } from "react";

function normalizeStatus(value) {
  if (value === undefined || value === null) return "";
  return value.toString().trim().toLowerCase();
}

function defaultLabelFormatter(status, rawStatus) {
  if (status === "all") return "All";
  const source = rawStatus || status;
  if (!source) return "Unknown";
  return source
    .toString()
    .split(" ")
    .map((part) =>
      part.length > 0 ? part[0].toUpperCase() + part.slice(1) : part
    )
    .join(" ");
}

export function useStatusFilter(items = [], options = {}) {
  const {
    selector = (item) => item?.status ?? "",
    initialStatus = "all",
    formatLabel,
    order = [],
  } = options;

  const normalizedInitial = normalizeStatus(initialStatus) || "all";
  const [activeStatus, setActiveStatus] = useState(normalizedInitial);

  const labelFormatter = useMemo(() => {
    if (typeof formatLabel === "function") {
      return (status, raw) => formatLabel(status, raw);
    }
    return defaultLabelFormatter;
  }, [formatLabel]);

  const countsMap = useMemo(() => {
    const map = new Map();
    if (!Array.isArray(items)) {
      return map;
    }

    items.forEach((item) => {
      const rawStatus = selector?.(item);
      const normalized = normalizeStatus(rawStatus);
      const key = normalized || "unknown";
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
        if (!existing.raw && rawStatus) {
          existing.raw = rawStatus;
        }
      } else {
        map.set(key, {
          count: 1,
          raw: rawStatus,
        });
      }
    });

    return map;
  }, [items, selector]);

  const statusKeys = useMemo(() => Array.from(countsMap.keys()), [countsMap]);

  useEffect(() => {
    const normalizedActive = normalizeStatus(activeStatus);
    if (normalizedActive === "all") return;
    if (!statusKeys.includes(normalizedActive)) {
      setActiveStatus("all");
    }
  }, [activeStatus, statusKeys]);

  const totalItems = Array.isArray(items) ? items.length : 0;

  const optionsList = useMemo(() => {
    const normalizedOrder = Array.isArray(order)
      ? order.map((value) => normalizeStatus(value))
      : [];

    const entries = Array.from(countsMap.entries());
    entries.sort((a, b) => {
      const [keyA] = a;
      const [keyB] = b;
      const indexA = normalizedOrder.indexOf(keyA);
      const indexB = normalizedOrder.indexOf(keyB);
      if (indexA === -1 && indexB === -1) {
        return keyA.localeCompare(keyB);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const result = [
      {
        value: "all",
        label: labelFormatter("all"),
        count: totalItems,
      },
    ];

    entries.forEach(([key, entry]) => {
      result.push({
        value: key,
        label: labelFormatter(key, entry.raw),
        count: entry.count,
      });
    });

    return result;
  }, [countsMap, labelFormatter, order, totalItems]);

  const normalizedActiveStatus = normalizeStatus(activeStatus);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) return [];
    if (
      normalizedActiveStatus === "all" ||
      normalizedActiveStatus === ""
    ) {
      return items;
    }
    return items.filter(
      (item) => normalizeStatus(selector?.(item)) === normalizedActiveStatus
    );
  }, [items, normalizedActiveStatus, selector]);

  return {
    activeStatus: normalizedActiveStatus,
    setActiveStatus,
    filteredItems,
    options: optionsList,
    resetStatus: () => setActiveStatus(normalizedInitial),
  };
}
