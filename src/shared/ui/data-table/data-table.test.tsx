import { type ColumnDef } from "@tanstack/react-table";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "./data-table";

type Candidate = {
  name: string;
  role: string;
};

const columns: ColumnDef<Candidate>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
];

describe("DataTable", () => {
  it("renders rows", () => {
    render(
      <DataTable columns={columns} data={[{ name: "An Nguyen", role: "Frontend Engineer" }]} />,
    );

    expect(screen.getByText("An Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    render(<DataTable columns={columns} data={[]} emptyMessage="No candidates found." />);

    expect(screen.getByText("No candidates found.")).toBeInTheDocument();
  });
});
