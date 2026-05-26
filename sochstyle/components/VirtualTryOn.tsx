'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { defaultOverlay, resolveOverlayForStyle, type TryOnOverlayConfig } from '@/lib/tryOnStyles';

type Style = {
  id: string;
  name: string;
};

type FaceTransform = {
  x: number;
  y: number;
  width: number;
  angle: number;
};

type NormalizedLandmark = {
  x: number;
  y: number;
  z?: number;
};

const WASM_BASE_PATH = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const FACE_LANDMARKER_MODEL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const MIN_FRAME_MS = 1000 / 24;
const MAX_MISSING_FRAMES = 10;

const lerp = (from: number, to: number, alpha: number) => from + (to - from) * alpha;

export default function VirtualTryOn() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const overlayImageRef = useRef<HTMLImageElement | null>(null);
  const overlayConfigRef = useRef<TryOnOverlayConfig>(defaultOverlay);
  const smoothTransformRef = useRef<FaceTransform | null>(null);
  const lastFrameTimeRef = useRef(0);
  const missingFramesRef = useRef(0);

  const [styles, setStyles] = useState<Style[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelReady, setModelReady] = useState(false);
  const [styleError, setStyleError] = useState<string | null>(null);

  const activeStyle = useMemo(
    () => styles.find((style) => style.id === selectedStyleId) ?? null,
    [selectedStyleId, styles]
  );
  const activeOverlay = useMemo(
    () => resolveOverlayForStyle(activeStyle?.name),
    [activeStyle]
  );

  useEffect(() => {
    let cancelled = false;
    const loadStyles = async () => {
      try {
        setStyleError(null);
        const response = await fetch('/api/styles');
        if (!response.ok) {
          const body = await response.json();
          throw new Error(body?.error ?? 'Failed to fetch styles');
        }
        const data: Style[] = await response.json();
        if (!cancelled) {
          setStyles(data);
          setSelectedStyleId((current) => current ?? data[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to fetch styles';
          setStyleError(message);
        }
      }
    };

    loadStyles();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    overlayConfigRef.current = activeOverlay;
    const image = new Image();
    image.src = activeOverlay.assetPath;
    image.onload = () => {
      overlayImageRef.current = image;
    };
    image.onerror = () => {
      overlayImageRef.current = null;
    };
  }, [activeOverlay]);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsCameraReady(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to access your camera.';
        setCameraError(message);
        setIsCameraReady(false);
      }
    };

    startCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initModel = async () => {
      try {
        setModelError(null);
        const vision = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: FACE_LANDMARKER_MODEL,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        if (!isMounted) {
          landmarker.close();
          return;
        }

        faceLandmarkerRef.current = landmarker;
        setModelReady(true);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load face model.';
        setModelError(message);
        setModelReady(false);
      }
    };

    initModel();

    return () => {
      isMounted = false;
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isCameraReady || !modelReady) {
      return;
    }

    let animationFrame = 0;

    const renderLoop = () => {
      animationFrame = requestAnimationFrame(renderLoop);
      const now = performance.now();
      if (now - lastFrameTimeRef.current < MIN_FRAME_MS) {
        return;
      }
      lastFrameTimeRef.current = now;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = faceLandmarkerRef.current;
      const image = overlayImageRef.current;

      if (!video || !canvas || !landmarker || !image) {
        return;
      }

      if (video.readyState < 2) {
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        return;
      }

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const results = landmarker.detectForVideo(video, now);
      const landmarks = results.faceLandmarks?.[0] as NormalizedLandmark[] | undefined;

      if (!landmarks) {
        missingFramesRef.current += 1;
        if (missingFramesRef.current > MAX_MISSING_FRAMES) {
          smoothTransformRef.current = null;
        }
        return;
      }

      missingFramesRef.current = 0;
      const transform = computeFaceTransform(landmarks, width, height, overlayConfigRef.current);
      if (!transform) {
        return;
      }

      const smoothed = smoothTransform(transform);
      drawOverlay(ctx, image, smoothed, overlayConfigRef.current);
    };

    animationFrame = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isCameraReady, modelReady]);

  const handleRetryCamera = async () => {
    setCameraError(null);
    setIsCameraReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraReady(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to access your camera.';
      setCameraError(message);
    }
  };

  const smoothTransform = (next: FaceTransform) => {
    const previous = smoothTransformRef.current;
    if (!previous) {
      smoothTransformRef.current = next;
      return next;
    }
    const smoothed: FaceTransform = {
      x: lerp(previous.x, next.x, 0.2),
      y: lerp(previous.y, next.y, 0.2),
      width: lerp(previous.width, next.width, 0.2),
      angle: lerp(previous.angle, next.angle, 0.2),
    };
    smoothTransformRef.current = smoothed;
    return smoothed;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="relative w-full overflow-hidden rounded-xl border bg-card shadow-sm">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        {!isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 px-6 text-center">
            <div>
              <p className="text-sm text-muted-foreground">
                Allow camera access to see live styling.
              </p>
              {cameraError && (
                <p className="mt-2 text-xs text-destructive">{cameraError}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Choose a hairstyle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value={selectedStyleId ?? undefined}
              onValueChange={(value) => setSelectedStyleId(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a style" />
              </SelectTrigger>
              <SelectContent>
                {styles.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {styleError && (
              <p className="text-xs text-destructive">{styleError}</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant={modelReady ? 'default' : 'secondary'}>
                {modelReady ? 'Model ready' : 'Loading model'}
              </Badge>
              <Badge variant={isCameraReady ? 'default' : 'secondary'}>
                {isCameraReady ? 'Camera on' : 'Camera off'}
              </Badge>
              <Badge variant="outline">{activeOverlay.label}</Badge>
            </div>
            {(cameraError || modelError) && (
              <p className="text-xs text-destructive">
                {cameraError ?? modelError}
              </p>
            )}
            {cameraError && (
              <Button variant="outline" size="sm" onClick={handleRetryCamera}>
                Retry camera
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tips for best results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Use even lighting and face the camera straight on.</p>
            <p>Keep your full forehead visible for the hairline anchor.</p>
            <p>Switch styles to see the overlay update instantly.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const computeFaceTransform = (
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  overlay: TryOnOverlayConfig
): FaceTransform | null => {
  const left = landmarks[234];
  const right = landmarks[454];
  const forehead = landmarks[10];

  if (!left || !right || !forehead) {
    return null;
  }

  const leftPoint = { x: left.x * width, y: left.y * height };
  const rightPoint = { x: right.x * width, y: right.y * height };
  const foreheadPoint = { x: forehead.x * width, y: forehead.y * height };

  const faceWidth = Math.hypot(rightPoint.x - leftPoint.x, rightPoint.y - leftPoint.y);
  if (!faceWidth) {
    return null;
  }

  const angle =
    Math.atan2(rightPoint.y - leftPoint.y, rightPoint.x - leftPoint.x) +
    (overlay.rotationDeg * Math.PI) / 180;

  const x = (leftPoint.x + rightPoint.x) / 2 + overlay.offset.x * faceWidth;
  const y = foreheadPoint.y + overlay.offset.y * faceWidth;

  return {
    x,
    y,
    width: faceWidth * overlay.scale,
    angle,
  };
};

const drawOverlay = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  transform: FaceTransform,
  overlay: TryOnOverlayConfig
) => {
  const imageWidth = transform.width;
  const imageHeight = (image.height / image.width) * imageWidth;
  const anchorX = overlay.anchor.x * imageWidth;
  const anchorY = overlay.anchor.y * imageHeight;

  ctx.save();
  ctx.translate(transform.x, transform.y);
  ctx.rotate(transform.angle);
  ctx.drawImage(image, -anchorX, -anchorY, imageWidth, imageHeight);
  ctx.restore();
};
