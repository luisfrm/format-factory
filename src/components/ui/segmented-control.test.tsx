import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "@/components/ui/segmented-control";

const OPTIONS = [
  { value: "high", label: "Alta" },
  { value: "balanced", label: "Balance" },
  { value: "compact", label: "Compacta" },
] as const;

function Harness({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState<"high" | "balanced" | "compact">("balanced");

  return (
    <SegmentedControl
      value={value}
      options={[...OPTIONS]}
      ariaLabel="Calidad"
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("SegmentedControl", () => {
  it("exposes the options as a labelled radiogroup", () => {
    render(<Harness onChange={() => {}} />);

    expect(screen.getByRole("radiogroup", { name: "Calidad" })).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("marks the current value as checked", () => {
    render(<Harness onChange={() => {}} />);

    expect(screen.getByRole("radio", { name: "Balance" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Alta" })).not.toBeChecked();
  });

  it("emits the clicked option and moves the selection", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Compacta" }));

    expect(onChange).toHaveBeenCalledWith("compact");
    expect(screen.getByRole("radio", { name: "Compacta" })).toBeChecked();
  });

  it("is reachable from the keyboard", async () => {
    render(<Harness onChange={() => {}} />);

    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "Balance" })).toHaveFocus();
  });

  it("moves the selection with arrow keys", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("compact");
    expect(screen.getByRole("radio", { name: "Compacta" })).toHaveFocus();
  });
});
