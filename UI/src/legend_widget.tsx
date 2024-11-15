import React, { useEffect } from 'react';
import * as d3 from 'd3';

const LegendWidget: React.FC = () => {
  useEffect(() => {
    // Remove any existing legend SVG to avoid duplicate rendering
    d3.select(".legend-container svg").remove(); // Target the container directly

    const keys = ["Not", "Most"];
    const colors: string[] = [
      "rgba(230, 238, 207,.7)",  // Color for interval[1]
      "rgba(155, 196, 193,.7)",  // Color for interval[2]
      "rgba(105, 168, 183,.7)",  // Color for interval[3]
      "rgba(75, 126, 152,.7)",   // Color for interval[4]
      "rgba(46, 85, 122,.7)"     // Color for interval[5]
    ];

    // Append the SVG to the legend-container
    const svg = d3.select(".legend-container").append("svg")
      .attr("id", "legendSvg")  // Add ID to remove duplicates later
      .attr("width", 300)
      .attr("height", 80)
      .style("background", "transparent");

    // Add the title
    svg.append("text")
      .attr("x", 150)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#333")
      .style("font-weight", "bold")
      .text("Walkability Spectrum");

    // Add the colored circles
    svg.selectAll("dots")
      .data(colors)
      .enter()
      .append("circle")
        .attr("cx", (_d: string, i: number) => 100 + i * 25)  // Typed the parameters
        .attr("cy", 30)
        .attr("r", 7)
        .style("fill", (_d: string, i: number) => colors[i])
        .style("stroke", "black")
        .style("stroke-width", "1");

    // Add the text for the two extremes (Not and Most)
    svg.append("text")
      .attr("x", 100)
      .attr("y", 50)
      .attr("transform", "rotate(-45, 100, 50)")
      .style("fill", "#333")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text(keys[0])
      .attr("text-anchor", "middle")
      .style("alignment-baseline", "middle");

    svg.append("text")
      .attr("x", 100 + (colors.length - 1) * 25)
      .attr("y", 50)
      .attr("transform", `rotate(-45, ${100 + (colors.length - 1) * 25}, 50)`)
      .style("fill", "#333")
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .text(keys[1])
      .attr("text-anchor", "middle")
      .style("alignment-baseline", "middle");
  }, []);

  return null; // Remove the return <div> as we're now targeting .legend-container directly
};

export default LegendWidget;


