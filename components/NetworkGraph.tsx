import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Connection, Entity } from '../types';
import { X, ZoomIn, Info } from 'lucide-react';
import { useLanguage } from '../languageContext';

interface NetworkGraphProps {
  entities: Entity[];
  connections: Connection[];
  focusEntityName?: string;
  onClose: () => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ entities, connections, focusEntityName, onClose }) => {
  const { t } = useLanguage();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || entities.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    // Prepare data
    // Map entities to nodes
    const nodes = entities.map(e => ({
      id: e.name,
      group: e.suspicionLevel,
      type: e.type || 'other',
      ...e
    }));

    // Map connections to links
    // Filter connections to ensure both source and target exist in nodes
    const nodeIds = new Set(nodes.map(n => n.id));
    const links = connections
      .filter(c => nodeIds.has(c.from) && nodeIds.has(c.to))
      .map(c => ({
        source: c.from,
        target: c.to,
        type: c.type
      }));

    // Simulation setup
    const simulation = d3.forceSimulation(nodes as any)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(180))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50));

    const svg = d3.select(svgRef.current);
    
    // Add arrow markers
    svg.append('defs').selectAll('marker')
      .data(['end'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#94a3b8');

    // Draw lines
    const link = svg.append("g")
      .attr("stroke", "#475569")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrow)");

    // Draw link labels
    const linkLabel = svg.append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("class", "link-label")
      .attr("font-size", "10px")
      .attr("fill", "#94a3b8")
      .attr("text-anchor", "middle")
      .text((d: any) => d.type);

    // Draw nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    // Node circles - Color by TYPE instead of risk for the fill, use stroke for risk
    node.append("circle")
      .attr("r", (d: any) => d.id === focusEntityName ? 28 : 20)
      .attr("fill", (d: any) => {
         switch(d.type) {
             case 'company': return '#312e81'; // Indigo 900
             case 'corruption_scheme': return '#450a0a'; // Red 950
             case 'event': return '#451a03'; // Amber 950
             case 'person': return '#0f172a'; // Slate 900
             case 'organization': return '#0c4a6e'; // Sky 900
             default: return '#1e293b';
         }
      })
      .attr("stroke", (d: any) => {
        if (d.id === focusEntityName) return '#fff';
        if (d.suspicionLevel === 'critical') return '#ef4444';
        if (d.suspicionLevel === 'high') return '#f97316';
        if (d.suspicionLevel === 'medium') return '#eab308';
        return '#10b981';
      })
      .attr("stroke-width", (d: any) => d.id === focusEntityName ? 3 : 2)
      .attr("class", "cursor-grab active:cursor-grabbing shadow-lg");

    // Node Icons (using text/unicode as proxy for icon in D3)
    node.append("text")
      .attr("dy", 5)
      .attr("text-anchor", "middle")
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-family", "lucide") // Assuming lucide font is available or fallbacks
      .style("pointer-events", "none")
      .text((d: any) => {
         switch(d.type) {
             case 'company': return '🏢';
             case 'corruption_scheme': return '☢️';
             case 'event': return '📅';
             case 'person': return '👤';
             case 'organization': return '🏛️';
             default: return '🔗';
         }
      });

    // Node labels
    node.append("text")
      .attr("dx", 25)
      .attr("dy", 5)
      .text((d: any) => d.id)
      .attr("fill", "#e2e8f0")
      .attr("font-size", "12px")
      .attr("font-weight", (d: any) => d.id === focusEntityName ? "bold" : "normal")
      .style("pointer-events", "none")
      .style("text-shadow", "0 1px 4px rgba(0,0,0,0.8)");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2 - 5);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [entities, connections, focusEntityName]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] w-full max-w-5xl h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 z-10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20">
                <ZoomIn className="w-5 h-5 text-sky-400" />
             </div>
             <div>
                <h3 className="text-white font-bold text-lg">{t.network.modalTitle}</h3>
                <p className="text-slate-400 text-xs">{t.network.drag} • {t.network.visualizing} {entities.length} entities & {connections.length} connections</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors bg-slate-800 p-2 rounded-lg hover:bg-slate-700">
            <X size={20} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative bg-[#0b1120] overflow-hidden">
            <svg ref={svgRef} className="w-full h-full cursor-move"></svg>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-slate-800 p-3 rounded-lg backdrop-blur-sm pointer-events-none flex flex-col gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Node Types</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      <div className="flex items-center gap-2">
                          <span className="text-xs">👤</span> <span className="text-[10px] text-slate-300">Person</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs">🏢</span> <span className="text-[10px] text-slate-300">Company</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs">🏛️</span> <span className="text-[10px] text-slate-300">Org</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-xs">☢️</span> <span className="text-[10px] text-slate-300">Scheme</span>
                      </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Risk (Border Color)</h4>
                  <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border-2 border-red-500 bg-transparent"></span>
                          <span className="text-[10px] text-slate-400">{t.enums.critical}</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full border-2 border-orange-500 bg-transparent"></span>
                          <span className="text-[10px] text-slate-400">{t.enums.high}</span>
                      </div>
                  </div>
                </div>
            </div>

            {focusEntityName && (
               <div className="absolute top-4 right-4 bg-sky-900/20 border border-sky-500/30 p-3 rounded-lg max-w-xs backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                     <Info className="w-4 h-4 text-sky-400 mt-0.5" />
                     <div>
                        <p className="text-xs text-sky-200 font-bold mb-1">{t.network.focus}:</p>
                        <p className="text-sm text-white font-medium">{focusEntityName}</p>
                     </div>
                  </div>
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;