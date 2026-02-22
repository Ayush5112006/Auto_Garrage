import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Float } from "@react-three/drei";
import * as THREE from "three";

interface ModelProps {
    modelPath: string;
}

function RotatingModel({ modelPath }: ModelProps) {
    const { scene } = useGLTF(modelPath);
    const meshRef = useRef<THREE.Group>(null);

    useFrame((state, delta) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += delta * 0.1;
    });

    return (
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <primitive
                ref={meshRef}
                object={scene.clone()}
                scale={1.2}
                position={[0, -0.5, 0]}
            />
        </Float>
    );
}

const BackgroundRotatingCar = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-30" />

            <div className="absolute inset-0 opacity-20">
                <Canvas
                    camera={{ position: [0, 0, 15], fov: 40 }}
                    gl={{ antialias: true, alpha: true }}
                >
                    <Suspense fallback={null}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} intensity={1} />
                        <RotatingModel modelPath="/models/ferrari.glb" />
                    </Suspense>
                </Canvas>
            </div>
        </div>
    );
};

export default BackgroundRotatingCar;
