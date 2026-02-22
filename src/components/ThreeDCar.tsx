
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, Html } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import * as THREE from "three";

interface ModelProps {
  modelPath: string;
  color?: string;
}

function Model({ modelPath, color }: ModelProps) {
  const { scene } = useGLTF(modelPath);

  useEffect(() => {
    if (color) {
      // Apply color to all meshes in the scene
      scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // Clone material to avoid affecting other instances
          child.material = child.material.clone();
          // Set the color
          child.material.color = new THREE.Color(color);
          child.material.needsUpdate = true;
        }
      });
    }
  }, [scene, color]);

  return <primitive object={scene.clone()} />;
}

interface ThreeDCarProps {
  modelPath?: string;
  color?: string;
}

export default function ThreeDCar({ modelPath = "/models/ferrari.glb", color }: ThreeDCarProps) {
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <ErrorBoundary>
        <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }} style={{ position: "absolute" }}>
          <Suspense fallback={
            <Html center>
              <div className="flex flex-col items-center gap-2 text-primary backdrop-blur-md bg-background/30 p-4 rounded-xl border border-primary/20">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Loading 3D Experience...</span>
              </div>
            </Html>
          }>
            <PresentationControls speed={1.5} global zoom={0.5} polar={[-0.1, Math.PI / 4]}>
              <Stage environment="city" intensity={0.6} shadows={false}>
                <Model modelPath={modelPath} color={color} />
              </Stage>
            </PresentationControls>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
