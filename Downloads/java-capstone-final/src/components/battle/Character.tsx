import { motion } from 'framer-motion';
import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Stars } from '@react-three/drei';
import * as THREE from 'three';

interface CharacterProps {
  type: 'player' | 'opponent';
  isAttacking?: boolean;
  isHit?: boolean;
  imageUrl?: string;
  characterId?: string;
}

// Sub-component for the 3D model
function ProceduralCharacter({ type, characterId, isAttacking, isHit }: CharacterProps) {
  const group = useRef<THREE.Group>(null);
  const isOpponent = type === 'opponent';
  
  // Animation loop
  useFrame((state, delta) => {
    if (group.current) {
      if (isHit) {
        group.current.position.x = Math.sin(state.clock.elapsedTime * 40) * 0.15;
        group.current.rotation.z = Math.sin(state.clock.elapsedTime * 40) * 0.05;
      } else {
        group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
      }
      
      // Floating animation for child meshes
      group.current.children.forEach((child, i) => {
        if (child.name === 'float') {
          child.position.y = Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
        }
        if (child.name === 'spin') {
          child.rotation.y += delta;
          child.rotation.z += delta * 0.5;
        }
      });
    }
  });

  const renderArthur = () => (
    <group>
      {/* Body */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.5, 1, 4, 16]} />
        <meshStandardMaterial color="#b45309" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#fcd34d" emissive="#fbbf24" emissiveIntensity={0.5} roughness={0.2} metalness={1} />
      </mesh>
      {/* Shoulder Pauldrons */}
      <mesh name="float" position={[-0.7, 0.8, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.3} metalness={0.9} />
      </mesh>
      <mesh name="float" position={[0.7, 0.8, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.4, 0.6, 0.4]} />
        <meshStandardMaterial color="#fcd34d" roughness={0.3} metalness={0.9} />
      </mesh>
      {/* Sword */}
      <mesh name="float" position={[0.8, 0, 0.5]} rotation={[Math.PI / 4, 0, -Math.PI / 8]}>
        <boxGeometry args={[0.1, 1.8, 0.2]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1} />
      </mesh>
      {/* Halo */}
      <mesh name="spin" position={[0, 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );

  const renderThane = () => (
    <group>
      {/* Bulky Body */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.8, 0.6, 1.5, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.6} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Glowing Eye Slit */}
      <mesh position={[0, 1.5, 0.26]}>
        <planeGeometry args={[0.3, 0.1]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Massive Shield */}
      <mesh name="float" position={[-0.8, 0.5, 0.5]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.2, 16]} />
        <meshStandardMaterial color="#475569" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh name="float" position={[-0.8, 0.5, 0.61]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 8]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
    </group>
  );

  const renderViolet = () => (
    <group>
      {/* Sleek Body */}
      <mesh position={[0, 0.2, 0]}>
        <capsuleGeometry args={[0.3, 1.2, 4, 16]} />
        <meshStandardMaterial color="#1e1b4b" roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#7e22ce" emissiveIntensity={0.8} />
      </mesh>
      {/* Floating Daggers */}
      <mesh name="spin" position={[-0.6, 0.5, 0.5]} rotation={[Math.PI / 3, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.1, 1, 4]} />
        <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1} />
      </mesh>
      <mesh name="spin" position={[0.6, 0.5, 0.5]} rotation={[Math.PI / 3, 0, Math.PI / 4]}>
        <coneGeometry args={[0.1, 1, 4]} />
        <meshStandardMaterial color="#c084fc" emissive="#a855f7" emissiveIntensity={1} />
      </mesh>
      {/* Shadow Rings */}
      <mesh name="spin" position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.02, 16, 32]} />
        <meshBasicMaterial color="#a855f7" />
      </mesh>
      <mesh name="spin" position={[0, 0.5, 0]} rotation={[Math.PI / 3, Math.PI/4, 0]}>
        <torusGeometry args={[1, 0.02, 16, 32]} />
        <meshBasicMaterial color="#c084fc" />
      </mesh>
    </group>
  );

  const renderKrixi = () => (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <capsuleGeometry args={[0.25, 0.8, 4, 16]} />
        <meshStandardMaterial color="#fdf4ff" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f0abfc" emissive="#e879f9" emissiveIntensity={0.6} />
      </mesh>
      {/* Pixie Wings */}
      <mesh name="float" position={[-0.4, 0.5, -0.2]} rotation={[0, 0, Math.PI / 6]}>
        <planeGeometry args={[0.6, 1]} />
        <meshBasicMaterial color="#a7f3d0" side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
      <mesh name="float" position={[0.4, 0.5, -0.2]} rotation={[0, 0, -Math.PI / 6]}>
        <planeGeometry args={[0.6, 1]} />
        <meshBasicMaterial color="#a7f3d0" side={THREE.DoubleSide} transparent opacity={0.7} />
      </mesh>
      {/* Magic Orb */}
      <mesh name="spin" position={[0.5, 0.2, 0.5]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#34d399" emissive="#10b981" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );

  const renderZanis = () => (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.4, 0.3, 1.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.3, 0.4, 0.3]} />
        <meshStandardMaterial color="#bfdbfe" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Spear */}
      <mesh name="float" position={[0.6, 0.5, 0.4]} rotation={[Math.PI / 6, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.05, 0.05, 2.5, 8]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh name="float" position={[0.8, 1.6, 0.4]} rotation={[Math.PI / 6, 0, -Math.PI / 6]}>
        <coneGeometry args={[0.15, 0.6, 4]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={1} />
      </mesh>
      <mesh name="spin" position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.05, 16, 32]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
    </group>
  );

  const renderMaloch = () => (
    <group>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.9, 1.2, 0.6]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#450a0a" emissive="#b91c1c" emissiveIntensity={0.8} />
      </mesh>
      {/* Demon Horns */}
      <mesh position={[-0.2, 1.7, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.1, 0.5, 4]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
      <mesh position={[0.2, 1.7, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.1, 0.5, 4]} />
        <meshStandardMaterial color="#fca5a5" />
      </mesh>
      {/* Massive Cleaver */}
      <mesh name="float" position={[-0.8, 0.5, 0.5]} rotation={[Math.PI / 4, 0, Math.PI / 8]}>
        <boxGeometry args={[0.2, 2.2, 0.4]} />
        <meshStandardMaterial color="#b91c1c" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );

  const renderTulen = () => (
    <group>
      <mesh position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.3, 1.0, 4, 16]} />
        <meshStandardMaterial color="#fef3c7" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#fde047" emissive="#eab308" emissiveIntensity={1} />
      </mesh>
      {/* Lightning Orbs */}
      <mesh name="spin" position={[-0.8, 0.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2} />
      </mesh>
      <mesh name="spin" position={[0.8, 0.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2} />
      </mesh>
      <mesh name="spin" position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fef08a" emissive="#fde047" emissiveIntensity={2} />
      </mesh>
    </group>
  );

  return (
    <group ref={group} rotation-y={isOpponent ? -Math.PI / 5 : Math.PI / 5} scale={isAttacking ? 1.2 : 1}>
      <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
        {characterId === 'thane' ? renderThane() : 
         characterId === 'violet' ? renderViolet() : 
         characterId === 'krixi' ? renderKrixi() :
         characterId === 'zanis' ? renderZanis() : 
         characterId === 'maloch' ? renderMaloch() :
         characterId === 'tulen' ? renderTulen() : renderArthur()}
      </Float>
    </group>
  );
}

export function Character({ type, isAttacking, isHit, characterId }: CharacterProps) {
  const isOpponent = type === 'opponent';

  // We still use motion.div for the 2D positioning of the canvas and attack lunges
  const attackAnimation: any = {
    x: isOpponent ? [-20, 40, 0] : [20, -40, 0],
    scale: 1.1,
    transition: { duration: 0.4 }
  };

  const animationState = isAttacking ? attackAnimation : {};

  return (
    <div className="relative flex flex-col items-center justify-center w-[300px] h-[300px]">
      <motion.div
        animate={animationState}
        className="w-full h-full relative z-10"
      >
        <Canvas camera={{ position: [0, 1, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <spotLight position={[-10, 10, -5]} intensity={0.5} color="blue" />
          
          <ProceduralCharacter type={type} characterId={characterId} isAttacking={isAttacking} isHit={isHit} />
          
          <ContactShadows position={[0, -1.5, 0]} opacity={0.5} scale={10} blur={2} far={4} color={isOpponent ? "#7f1d1d" : "#1e3a8a"} />
          {/* Subtle star field for magic effect */}
          <Stars radius={50} depth={50} count={500} factor={4} saturation={0} fade speed={1} />
        </Canvas>
      </motion.div>
    </div>
  );
}
