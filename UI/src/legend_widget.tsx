import React, { useEffect } from 'react';
import * as d3 from 'd3';

const LegendWidget: React.FC = () => {
  useEffect(() => {
    // Remove any existing legend SVG to avoid duplicate rendering
    d3.select(".legend-container svg").remove(); // Target the container directly

    // Set up the data for 5 dots in the legend
    const keys = ["Not", "", "", "", "Most"];
    const colors: string[] = [
      "rgba(255, 0, 0, 0.6)",   // Red (Least walkable)
      "rgba(255, 127, 0, 0.6)", // Orange
      "rgba(255, 255, 0, 0.6)", // Yellow
      "rgba(127, 255, 0, 0.6)", // Light Green
      "rgba(56, 168, 0, 0.6)"   // Green (Most walkable)
    ];

    // Append the SVG to the legend-container
    const svg = d3.select(".legend-container").append("svg")
      .attr("id", "legendSvg")  // Add ID to remove duplicates later
      .attr("width", 200)       // Set the width to make the legend compact
      .attr("height", 60)       // Reduced height for a more compact look
      .style("background", "transparent");

    // Add the title
    svg.append("text")
      .attr("x", 100)
      .attr("y", 12) // Adjusted y-position for better alignment
      .attr("text-anchor", "middle")
      .style("font-size", "11px") // Slightly increased font size closer to original
      .style("fill", "#333")
      .style("font-weight", "bold")
      .text("Walkability Spectrum");

    // Add the colored circles
    svg.selectAll("dots")
      .data(colors)
      .enter()
      .append("circle")
        .attr("cx", (_d: string, i: number) => 40 + i * 30)  // Adjust spacing for 5 dots, keeping it compact
        .attr("cy", 30)
        .attr("r", 6)  // Slightly increased the radius for better visibility
        .style("fill", (_d: string, i: number) => colors[i])
        .style("stroke", "black")
        .style("stroke-width", "0.75"); // Medium stroke width for visibility

    // Add the text for the two extremes (Not and Most)
    svg.append("text")
      .attr("x", 40)  // Align with the first dot
      .attr("y", 50)
      .style("fill", "#333")
      .style("font-size", "9px") // Increase the font size of the labels closer to original
      .style("font-weight", "bold")
      .text(keys[0])
      .attr("text-anchor", "middle")
      .style("alignment-baseline", "middle");

    svg.append("text")
      .attr("x", 40 + (colors.length - 1) * 30)  // Align with the last dot
      .attr("y", 50)
      .style("fill", "#333")
      .style("font-size", "9px") // Increase the font size of the labels closer to original
      .style("font-weight", "bold")
      .text(keys[4])
      .attr("text-anchor", "middle")
      .style("alignment-baseline", "middle");
  }, []);

  return null; // Remove the return <div> as we're now targeting .legend-container directly
};

export default LegendWidget;






