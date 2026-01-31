
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, Html } from "@react-three/drei";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/error-boundary";

function Model(props: any) {
  // Switched to a standard Ferrari model from Three.js examples as a "real luxury car" 
  // pending a specific Rolls Royce URL.
  const { scene } = useGLTF("https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/ferrari.glb");
  return <primitive object={scene} {...props} />;
}

export default function ThreeDCar() {
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
                <Model />
              </Stage>
            </PresentationControls>
          </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
