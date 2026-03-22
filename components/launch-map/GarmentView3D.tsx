'use client';

import { useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const TEXTURE_SIZE = 512;
const DEFAULT_COLOR = '#1f2937';

/** Dessine la silhouette d’un T-shirt (encolure crew, manches courtes, corps, ourlet) pour alphaMap */
function drawTshirtSilhouette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const cx = w * 0.5;
  const top = h * 0.04;
  const neckBottom = top + h * 0.09;
  const shoulderY = top + h * 0.02;
  const bodyTopY = top + h * 0.18;
  const bottom = h * 0.96;
  const bodyLeft = w * 0.14;
  const bodyRight = w * 0.86;
  const neckHalfW = w * 0.12;

  ctx.beginPath();
  ctx.moveTo(cx - neckHalfW, shoulderY);
  ctx.bezierCurveTo(cx - neckHalfW * 0.8, neckBottom, cx, neckBottom + h * 0.008, cx, neckBottom);
  ctx.bezierCurveTo(cx, neckBottom + h * 0.008, cx + neckHalfW * 0.8, neckBottom, cx + neckHalfW, shoulderY);
  ctx.lineTo(bodyRight, bodyTopY);
  ctx.lineTo(bodyRight, bottom);
  ctx.lineTo(bodyLeft, bottom);
  ctx.lineTo(bodyLeft, bodyTopY);
  ctx.closePath();
  ctx.fillStyle = 'white';
  ctx.fill();
}

/** Géométrie type "T-shirt porté" : plan courbé avec volume poitrine/épaules, sans mannequin */
function createWornShirtGeometry(width: number, height: number, segmentsW: number, segmentsH: number): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(width, height, segmentsW, segmentsH);
  const pos = geo.attributes.position;
  if (!pos) return geo;

  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const x = v.x / (width / 2);
    const y = v.y / (height / 2);

    const chestBulge = 0.18 * Math.exp(-(x * x * 1.2 + (y + 0.1) * (y + 0.1)));
    const shoulderCurve = y > 0 ? 0.1 * (1 - Math.pow((y - 0.25) / 0.75, 2)) : 0;
    const sideFold = -0.06 * (1 - Math.exp(-x * x * 4));
    const bottomSoft = y < -0.55 ? 0.04 * (y + 0.55) * (y + 0.55) : 0;

    v.z = chestBulge + shoulderCurve + sideFold + bottomSoft;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/** Crée une texture alpha en forme de T-shirt (blanc = visible, noir = transparent) */
function createTshirtAlphaTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  drawTshirtSilhouette(ctx, TEXTURE_SIZE, TEXTURE_SIZE);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function drawDesignOnCanvas(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  placement: { x: number; y: number; scale: number }
) {
  const size = (TEXTURE_SIZE * 0.4 * placement.scale) / 100;
  const w = Math.min(size, img.width * (size / img.height));
  const h = (img.height / img.width) * w;
  const x = (placement.x / 100) * TEXTURE_SIZE - w / 2;
  const y = (placement.y / 100) * TEXTURE_SIZE - h / 2;
  ctx.drawImage(img, x, y, w, h);
}

