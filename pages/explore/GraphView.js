
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { partition } from 'd3';

import LoadingSpinner from '../../components/UI/LoadingSpinner';

// import { partition } from 'd3';
// import { format } from 'd3';

function GraphView({ parsedData, callback, parsedWidth, parsedHeight, selectedNode }) {
    const [data, setData] = useState(parsedData);
    const [height, setHeight] = useState();
    const svgRef = useRef(null);
    const [refocus, setRefocus] = useState(null);

    useEffect(() => {
        let cancelled = false;
        if (!cancelled) {
            setData(parsedData);
        }

        return () => {
            cancelled = true;
        };
    }, [parsedData]);

    useEffect(() => {
        let cancelled = false;

        if (!cancelled) {
            parsedHeight && setHeight(parsedHeight);
        }
        return () => {
            cancelled = true;
        };
    }, [parsedHeight]);

    const drawSvg = (data, height) => {
        const container = d3.select(svgRef.current);
        // Remove previous SVG
        container.selectAll('svg').remove();
        const format = d3.format(',d');

        function rectHeight(d) {
            return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
        }

        function labelVisible(d) {
            return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
        }

        const width = parsedWidth || window.innerWidth;
        // const height = parsedHeight;

        function iciclePartition(data) {
            const root = d3
                .hierarchy(data)
                .sum((d) => {
                    return d.value || 1;
                })
                .sort(
                    (a, b) => b.height - a.height || b.value - a.value,
                );
            return partition().size([
                height,
                ((root.height + 1) * width / 5),
            ])(root);
        }

        // const color = scaleOrdinal(
        //     quantize(interpolateRainbow, data.children.length + 1),
        // );

        const root = iciclePartition(data);

        if (refocus) {
            console.log(refocus);
            root.each(
                (d) =>
                    (d.target = {
                        x0: ((d.x0 - refocus.x0) / (refocus.x1 - refocus.x0)) * height,
                        x1: ((d.x1 - refocus.x0) / (refocus.x1 - refocus.x0)) * height,
                        y0: d.y0 - refocus.y0,
                        y1: d.y1 - refocus.y0,
                    }),
            );
        }
        let focus = root;

        // const svg = select('body')
        //     .append('svg')
        //     // .attr('viewBox', [root.x1, 0, width, height])
        //     .style('font', '10px sans-serif');

        const svg = container
            .append('svg')
        // .attr('height', height)
        // .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width: 100%; height: auto; height: intrinsic;')
            .style('font', '10px sans-serif');

        const cell = svg
            .selectAll('g')
            .data(root.descendants())
            .join('g')
            .attr('transform', (d) => `translate(${d.y0},${d.x0})`)
            .attr('width', (d) => d.y1 - d.y0);

        const rect = cell
            .append('rect')
            .attr('width', (d) => d.y1 - d.y0 -1)
            .attr('height', (d) => rectHeight(d))
            .attr('fill', (d) => {
                // if (d.data.template === 'write') return 'red';
                // if (d.data.template === 'sketch') return 'blue';
                // if (d.data.type === 'item') return 'green';
                return 'var(--color-background-sidebar)';
            })
            .attr('stroke', 'var(--color-foreground)')
            .attr('stroke-width', '8')
            .style('cursor', 'pointer')
            .on('click', clicked);

        const text = cell
            .append('text')
            .style('user-select', 'none')
            .attr('pointer-events', 'none')
            .attr('x', 15)
            .attr('y', 30)
            .attr('font-size', '1.2rem')
            .attr('fill', 'var(--color-foreground)')
            .attr('fill-opacity', (d) => +labelVisible(d));

        text.append('tspan').text((d) => {
            if (d.data.template === 'write') return '📝 ' + d.data.name;
            if (d.data.template === 'sketch') return '🎨 ' + d.data.name;
            if (d.data.template === 'chat') return '💬 ' + d.data.name;
            if (d.data.type === 'item') return '📐 ' + d.data.name;

            return d.data.name;
        });

        const tspan = text
            .append('tspan')
            .attr('x', (d) => d.y1 - d.y0 -16)
            .attr('text-anchor', 'end')
            .attr('fill-opacity', (d) => labelVisible(d) * 0.7)
            .text((d) => {
                console.log(d);
                return d.data.template;
            });

        cell.append('title').text(
            (d) =>
                `${d
                    .ancestors()
                    .map((d) => d.data.name)
                    .reverse()
                    .join('/')}\n${format(d.value)}`,
        );

        function startTransition(p) {
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
        }

        async function clicked(event, p) {
            if (!p) return;
            // const newNode = d3.hierarchy(newData);
            // console.log(newNode);
            // newNode.depth = p.depth + 1;
            // newNode.height = p.height - 1;
            // newNode.parent = p;

            // if (!p.children) {
            //     p.children = [];
            //     p.data.children = [];
            // }
            // p.children.push(newNode);
            // p.data.children.push(newNode.data);
            // // setData(newData);
            startTransition(p);
            await callback(p, focus !== p && p.parent);

            // tspan
            //     .transition(t)
            //     .attr(
            //         'fill-opacity',
            //         (d) => labelVisible(d.target) * 0.7,
            //     );
        }
    };

    useEffect(() => {
        drawSvg(data, height);
        return () => {
            console.log('unmount svg');
            // svgRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [height]);

    // useEffect(() => {
    //     // if (svgRef.current) {
    //     //     console.log(svg);
    //     //     svgRef.current.appendChild(svg.node());
    //     // }

    //     return () => {
    //         svgRef.current = null;
    //     };
    // }, [svg, height]);
    if (!height) return <LoadingSpinner />;
    // return <svg ref={svgRef} width="100%" height={height} />;
    return <svg ref={svgRef} width={selectedNode ? '100%' : '50%'} height={height} />;
}

export default GraphView;
