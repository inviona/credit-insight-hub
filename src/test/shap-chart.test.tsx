import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShapChart } from "@/components/ShapChart";

describe("ShapChart", () => {
  const riskFactors = [
    ["Debt-to-Income", 0.142],
    ["Loan Amount", 0.098],
    ["Monthly Payment", 0.076],
  ];
  const protectFactors = [
    ["Credit Score", -0.112],
    ["Annual Income", -0.043],
  ];

  it("renders without crashing", () => {
    expect(() =>
      render(<ShapChart riskFactors={riskFactors} protectFactors={protectFactors} />),
    ).not.toThrow();
  });

  it("renders the legend", () => {
    render(<ShapChart riskFactors={riskFactors} protectFactors={protectFactors} />);
    expect(screen.getByText(/Increases risk/)).toBeInTheDocument();
    expect(screen.getByText(/Decreases risk/)).toBeInTheDocument();
  });

  it("handles empty arrays", () => {
    expect(() =>
      render(<ShapChart riskFactors={[]} protectFactors={[]} />),
    ).not.toThrow();
  });

  it("respects maxItems prop", () => {
    expect(() =>
      render(
        <ShapChart
          riskFactors={riskFactors}
          protectFactors={protectFactors}
          maxItems={1}
        />,
      ),
    ).not.toThrow();
  });

  it("handles only risk factors", () => {
    expect(() =>
      render(<ShapChart riskFactors={riskFactors} protectFactors={[]} />),
    ).not.toThrow();
  });

  it("handles only protect factors", () => {
    expect(() =>
      render(<ShapChart riskFactors={[]} protectFactors={protectFactors} />),
    ).not.toThrow();
  });
});
