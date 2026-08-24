import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * A distinct three.js piece from SpinningLogo — a core node with several
 * smaller nodes orbiting around it, connected by thin lines, meant to read
 * as "a network of people exchanging skills" rather than a static logo.
 * Used on the Dashboard's promo banner.
 */
export default function OrbitField({ width = 220, height = 150 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const coreGeo = new THREE.SphereGeometry(0.5, 20, 20);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x34d399,
      emissiveIntensity: 0.7,
      roughness: 0.35
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    const nodeGeo = new THREE.SphereGeometry(0.16, 14, 14);
    const nodeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });

    const NODE_COUNT = 6;
    const nodes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const angle = (i / NODE_COUNT) * Math.PI * 2;
      const radius = 2.1;
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      mesh.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.5,
        Math.sin(angle * 1.4) * 0.9
      );
      group.add(mesh);

      const points = [new THREE.Vector3(0, 0, 0), mesh.position.clone()];
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      group.add(line);

      nodes.push({ mesh, geo, angle, radius, speed: 0.0035 + Math.random() * 0.0025 });
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const keyLight = new THREE.PointLight(0xffffff, 1.1);
    keyLight.position.set(3, 3, 5);
    scene.add(keyLight);

    let frameId;
    const animate = () => {
      group.rotation.y += 0.0025;
      nodes.forEach((n) => {
        n.angle += n.speed;
        n.mesh.position.set(
          Math.cos(n.angle) * n.radius,
          Math.sin(n.angle) * n.radius * 0.5,
          Math.sin(n.angle * 1.4) * 0.9
        );
        const pos = n.geo.attributes.position;
        pos.setXYZ(1, n.mesh.position.x, n.mesh.position.y, n.mesh.position.z);
        pos.needsUpdate = true;
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
      lineMat.dispose();
      nodes.forEach((n) => n.geo.dispose());
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  return <div ref={mountRef} style={{ width, height }} />;
}
