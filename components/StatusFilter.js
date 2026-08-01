"use client";

import Tabs from "@/components/ui/Tabs";

export default function StatusFilter({ options = [], value, onChange }) {
  if (!options.length) return null;

  const tabs = options.map((option) => ({
    value: option.value,
    label: option.value === "all" ? "All" : option.label,
    count: option.count,
  }));

  return <Tabs tabs={tabs} value={value} onChange={onChange} />;
}
