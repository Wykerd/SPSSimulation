import { doesOverlap, SPSSimulation, Region as SPSRegion } from "../spatial/sps.js";
import SAT from 'sat'

export interface Point {
    x: number,
    y: number
}

export interface PolygonRegion {
    isPolygon: true,
    points: Point[]
}

export interface CircularRegion {
    isPolygon: false,
    center: Point,
    radius: number
}

export type Region = PolygonRegion | CircularRegion;

export interface MapRegion {
    elementType: "region",
    region: Region,
    regionType: "subscription" | "publication" | "subscription-enclosing" | "subscription-sps" | "subscription-both" | "subscription-origin"
}

export interface MapPoint {
    elementType: "point",
    point: Point,
    pointType: "client" | "matcher"
}

export type MapElement = MapRegion | MapPoint;

export interface MapViewport {
    physical: {
        width: number,
        height: number
    },
    center: Point,
    scale: number
}

function getPhysicalCenter(viewport: MapViewport): Point {
    return {
        x: viewport.physical.width / 2,
        y: viewport.physical.height / 2
    };
}

/**
 * Takes a point in the logical coordinate system and transforms it to the canvas coordinate system
 * @param point 
 * @param viewport 
 */
function transformPoint(point: Point, viewport: MapViewport): [number, number] {
    const physicalCenter = getPhysicalCenter(viewport);

    // we need to remember that the canvas coordinate system is flipped
    const x = physicalCenter.x + (point.x - viewport.center.x) * viewport.scale;
    const y = physicalCenter.y - (point.y - viewport.center.y) * viewport.scale;

    return [x, y];
}

function transformToLogical(point: [number, number], viewport: MapViewport): Point {
    const physicalCenter = getPhysicalCenter(viewport);

    const x = viewport.center.x + (point[0] - physicalCenter.x) / viewport.scale;
    const y = viewport.center.y - (point[1] - physicalCenter.y) / viewport.scale;

    return { x, y };
}

export function renderCenterCrosshair(ctx: CanvasRenderingContext2D, vp: MapViewport) {
    const centerCrosshairSize = 10;

    const physicalCenter = getPhysicalCenter(vp);

    ctx.save();

    ctx.lineWidth = 1;

    ctx.strokeStyle = '#00000080';

    ctx.beginPath();
    ctx.moveTo(physicalCenter.x - (centerCrosshairSize / 2), physicalCenter.y);
    ctx.lineTo(physicalCenter.x + (centerCrosshairSize / 2), physicalCenter.y);
    ctx.moveTo(physicalCenter.x, physicalCenter.y - (centerCrosshairSize / 2));
    ctx.lineTo(physicalCenter.x, physicalCenter.y + (centerCrosshairSize / 2));
    ctx.stroke();

    ctx.restore();
}

export function renderGrid(ctx: CanvasRenderingContext2D, vp: MapViewport, gridSpacing: number) {
    const edgeTopLeft = transformToLogical([0, 0], vp);
    const edgeBottomRight = transformToLogical([vp.physical.width, vp.physical.height], vp);

    const firstLineX = edgeTopLeft.x - (edgeTopLeft.x % gridSpacing);
    const firstLineY = edgeTopLeft.y - (edgeTopLeft.y % gridSpacing);
    
    const lastLineX = edgeBottomRight.x - (edgeBottomRight.x % gridSpacing);
    const lastLineY = edgeBottomRight.y - (edgeBottomRight.y % gridSpacing);

    ctx.save();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#0000001a';

    let shouldDrawCenterLineX = false,
        shouldDrawCenterLineY = false;

    ctx.beginPath();

    for (let x = firstLineX; x <= lastLineX; x += gridSpacing) {
        const [ physicalX, _ ] = transformPoint({ x, y: 0 }, vp);

        if (x === 0) 
            shouldDrawCenterLineX = true;

        ctx.moveTo(physicalX, 0);
        ctx.lineTo(physicalX, vp.physical.height);
    }

    for (let y = firstLineY; y >= lastLineY; y -= gridSpacing) {
        const [ _, physicalY ] = transformPoint({ x: 0, y }, vp);

        if (y === 0)
            shouldDrawCenterLineY = true;

        ctx.moveTo(0, physicalY);
        ctx.lineTo(vp.physical.width, physicalY);
    }

    ctx.stroke();

    if (shouldDrawCenterLineX || shouldDrawCenterLineY) {
        ctx.strokeStyle = '#ff000026';

        const [ physicalX, physicalY ] = transformPoint({ x: 0, y: 0 }, vp);

        ctx.beginPath();

        if (shouldDrawCenterLineX) {
            ctx.moveTo(physicalX, 0);
            ctx.lineTo(physicalX, vp.physical.height);
        }

        if (shouldDrawCenterLineY) {
            ctx.moveTo(0, physicalY);
            ctx.lineTo(vp.physical.width, physicalY);
        }

        ctx.stroke();
    }

    ctx.restore();
}

