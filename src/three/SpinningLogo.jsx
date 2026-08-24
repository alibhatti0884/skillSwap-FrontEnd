import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A small reusable three.js "brand mark" — a faceted core icosahedron in
 * SkillSwap green with a slower-counter-rotating teal wireframe shell around
 * it, meant to read as an abstract "exchange/swap" motion rather than a
 * literal logo. Reused in two places per the app's request: the global API
 * loading indicator (GlobalApiLoader) and the video call connecting/ringing
 * screen (VideoCallModal) — same visual language, different contexts.
 *
 * Deliberately raw three.js (no react-three-fiber) to keep the dependency
 * footprint small; this owns its own render loop and disposes everything on
 * unmount so it's safe to mount/unmount freely (e.g. per call).
 */
export default function SpinningLogo({ size = 64, spin = true }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const coreGeometry = new THREE.IcosahedronGeometry(1.15, 0);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x10b981, // brand-500
      flatShading: true,
      metalness: 0.25,
      roughness: 0.45
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const shellGeometry = new THREE.IcosahedronGeometry(1.55, 1);
    const shellMaterial = new THREE.MeshBasicMaterial({
      color: 0x0d9488, // teal-600
      wireframe: true,
      transparent: true,
      opacity: 0.55
    });
    const shell = new THREE.Mesh(shellGeometry, shellMaterial);
    scene.add(shell);

    const keyLight = new THREE.PointLight(0xffffff, 1.4);
    keyLight.position.set(3, 3, 4);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));

    let frameId;
    const animate = () => {
      if (spin) {
        core.rotation.x += 0.014;
        core.rotation.y += 0.02;
        shell.rotation.x -= 0.008;
        shell.rotation.y -= 0.011;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      shellGeometry.dispose();
      shellMaterial.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, spin]);

  return <div ref={mountRef} style={{ width: size, height: size }} />;
}
