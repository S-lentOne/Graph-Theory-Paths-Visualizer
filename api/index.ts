import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).send('Graph Theory Visualizer running!');
}
const CompleteRouteGraph = () => {
  const svgRef = useRef();
  const [selectedEdges, setSelectedEdges] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [shortestPath, setShortestPath] = useState(null);

  // Calculate shortest path visiting all nodes ending at Chitkara (TSP approximation)
  const calculateShortestPath = (nodes, edges) => {
    const start = nodes.find(n => n.id === "PEC");
    const end = nodes.find(n => n.id === "Chitkara");
    const unvisited = nodes.filter(n => n.id !== "PEC");
    
    const path = [start];
    let current = start;
    let pathDistance = 0;
    
    while (unvisited.length > 0) {
      let nearest = null;
      let nearestDist = Infinity;
      
      for (const node of unvisited) {
        const edge = edges.find(e => 
          (e.source === current.id && e.target === node.id) ||
          (e.target === current.id && e.source === node.id)
        );
        if (edge && edge.distance < nearestDist) {
          nearest = node;
          nearestDist = edge.distance;
        }
      }
      
      if (nearest) {
        path.push(nearest);
        pathDistance += nearestDist;
        current = nearest;
        const idx = unvisited.findIndex(n => n.id === nearest.id);
        unvisited.splice(idx, 1);
      } else {
        break;
      }
    }
    
    // If we didn't end at Chitkara, add final edge
    if (current.id !== end.id) {
      const finalEdge = edges.find(e =>
        (e.source === current.id && e.target === end.id) ||
        (e.target === current.id && e.source === end.id)
      );
      if (finalEdge) {
        pathDistance += finalEdge.distance;
      }
    }
    
    return { path, distance: pathDistance };
  };

  useEffect(() => {
    d3.select(svgRef.current).selectAll("*").remove();

    const nodes = [
      { id: "PEC", name: "PEC", x: 400, y: 100, km: 0 },
      { id: "Sector14", name: "Sector 14", x: 650, y: 150, km: 2 },
      { id: "PGI", name: "PGI Chowk", x: 800, y: 300, km: 1.5 },
      { id: "Jungle", name: "Jungle Lights", x: 850, y: 500, km: 5 },
      { id: "Khuda", name: "Khuda Lahora", x: 750, y: 680, km: 7 },
      { id: "Mullanpur", name: "Mullanpur", x: 550, y: 750, km: 12 },
      { id: "AirForce", name: "Air Force Station", x: 350, y: 730, km: 20 },
      { id: "OMAX", name: "OMAX Office", x: 150, y: 650, km: 26 },
      { id: "Kurali", name: "Kurali T-Point", x: 50, y: 480, km: 35 },
      { id: "Maharranwala", name: "Maharranwala", x: 80, y: 280, km: 43 },
      { id: "Kauna", name: "Kauna", x: 200, y: 130, km: 52 },
      { id: "Chitkara", name: "Chitkara Baddi", x: 400, y: 50, km: 65 }
    ];

    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const distance = Math.abs(nodes[j].km - nodes[i].km);
        edges.push({
          source: nodes[i].id,
          target: nodes[j].id,
          distance: distance,
          id: `${nodes[i].id}-${nodes[j].id}`
        });
      }
    }

    // Calculate shortest path
    const shortest = calculateShortestPath(nodes, edges);
    setShortestPath(shortest);

    const width = 900;
    const height = 800;

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Draw edges
    const link = svg.append("g")
      .selectAll("line")
      .data(edges)
      .enter()
      .append("line")
      .attr("x1", d => nodes.find(n => n.id === d.source).x)
      .attr("y1", d => nodes.find(n => n.id === d.source).y)
      .attr("x2", d => nodes.find(n => n.id === d.target).x)
      .attr("y2", d => nodes.find(n => n.id === d.target).y)
      .attr("stroke", "#374151")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.4)
      .style("cursor", "pointer")
      .attr("data-edge-id", d => d.id)
      .on("click", function(event, d) {
        const edgeId = d.id;
        const isSelected = selectedEdges.some(e => e.id === edgeId);
        
        if (isSelected) {
          setSelectedEdges(prev => prev.filter(e => e.id !== edgeId));
          setTotalDistance(prev => prev - d.distance);
          d3.select(this)
            .attr("stroke", "#374151")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.4);
        } else {
          setSelectedEdges(prev => [...prev, d]);
          setTotalDistance(prev => prev + d.distance);
          d3.select(this)
            .attr("stroke", "#ef4444")
            .attr("stroke-width", 3)
            .attr("opacity", 1);
        }
      })
      .on("mouseenter", function(event, d) {
        const edgeId = d.id;
        const isSelected = selectedEdges.some(e => e.id === edgeId);
        if (!isSelected) {
          d3.select(this)
            .attr("stroke", "#6b7280")
            .attr("opacity", 0.7);
        }
      })
      .on("mouseleave", function(event, d) {
        const edgeId = d.id;
        const isSelected = selectedEdges.some(e => e.id === edgeId);
        if (!isSelected) {
          d3.select(this)
            .attr("stroke", "#374151")
            .attr("opacity", 0.4);
        }
      });

    // Draw edge labels (distances) - always visible
    const edgeLabels = svg.append("g")
      .selectAll("text")
      .data(edges)
      .enter()
      .append("text")
      .attr("x", d => {
        const source = nodes.find(n => n.id === d.source);
        const target = nodes.find(n => n.id === d.target);
        return (source.x + target.x) / 2;
      })
      .attr("y", d => {
        const source = nodes.find(n => n.id === d.source);
        const target = nodes.find(n => n.id === d.target);
        return (source.y + target.y) / 2;
      })
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#dc2626")
      .attr("font-weight", "600")
      .attr("stroke", "white")
      .attr("stroke-width", "2")
      .attr("paint-order", "stroke")
      .style("pointer-events", "none")
      .text(d => `${d.distance.toFixed(1)}`);

    // Draw nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 10)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#1e40af")
      .attr("stroke-width", 3)
      .style("cursor", "grab");

    // Draw node labels
    const nodeLabels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .enter()
      .append("text")
      .attr("x", d => d.x)
      .attr("y", d => d.y - 18)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("font-weight", "600")
      .attr("fill", "#1f2937")
      .attr("stroke", "white")
      .attr("stroke-width", "3")
      .attr("paint-order", "stroke")
      .style("pointer-events", "none")
      .text(d => d.name);

    // Drag behavior
    const drag = d3.drag()
      .on("start", function(event, d) {
        d3.select(this).style("cursor", "grabbing");
      })
      .on("drag", function(event, d) {
        d.x = event.x;
        d.y = event.y;
        
        // Update node position
        d3.select(this)
          .attr("cx", d.x)
          .attr("cy", d.y);
        
        // Update label position
        nodeLabels.filter(n => n.id === d.id)
          .attr("x", d.x)
          .attr("y", d.y - 18);
        
        // Update all connected edges
        link.filter(e => e.source === d.id || e.target === d.id)
          .attr("x1", e => nodes.find(n => n.id === e.source).x)
          .attr("y1", e => nodes.find(n => n.id === e.source).y)
          .attr("x2", e => nodes.find(n => n.id === e.target).x)
          .attr("y2", e => nodes.find(n => n.id === e.target).y);
        
        // Update edge labels
        edgeLabels.filter(e => e.source === d.id || e.target === d.id)
          .attr("x", e => {
            const source = nodes.find(n => n.id === e.source);
            const target = nodes.find(n => n.id === e.target);
            return (source.x + target.x) / 2;
          })
          .attr("y", e => {
            const source = nodes.find(n => n.id === e.source);
            const target = nodes.find(n => n.id === e.target);
            return (source.y + target.y) / 2;
          });
      })
      .on("end", function(event, d) {
        d3.select(this).style("cursor", "grab");
      });

    node.call(drag);

    node.on("mouseenter", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 14)
        .attr("fill", "#2563eb");
    })
    .on("mouseleave", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", 10)
        .attr("fill", "#3b82f6");
    });

  }, [selectedEdges]);

  const clearPath = () => {
    setSelectedEdges([]);
    setTotalDistance(0);
    d3.select(svgRef.current)
      .selectAll("line")
      .attr("stroke", "#374151")
      .attr("stroke-width", 1.5)
      .attr("opacity", 0.4);
  };

  return (
    <div className="w-full bg-gray-50 p-4 rounded-lg">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Complete Graph: Chandigarh to Baddi Route
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Click on edges to select path. All distances shown in km.
        </p>
        
        <div className="flex gap-3 mb-3">
          <div className="bg-blue-100 border border-blue-300 rounded p-3 flex-1">
            <div className="text-xs text-blue-600 font-semibold mb-1">DISTANCE TRAVELED</div>
            <div className="text-2xl font-bold text-blue-900">{totalDistance.toFixed(1)} km</div>
            <div className="text-xs text-blue-600 mt-1">{selectedEdges.length} edges selected</div>
          </div>
          
          {shortestPath && (
            <div className="bg-green-100 border border-green-300 rounded p-3 flex-1">
              <div className="text-xs text-green-600 font-semibold mb-1">SHORTEST PATH (PEC → Campus)</div>
              <div className="text-2xl font-bold text-green-900">{shortestPath.distance.toFixed(1)} km</div>
              <div className="text-xs text-green-600 mt-1">
                {shortestPath.path.map(n => n.name).join(' → ')}
              </div>
            </div>
          )}
        </div>

        <button 
          onClick={clearPath}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition"
        >
          Clear Selected Path
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-3 overflow-x-auto mb-3">
        <svg ref={svgRef}></svg>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white p-3 rounded border">
          <h3 className="font-semibold mb-2 text-gray-700">How to Use</h3>
          <ul className="space-y-1 text-gray-600">
            <li>• Click edges to add them to your path</li>
            <li>• Click again to remove from path</li>
            <li>• Selected edges turn red</li>
            <li>• Distance automatically calculated</li>
            <li>• Use "Clear" button to reset</li>
          </ul>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h3 className="font-semibold mb-2 text-gray-700">Graph Properties</h3>
          <ul className="space-y-1 text-gray-600">
            <li>• Total Nodes: 12</li>
            <li>• Total Edges: 66</li>
            <li>• Graph Type: Complete (K₁₂)</li>
            <li>• Full Route: ~65 km</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompleteRouteGraph;
