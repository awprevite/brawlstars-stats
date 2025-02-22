import { useRef, FC, useEffect, useState } from "react";
import * as d3 from "d3";
import './App.css'

interface Stats {
  brawlers: { name: string; power: number; trophies: number }[];
}

const D3Chart: FC<{ stats: Stats }> = ({ stats }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [groupedData, setGroupedData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any>(null);

  useEffect(() => {
    if (!svgRef.current || !stats) return;

    // Rollup returns a map
    const grouped = d3.rollup(
      stats.brawlers, // Data
      (brawlers: any[]) => ({ // Reducer
        averageTrophies: d3.mean(brawlers, (d: any) => d.trophies), // Average trophies
        totalBrawlers: brawlers.length, // Total number of brawlers
        brawlersAt1000: brawlers.filter((brawler: any) => brawler.trophies > 999).length // Brawlers with more than 999 trophies
      }),
      (d: any) => d.power // Key: Group by power level
    );
      
    // Convert rolled up data to an array
    const groupedArray = Array.from(grouped, ([key, value]) => ({
      power: key,
      ...value
    }));

    // Sort by power in ascending order
    groupedArray.sort((a, b) => b.power - a.power);

    // Total averages and counts for table
    const totalBrawlers = groupedArray.reduce((acc, group) => acc + group.totalBrawlers, 0);
    
    const totalTrophies = groupedArray.reduce((acc, group) => {
      const averageTrophies = group.averageTrophies ?? 0;
      return acc + (averageTrophies * group.totalBrawlers);
    }, 0);

    const overallAverageTrophies = totalTrophies / totalBrawlers;

    const totalbrawlersAt1000 = groupedArray.reduce((acc, group) => acc + group.brawlersAt1000, 0);

    const totals = {
      totalBrawlers,
      overallAverageTrophies: overallAverageTrophies.toFixed(2),
      totalbrawlersAt1000
    };

    setTotals(totals);
    setGroupedData(groupedArray);

    // Set up plot
    const width = 900;
    const height = 900;
    const margin = { top: 125, right: 150, bottom: 100, left: 100 };

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "black");

    svg.selectAll("*").remove();

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([0, 11])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(stats.brawlers, (d : any) => d.trophies)])
      .range([height - margin.bottom, margin.top]);

    // Axes
    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(d3.axisBottom(xScale));

    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "16px")
      .text("Power Level");

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScale));

    svg
      .append("text")
      .attr("x", -height / 2)
      .attr("y", 20)
      .attr("transform", "rotate(-90)")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .style("font-size", "16px")
      .text("Trophies");

    // Tooltip
    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "black")
      .style("color", "white")
      .style("padding", "5px 10px")
      .style("border", "1px solid white")
      .style("border-radius", "5px")
      .style("opacity", 0);

    // Circle points
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 999])
      .range(["red", "green"]); 

    const nodes = stats.brawlers.map((b) => ({
      ...b,
      x: xScale(b.power),
      y: yScale(b.trophies),
    }));

    const circles = svg
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("r", 6)
      .attr("fill", (d: any) => d.trophies > 999 ? "white" : colorScale(d.trophies))
      .on("mouseover", (event : any, d : any) => {
        tooltip
          .style("opacity", 1)
          .html(`Name: ${d.name}<br>Trophies: ${d.trophies}<br>Power: ${d.power}`)
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mousemove", (event : any) => {
        tooltip
          .style("left", `${event.pageX + 10}px`)
          .style("top", `${event.pageY - 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    // Force Simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force("x", d3.forceX((d : any) => xScale(d.power)).strength(0.5))
      .force("y", d3.forceY((d : any) => yScale(d.trophies)).strength(0.5))
      .force("collide", d3.forceCollide(8))
      .force("charge", d3.forceManyBody().strength(-8))
      .alpha(0.5)
      .alphaDecay(0.05)
      .on("tick", () => {
        circles.attr("cx", (d : any) => d.x).attr("cy", (d : any) => d.y);
      });

    simulation.restart();
  }, [stats]);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: 'column' }}>
      <table>
        <thead>
          <tr>
            <th>Power Level</th>
            <th>Average Trophies</th>
            <th>Brawlers</th>
            <th>Brawlers at 1000 Trophies</th>
          </tr>
        </thead>
        <tbody>
          {groupedData && Array.isArray(groupedData) && groupedData.length > 0 ? (
            groupedData.map((group: any) => (
              <tr key={group.power}>
                <td>{group.power}</td>
                <td>{group.averageTrophies?.toFixed(2)}</td>
                <td>{group.totalBrawlers}</td>
                <td>{group.brawlersAt1000}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3}>No data available</td>
            </tr>
          )}
          {totals &&
            <tr>
              <td><strong>Total</strong></td>
              <td><strong>{totals.overallAverageTrophies}</strong></td>
              <td><strong>{totals.totalBrawlers}</strong></td>
              <td><strong>{totals.totalbrawlersAt1000}</strong></td>
            </tr>
          }
        </tbody>
      </table>
      <div className='data-container'>
        <h1>Power Level vs Trophies</h1>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default D3Chart;