function renderMapPoint(ctx: CanvasRenderingContext2D, point: MapPoint, viewport: MapViewport, isHovering: boolean) {
    const [ x, y ] = transformPoint(point.point, viewport);

    ctx.save();

    ctx.fillStyle = 
        point.pointType === 'client' 
            ? isHovering ? '#be123c' : '#f43f5e' 
            : isHovering ? '#047857' : '#10b981';

    ctx.beginPath();
    ctx.arc(x, y, isHovering ? 6 : 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
}

const colors: Record<MapRegion['regionType'], string> = {
    "subscription-origin": "#ef4444",
    "subscription-both": "#f97316",
    "subscription-enclosing": "#eab308",
    "subscription-sps": "#84cc16",
    "subscription": "#06b6d4",
    "publication": "#8b5cf6"
}

function renderMapRegion(ctx: CanvasRenderingContext2D, region: MapRegion, viewport: MapViewport, isHovering: boolean) {
    ctx.save();

    ctx.lineWidth = 1;
    ctx.strokeStyle = colors[region.regionType];
    ctx.fillStyle = colors[region.regionType] + (region.regionType === 'publication' ? '1a' : '3a');

    ctx.beginPath();

    if (region.region.isPolygon) {
        const [ firstPoint, ...points] = region.region.points;

        const [ x, y ] = transformPoint(firstPoint, viewport);

        ctx.moveTo(x, y);

        for (const point of points) {
            const [ x, y ] = transformPoint(point, viewport);
            ctx.lineTo(x, y);
        }

        ctx.closePath();
    } else {
        const { center, radius } = region.region;

        const [ x, y ] = transformPoint(center, viewport);

        ctx.arc(x, y, radius * viewport.scale, 0, 2 * Math.PI);
    }

    ctx.stroke();
    ctx.fill();

    ctx.restore();
}

export function renderMapElement(ctx: CanvasRenderingContext2D, element: MapElement, viewport: MapViewport, isHovering: boolean) {
    switch (element.elementType) {
        case 'region':
            return renderMapRegion(ctx, element, viewport, isHovering);
        case 'point':
            return renderMapPoint(ctx, element, viewport, isHovering);
        default:
            throw new Error('Invalid element type');
    }
}

export function renderSPSSimulationEnvironment(ctx: CanvasRenderingContext2D, viewport: MapViewport, sps: SPSSimulation) {
    ctx.clearRect(0, 0, viewport.physical.width, viewport.physical.height);

    renderGrid(ctx, viewport, 100);

    renderCenterCrosshair(ctx, viewport);

    const subscriptions = sps.getSubscriptions();

    const subscriptionElementRegions = subscriptions.map(sub => sub.type === 'circle' ? {
        isPolygon: false,
        center: { x: sub.geometry.pos.x, y: sub.geometry.pos.y },
        radius: sub.geometry.r
    } satisfies CircularRegion : {
        isPolygon: true,
        points: sub.geometry.points.map(p => ({ x: p.x, y: p.y }))
    } satisfies PolygonRegion);

    const elements: MapElement[] = subscriptionElementRegions.map(region => ({
        elementType: 'region',
        region,
        regionType: 'subscription'
    }) satisfies MapElement);

    for (let i = 0; i < sps.nodes; i++) {
        const site = sps.getNodeSite(i);

        const el: MapElement = {
            elementType: 'point',
            point: {
                x: site[0],
                y: site[1]
            },
            pointType: 'matcher'
        }

        elements.push(el);
    }

    for (const element of elements) {
        renderMapElement(ctx, element, viewport, false);
    }
}

interface AdditionalRenderInfoForGraphic {
    isOriginRegion: boolean,
    isEnclosingRegion: boolean,
    isSPSDispatched: boolean
}

export function renderSPSSimulationEnvironment2(ctx: CanvasRenderingContext2D, viewport: MapViewport, sps: SPSSimulation) {
    ctx.clearRect(0, 0, viewport.physical.width, viewport.physical.height);

    renderGrid(ctx, viewport, 100);

    renderCenterCrosshair(ctx, viewport);

    const originNode = sps.getNodeForPoint(400, 400);
    const en = sps.getNodeNeighbors(originNode);
    const spsDispatched: number[] = [];

    const subscriptions = sps.getSubscriptions();

    const subscriptionsConsidered = subscriptions.filter(sub => sub.node !== originNode);

    const subRegion: SPSRegion = {
        type: 'circle',
        geometry: new SAT.Circle(new SAT.Vector(400, 400), 16 * 10)
    }

    for (const sub of subscriptionsConsidered) {
        const willSend = doesOverlap(sub, subRegion);
        if (willSend) {
            spsDispatched.push(sub.node);
        }
    }

    const subscriptionElementRegions = subscriptions.map(sub => sub.type === 'circle' ? {
        isPolygon: false,
        center: { x: sub.geometry.pos.x, y: sub.geometry.pos.y },
        radius: sub.geometry.r,
        isOriginRegion: sub.node === originNode,
        isEnclosingRegion: en.includes(sub.node),
        isSPSDispatched: spsDispatched.includes(sub.node)
    } satisfies CircularRegion & AdditionalRenderInfoForGraphic : {
        isPolygon: true,
        points: sub.geometry.points.map(p => ({ x: p.x, y: p.y })),
        isOriginRegion: sub.node === originNode,
        isEnclosingRegion: en.includes(sub.node),
        isSPSDispatched: spsDispatched.includes(sub.node)
    } satisfies PolygonRegion & AdditionalRenderInfoForGraphic);

    const elements: MapElement[] = subscriptionElementRegions.map(region => ({
        elementType: 'region',
        region,
        regionType: region.isSPSDispatched && region.isEnclosingRegion ? 'subscription-both' : region.isOriginRegion ? 'subscription-origin' : region.isEnclosingRegion ? 'subscription-enclosing' : region.isSPSDispatched ? 'subscription-sps' : 'subscription'
    }) satisfies MapElement);

    for (let i = 0; i < sps.nodes; i++) {
        const site = sps.getNodeSite(i);

        const el: MapElement = {
            elementType: 'point',
            point: {
                x: site[0],
                y: site[1]
            },
            pointType: 'client'
        }

        elements.push(el);
    }

    for (const element of elements) {
        renderMapElement(ctx, element, viewport, false);
    }
}