function drawCanvas(
  canvas: HTMLCanvasElement,
  designImageUrl: string | null,
  placement: { x: number; y: number; scale: number },
  baseColor: string,
  onReady: (loadedImage?: HTMLImageElement) => void,
  cachedImage: HTMLImageElement | null,
  mockupImageUrl: string | null
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;

  const drawBase = () => {
    if (mockupImageUrl) {
      const baseImg = new Image();
      baseImg.crossOrigin = 'anonymous';
      baseImg.onload = () => {
        ctx.drawImage(baseImg, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
        drawDesignIfAny();
      };
      baseImg.onerror = () => drawGradientBase();
      baseImg.src = mockupImageUrl;
    } else {
      drawGradientBase();
      drawDesignIfAny();
    }
  };

  const drawGradientBase = () => {
    const gradient = ctx.createLinearGradient(0, 0, 0, TEXTURE_SIZE);
    gradient.addColorStop(0, '#e5e7eb');
    gradient.addColorStop(0.4, baseColor);
    gradient.addColorStop(1, '#d1d5db');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  };

  const drawDesignIfAny = () => {
    if (!designImageUrl) {
      onReady();
      return;
    }

    const drawDesign = (img: HTMLImageElement) => {
      drawDesignOnCanvas(ctx, img, placement);
      onReady(img);
    };

    if (cachedImage && cachedImage.src === designImageUrl && cachedImage.complete) {
      drawDesign(cachedImage);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawDesign(img);
    img.onerror = () => onReady();
    img.src = designImageUrl;
  };

  drawBase();
}

interface ShirtMeshProps {
  designImageUrl: string | null;
  placement: { x: number; y: number; scale: number };
  garmentColor?: string;
  mockupImageUrl?: string | null;
}

function ShirtMesh({ designImageUrl, placement, garmentColor = DEFAULT_COLOR, mockupImageUrl = null }: ShirtMeshProps) {
  const canvas = useMemo(() => {
    if (typeof document === 'undefined') return null;
    return document.createElement('canvas');
  }, []);
  const imageCacheRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (designImageUrl) imageCacheRef.current = null;
  }, [designImageUrl]);

  useEffect(() => {
    return () => {
      imageCacheRef.current = null;
    };
  }, []);

  const texture = useMemo(() => {
    if (!canvas) return null;
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [canvas]);

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  useEffect(() => {
    if (!canvas || !texture) return;
    drawCanvas(canvas, designImageUrl, placement, garmentColor, (loadedImage) => {
      if (loadedImage) imageCacheRef.current = loadedImage;
      texture.needsUpdate = true;
    }, imageCacheRef.current, mockupImageUrl ?? null);
  }, [canvas, texture, designImageUrl, placement, garmentColor, mockupImageUrl]);

  const geometry = useMemo(
    () => createWornShirtGeometry(2, 2.4, 48, 48),
    []
  );

  const alphaMap = useMemo(() => createTshirtAlphaTexture(), []);

  if (!texture) return null;

  return (
    <mesh rotation={[0, 0, 0]} position={[0, 0, 0]}>
      <primitive object={geometry} attach="geometry" />
      <meshStandardMaterial
        map={texture}
        alphaMap={alphaMap}
        transparent
        side={THREE.DoubleSide}
        roughness={0.7}
        metalness={0.02}
        flatShading={false}
      />
    </mesh>
  );
}

interface GarmentView3DProps {
  designImageUrl: string | null;
  placement: { x: number; y: number; scale: number };
  garmentColor?: string;
  mockupImageUrl?: string | null;
  className?: string;
}

export function GarmentView3D({ designImageUrl, placement, garmentColor, mockupImageUrl, className }: GarmentView3DProps) {
  return (
    <div className={className} style={{ minHeight: 380, background: '#e8eaed' }}>
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 38 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#e8eaed']} />
        <fog attach="fog" args={['#e8eaed', 8, 16]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 2, 5]} intensity={1.1} castShadow />
        <directionalLight position={[-2.5, 1, 3]} intensity={0.35} />
        <directionalLight position={[0, -1, -2]} intensity={0.25} />
        <pointLight position={[0, 0, 2]} intensity={0.3} distance={8} />
        <ShirtMesh designImageUrl={designImageUrl} placement={placement} garmentColor={garmentColor} mockupImageUrl={mockupImageUrl} />
        <OrbitControls
          target={[0, 0, 0]}
          enablePan={false}
          minPolarAngle={Math.PI * 0.2}
          maxPolarAngle={Math.PI * 0.8}
          minDistance={3.5}
          maxDistance={8}
        />
      </Canvas>
    </div>
  );
}
