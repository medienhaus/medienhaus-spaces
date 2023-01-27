
import React from 'react';
import * as d3 from 'd3';
import { interpolateRainbow, partition, quantize, scaleOrdinal, select } from 'd3';
// import { partition } from 'd3';
// import { format } from 'd3';

function GraphView({ data, callback, parsedWidth }) {
    console.log(parsedWidth);
    const svgRef = React.useRef(null);
    const format = d3.format(',d');

    function rectHeight(d) {
        return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
    }

    function labelVisible(d) {
        return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
    }

    const width = parsedWidth || window.innerWidth;
    const height = window.innerHeight;
    console.log(window);

    function iciclePartition(data) {
        const root = d3
            .hierarchy(data)
            .sum((d) => d.value)
            .sort(
                (a, b) => b.height - a.height || b.value - a.value,
            );
        return partition().size([
            height,
            ((root.height + 1) * width) / 3,
        ])(root);
    }

    const color = scaleOrdinal(
        quantize(interpolateRainbow, data.children.length + 1),
    );
    const root = iciclePartition(data);
    let focus = root;

    const svg = select('body')
        .append('svg')
        // .attr('viewBox', [root.x1, 0, width, height])
        .style('font', '10px sans-serif');

    const cell = svg
        .selectAll('g')
        .data(root.descendants())
        .join('g')
        .attr('transform', (d) => `translate(${d.y0},${d.x0})`);

    const rect = cell
        .append('rect')
        .attr('width', (d) => d.y1 - d.y0 - 1)
        .attr('height', (d) => rectHeight(d))
        // .attr('fill-opacity', 1)
        .attr('fill', 'var(--color-background-sidebar)')
        .attr('stroke', 'var(--color-foreground)')
        .attr('stroke-width', '10')
        .style('cursor', 'pointer')
        .on('click', clicked);

    const text = cell
        .append('text')
        .style('user-select', 'none')
        .attr('pointer-events', 'none')
        .attr('x', 20)
        .attr('y', 50)
        .attr('font-size', '36px')
        .attr('fill', 'var(--color-foreground)')
        .attr('fill-opacity', (d) => +labelVisible(d));

    text.append('tspan').text((d) => d.data.name);

    const tspan = text
        .append('tspan')
        .attr('fill-opacity', (d) => labelVisible(d) * 0.7)
        .text((d) => ` ${format(d.value)}`);

    cell.append('title').text(
        (d) =>
            `${d
                .ancestors()
                .map((d) => d.data.name)
                .reverse()
                .join('/')}\n${format(d.value)}`,
    );
    console.log(root);
    async function clicked(event, p) {
        focus = focus === p ? (p = p.parent) : p;
        if (!p) return;

        root.each(
            (d) =>
                (d.target = {
                    x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
                    x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
                    y0: d.y0 - p.y0,
                    y1: d.y1 - p.y0,
                }),
        );

        const t = cell
            .transition()
            .duration(750)
            .attr(
                'transform',
                (d) => `translate(${d.target.y0},${d.target.x0})`,
            );

        rect
            .transition(t)
            .attr('height', (d) => rectHeight(d.target));
        text
            .transition(t)
            .attr('fill-opacity', (d) => +labelVisible(d.target));
        tspan
            .transition(t)
            .attr(
                'fill-opacity',
                (d) => labelVisible(d.target) * 0.7,
            );

        callback(p);
    }

    React.useEffect(() => {
        if (svgRef.current) {
            svgRef.current.appendChild(svg.node());
        }

        return () => {
            svgRef.current = null;
        };
    }, [svg]);

    return <svg ref={svgRef} width="100%" height="100%" />;
}

export default GraphView;
