import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ShuffleModeSelector } from "./ShuffleModeSelector";

describe("ShuffleModeSelector", () => {
  it("changes selection on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ShuffleModeSelector value="pure-random" onChange={onChange} />);

    await user.click(screen.getByRole("radio", { name: "Favor Recently Added" }));

    expect(onChange).toHaveBeenCalledWith("recently-added");
  });

  it("supports arrow-key navigation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ShuffleModeSelector value="pure-random" onChange={onChange} />);

    screen.getByRole("radiogroup").focus();
    await user.keyboard("{ArrowRight}");

    expect(onChange).toHaveBeenCalledWith("recently-added");
  });

  it("sets aria-checked on the selected mode", () => {
    render(<ShuffleModeSelector value="neglected" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Favor Neglected" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });
});
