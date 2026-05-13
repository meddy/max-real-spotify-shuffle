import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressDisplay } from "./ProgressDisplay";

describe("ProgressDisplay", () => {
  it("renders phase label, numeric counts, and progress value", () => {
    render(<ProgressDisplay phase="syncing" processed={25} total={100} />);

    expect(screen.getByText("Syncing playlist...")).toBeInTheDocument();
    expect(screen.getByText("25 / 100")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });
});
