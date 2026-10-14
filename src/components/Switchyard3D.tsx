/**
 * SAT-TWIN: Navigable 3D Switchyard Scene (Three.js)
 * High-fidelity 3D digital image rendering of Sattenapalli 400/220 kV switchyard.
 * Features:
 * - 400 kV & 220 kV lattice steel gantries and conductors
 * - 3 x 315 MVA Power Transformers with cooling radiators, fans, conservators, blast walls
 * - 125 MVAR Shunt Reactor
 * - SF6 live-tank circuit breakers with dynamic open/close state indication
 * - Disconnectors and surge arresters
 * - Control & Relay Building (CRB)
 * - Interactive raycasting, click-to-inspect, camera presets
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SubstationAsset } from '../types/substation';
import { TelemetryState } from '../services/telemetryEngine';
import { Camera, Eye, Focus, RefreshCw, ZoomIn, ZoomOut, Compass, Sun, Moon, Clock } from 'lucide-react';

export type LightMode = 'AUTO' | 'DAY' | 'NIGHT';

interface Switchyard3DProps {
  telemetry: TelemetryState;
  assets: SubstationAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (assetId: string) => void;
}

export const Switchyard3D: React.FC<Switchyard3DProps> = ({
  telemetry,
  assets,
  selectedAssetId,
  onSelectAsset,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<SubstationAsset | null>(null);
  const [activePreset, setActivePreset] = useState<string>('aerial');
  const [lightMode, setLightMode] = useState<LightMode>('AUTO');

  // Internal Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const interactableObjects = useRef<Map<THREE.Object3D, string>>(new Map());
  const selectedMeshGroup = useRef<THREE.Group | null>(null);
  const fanMeshes = useRef<THREE.Mesh[]>([]);

  // Lighting refs for dynamic updates
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const floodlightsRef = useRef<THREE.PointLight[]>([]);
  const floodlightLampsRef = useRef<THREE.Mesh[]>([]);

  // Orbit controls state
  const isInteracting = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const spherical = useRef({ radius: 75, theta: Math.PI / 4, phi: Math.PI / 3.2 });
  const targetLookAt = useRef(new THREE.Vector3(0, 4, 0));

  // Determine daytime vs nighttime using simulated system time (IST)
  const istHour = (() => {
    try {
      const istDate = new Date(telemetry.timestamp);
      const hourStr = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        hour12: false,
      }).format(istDate);
      return parseInt(hourStr, 10) || 12;
    } catch {
      return 12;
    }
  })();

  const autoIsDay = istHour >= 6 && istHour < 18;
  const effectiveIsDay = lightMode === 'DAY' ? true : lightMode === 'NIGHT' ? false : autoIsDay;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(effectiveIsDay ? 0x1e293b : 0x050914);
    scene.fog = new THREE.FogExp2(effectiveIsDay ? 0x1e293b : 0x050914, effectiveIsDay ? 0.005 : 0.009);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 500);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting Setup (Auto / Day / Night)
    // Ambient light: Bright clean daylight in day, dark atmospheric sky ambient at night
    const ambientLight = new THREE.AmbientLight(
      effectiveIsDay ? 0xffffff : 0x0b132b,
      effectiveIsDay ? 0.85 : 0.16
    );
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Directional light: Warm sunlight during day, cool subtle moonlight at night
    const dirLight = new THREE.DirectionalLight(
      effectiveIsDay ? 0xfff8e7 : 0x93c5fd,
      effectiveIsDay ? 1.25 : 0.25
    );
    dirLight.position.set(60, 80, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 250;
    dirLight.shadow.camera.left = -60;
    dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60;
    dirLight.shadow.camera.bottom = -60;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Switchyard Floodlights around key assets (ICTs, Gantries, CRB, Busbars)
    const floodlightDefs = [
      { pos: [-45, 18, -35], color: 0x38bdf8, name: 'West 400kV Pylon & Reactor' },
      { pos: [45, 18, 35], color: 0xfbbf24, name: 'East 220kV Pylon & Feeders' },
      { pos: [0, 16, 0], color: 0xf8fafc, name: 'Central Power Transformers ICT 1-3' },
      { pos: [38, 14, -4], color: 0x38bdf8, name: 'Control & Relay Building (CRB)' },
      { pos: [0, 20, -22], color: 0xfff7ed, name: '400kV Main Busbar Gantry' },
    ];

    floodlightsRef.current = [];
    floodlightLampsRef.current = [];

    const mastMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

    floodlightDefs.forEach((fDef) => {
      // 1. Point Light for illumination
      const pLight = new THREE.PointLight(fDef.color, effectiveIsDay ? 0.05 : 2.2, 85, 2);
      pLight.position.set(fDef.pos[0], fDef.pos[1], fDef.pos[2]);
      scene.add(pLight);
      floodlightsRef.current.push(pLight);

      // 2. Physical Floodlight Mast Tower Structure & Luminaire Head
      const mastGroup = new THREE.Group();
      const poleGeom = new THREE.CylinderGeometry(0.2, 0.35, fDef.pos[1], 8);
      const pole = new THREE.Mesh(poleGeom, mastMat);
      pole.position.set(0, fDef.pos[1] / 2, 0);
      pole.castShadow = true;
      mastGroup.add(pole);

      // Luminaire Crossarm Bracket
      const bracketGeom = new THREE.BoxGeometry(1.4, 0.2, 0.5);
      const bracket = new THREE.Mesh(bracketGeom, mastMat);
      bracket.position.set(0, fDef.pos[1] - 0.2, 0);
      mastGroup.add(bracket);

      // Emissive Luminaire Lamp Fixture
      const lampGeom = new THREE.SphereGeometry(0.35, 12, 12);
      const lampMat = new THREE.MeshStandardMaterial({
        color: fDef.color,
        emissive: effectiveIsDay ? 0x1e293b : fDef.color,
        emissiveIntensity: effectiveIsDay ? 0.0 : 1.8,
        roughness: 0.2,
      });
      const lamp = new THREE.Mesh(lampGeom, lampMat);
      lamp.position.set(0, fDef.pos[1] - 0.1, 0);
      mastGroup.add(lamp);
      floodlightLampsRef.current.push(lamp);

      mastGroup.position.set(fDef.pos[0], 0, fDef.pos[2]);
      scene.add(mastGroup);
    });

    // 5. Environment & Switchyard Ground
    buildGroundAndFencing(scene);

    // 6. Gantries, Overhead Busbars & Structures
    buildSwitchyardStructures(scene);

    // 7. Equipments (Transformers, Breakers, Reactor, Control Building)
    buildElectricalEquipments(scene);

    // Selection ring group
    const selGroup = new THREE.Group();
    const selRingGeom = new THREE.RingGeometry(2.8, 3.2, 32);
    selRingGeom.rotateX(-Math.PI / 2);
    const selRingMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const selRing = new THREE.Mesh(selRingGeom, selRingMat);
    selGroup.add(selRing);
    selGroup.visible = false;
    scene.add(selGroup);
    selectedMeshGroup.current = selGroup;

    // 8. Event Listeners for Interaction
    const handlePointerDown = (e: MouseEvent) => {
      isInteracting.current = true;
      pointerStart.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (isInteracting.current) {
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        pointerStart.current = { x: e.clientX, y: e.clientY };

        spherical.current.theta -= dx * 0.006;
        spherical.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.current.phi - dy * 0.006));
        updateCameraPosition();
      } else {
        // Raycast for hover
        checkRaycast(e);
      }
    };

    const handlePointerUp = () => {
      isInteracting.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.current.radius = Math.max(15, Math.min(140, spherical.current.radius + e.deltaY * 0.06));
      updateCameraPosition();
    };

    const handleClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const targets = Array.from(interactableObjects.current.keys());
      const intersects = raycaster.intersectObjects(targets, true);

      if (intersects.length > 0) {
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !interactableObjects.current.has(cur)) {
          cur = cur.parent;
        }
        if (cur) {
          const assetId = interactableObjects.current.get(cur);
          if (assetId) {
            onSelectAsset(assetId);
          }
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });
    dom.addEventListener('click', handleClick);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 9. Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Spin cooling fans if transformers are active
      fanMeshes.current.forEach((fan) => {
        fan.rotation.y += delta * 6;
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      dom.removeEventListener('click', handleClick);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Update selection highlight when selectedAssetId changes
  useEffect(() => {
    if (!selectedMeshGroup.current) return;
    if (!selectedAssetId) {
      selectedMeshGroup.current.visible = false;
      return;
    }

    const asset = assets.find((a) => a.id === selectedAssetId);
    if (asset) {
      selectedMeshGroup.current.position.set(asset.position3D[0], 0.1, asset.position3D[2]);
      selectedMeshGroup.current.visible = true;

      // Smoothly pan camera focus toward asset
      targetLookAt.current.set(asset.position3D[0], 3, asset.position3D[2]);
      updateCameraPosition();
    }
  }, [selectedAssetId, assets]);

  // Dynamic reactive lighting update when mode or time changes
  useEffect(() => {
    if (!sceneRef.current || !ambientLightRef.current || !dirLightRef.current) return;
    const scene = sceneRef.current;
    const ambient = ambientLightRef.current;
    const sun = dirLightRef.current;

    if (effectiveIsDay) {
      // Daytime: Bright clear daytime sky
      scene.background = new THREE.Color(0x1e293b);
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color.set(0x1e293b);
        (scene.fog as THREE.FogExp2).density = 0.005;
      }
      ambient.color.set(0xffffff);
      ambient.intensity = 0.85;

      sun.color.set(0xfff8e7);
      sun.intensity = 1.25;

      floodlightsRef.current.forEach((light) => {
        light.intensity = 0.05;
      });
      floodlightLampsRef.current.forEach((lamp) => {
        if (lamp.material instanceof THREE.MeshStandardMaterial) {
          lamp.material.emissive.set(0x1e293b);
          lamp.material.emissiveIntensity = 0.0;
        }
      });
    } else {
      // Nighttime: Dark atmospheric sky with bright floodlights
      scene.background = new THREE.Color(0x050914);
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color.set(0x050914);
        (scene.fog as THREE.FogExp2).density = 0.009;
      }
      ambient.color.set(0x0b132b);
      ambient.intensity = 0.16;

      sun.color.set(0x93c5fd);
      sun.intensity = 0.25;

      floodlightsRef.current.forEach((light, i) => {
        light.intensity = i === 2 ? 2.4 : 2.0;
      });
      floodlightLampsRef.current.forEach((lamp, i) => {
        if (lamp.material instanceof THREE.MeshStandardMaterial) {
          lamp.material.emissive.set(i % 2 === 0 ? 0x38bdf8 : 0xfef08a);
          lamp.material.emissiveIntensity = 1.8;
        }
      });
    }
  }, [effectiveIsDay]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { radius, theta, phi } = spherical.current;
    const x = targetLookAt.current.x + radius * Math.sin(phi) * Math.sin(theta);
    const y = targetLookAt.current.y + radius * Math.cos(phi);
    const z = targetLookAt.current.z + radius * Math.sin(phi) * Math.cos(theta);

    cameraRef.current.position.set(x, y, z);
    cameraRef.current.lookAt(targetLookAt.current);
  };

  const checkRaycast = (e: MouseEvent) => {
    if (!rendererRef.current || !cameraRef.current) return;
    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const targets = Array.from(interactableObjects.current.keys());
    const intersects = raycaster.intersectObjects(targets, true);

    if (intersects.length > 0) {
      let cur: THREE.Object3D | null = intersects[0].object;
      while (cur && !interactableObjects.current.has(cur)) {
        cur = cur.parent;
      }
      if (cur) {
        const id = interactableObjects.current.get(cur);
        const asset = assets.find((a) => a.id === id);
        setHoveredAsset(asset || null);
        return;
      }
    }
    setHoveredAsset(null);
  };

  const setCameraPreset = (preset: string) => {
    setActivePreset(preset);
    switch (preset) {
      case 'aerial':
        targetLookAt.current.set(0, 4, 0);
        spherical.current = { radius: 85, theta: Math.PI / 4, phi: Math.PI / 3.4 };
        break;
      case '400kv':
        targetLookAt.current.set(0, 6, -20);
        spherical.current = { radius: 50, theta: 0.1, phi: Math.PI / 3.8 };
        break;
      case 'transformers':
        targetLookAt.current.set(0, 3, 0);
        spherical.current = { radius: 42, theta: Math.PI / 2.2, phi: Math.PI / 3.2 };
        break;
      case '220kv':
        targetLookAt.current.set(0, 5, 24);
        spherical.current = { radius: 50, theta: Math.PI, phi: Math.PI / 3.8 };
        break;
      case 'reactor':
        targetLookAt.current.set(-36, 4, -18);
        spherical.current = { radius: 30, theta: -Math.PI / 3, phi: Math.PI / 3.6 };
        break;
      case 'control_room':
        targetLookAt.current.set(38, 3, -4);
        spherical.current = { radius: 32, theta: 2.2, phi: Math.PI / 3.5 };
        break;
    }
    updateCameraPosition();
  };

  // Switchyard Ground and Road Construction
  const buildGroundAndFencing = (scene: THREE.Scene) => {
    // Crushed gravel switchyard yard ground
    const groundGeom = new THREE.PlaneGeometry(120, 100);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Concrete vehicle access road
    const roadGeom = new THREE.PlaneGeometry(110, 6);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const road = new THREE.Mesh(roadGeom, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, 6);
    road.receiveShadow = true;
    scene.add(road);

    // Concrete Plinths for Transformers
    [-18, 0, 18].forEach((x) => {
      const plinthGeom = new THREE.BoxGeometry(10, 0.6, 9);
      const plinthMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const plinth = new THREE.Mesh(plinthGeom, plinthMat);
      plinth.position.set(x, 0.3, 0);
      plinth.receiveShadow = true;
      scene.add(plinth);
    });

    // Fire protection blast walls between 315 MVA transformers
    [-9, 9].forEach((x) => {
      const wallGeom = new THREE.BoxGeometry(0.8, 7.5, 12);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
      const wall = new THREE.Mesh(wallGeom, wallMat);
      wall.position.set(x, 3.75, 0);
      wall.castShadow = true;
      wall.receiveShadow = true;
      scene.add(wall);
    });

    // Perimeter Security Fence posts
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    for (let x = -55; x <= 55; x += 10) {
      [-48, 48].forEach((z) => {
        const postGeom = new THREE.CylinderGeometry(0.12, 0.12, 3.5);
        const post = new THREE.Mesh(postGeom, fenceMat);
        post.position.set(x, 1.75, z);
        scene.add(post);
      });
    }
  };

  // Structural Steel Gantries & Overhead Conductors
  const buildSwitchyardStructures = (scene: THREE.Scene) => {
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });

    // Helper to create a lattice gantry tower
    const createGantry = (x: number, z: number, height: number, width: number) => {
      const gantryGroup = new THREE.Group();

      // Left leg
      const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, height, 0.6), steelMat);
      leg1.position.set(-width / 2, height / 2, 0);
      leg1.castShadow = true;
      gantryGroup.add(leg1);

      // Right leg
      const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, height, 0.6), steelMat);
      leg2.position.set(width / 2, height / 2, 0);
      leg2.castShadow = true;
      gantryGroup.add(leg2);

      // Crossarm beam
      const beam = new THREE.Mesh(new THREE.BoxGeometry(width + 2, 0.8, 0.8), steelMat);
      beam.position.set(0, height - 0.5, 0);
      beam.castShadow = true;
      gantryGroup.add(beam);

      // Diagonal cross-brace ties
      const braceMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });
      const brace1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, Math.sqrt(width ** 2 + height ** 2)), braceMat);
      brace1.rotation.z = Math.atan2(height, width);
      brace1.position.set(0, height / 2, 0);
      gantryGroup.add(brace1);

      gantryGroup.position.set(x, 0, z);
      scene.add(gantryGroup);
      return gantryGroup;
    };

    // 400 kV Gantries (tall, 14m)
    [-40, -18, 0, 18, 40].forEach((x) => {
      createGantry(x, -26, 14, 12);
      createGantry(x, -16, 14, 12);
    });

    // 220 kV Gantries (medium, 10m)
    [-40, -18, 0, 18, 40].forEach((x) => {
      createGantry(x, 18, 10, 10);
      createGantry(x, 32, 10, 10);
    });

    // Conductors spanning along busbars (Aluminum Quad-Moose / Twin-Zebra)
    const conductorMat400 = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const conductorMat220 = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });

    // 400 kV Main Bus 1 & 2 wires
    [-24, -20].forEach((z, idx) => {
      const wireGeom = new THREE.CylinderGeometry(0.08, 0.08, 95);
      wireGeom.rotateZ(Math.PI / 2);
      const wire = new THREE.Mesh(wireGeom, conductorMat400);
      wire.position.set(0, 13 - idx * 0.8, z);
      scene.add(wire);
    });

    // 220 kV Main Bus 1 & 2 wires
    [22, 26].forEach((z, idx) => {
      const wireGeom = new THREE.CylinderGeometry(0.06, 0.06, 95);
      wireGeom.rotateZ(Math.PI / 2);
      const wire = new THREE.Mesh(wireGeom, conductorMat220);
      wire.position.set(0, 9 - idx * 0.7, z);
      scene.add(wire);
    });
  };

  // Build Electrical Equipment Geometries
  const buildElectricalEquipments = (scene: THREE.Scene) => {
    // 1. Three 315 MVA Power Transformers
    [
      { id: 'ICT-01', x: -18, label: 'ICT-1' },
      { id: 'ICT-02', x: 0, label: 'ICT-2' },
      { id: 'ICT-03', x: 18, label: 'ICT-3' },
    ].forEach((ict) => {
      const ictGroup = new THREE.Group();

      // Main Tank (corrugated dark grey transformer tank)
      const tankGeom = new THREE.BoxGeometry(6.5, 4.2, 5.0);
      const tankMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 });
      const tank = new THREE.Mesh(tankGeom, tankMat);
      tank.position.set(0, 2.7, 0);
      tank.castShadow = true;
      tank.receiveShadow = true;
      ictGroup.add(tank);

      // Conservator Tank on top (horizontal cylinder)
      const consGeom = new THREE.CylinderGeometry(0.7, 0.7, 5.2, 24);
      consGeom.rotateZ(Math.PI / 2);
      const consMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.5 });
      const cons = new THREE.Mesh(consGeom, consMat);
      cons.position.set(0, 5.4, -1.2);
      cons.castShadow = true;
      ictGroup.add(cons);

      // 400 kV Bushings (Tall brown porcelain with corona rings)
      const bushingMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.3 });
      const coronaRingMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

      [-1.8, 0, 1.8].forEach((bx) => {
        // Bushing column
        const bushGeom = new THREE.CylinderGeometry(0.18, 0.3, 2.8, 16);
        const bush = new THREE.Mesh(bushGeom, bushingMat);
        bush.position.set(bx, 5.8, -1.6);
        bush.rotation.x = -0.15;
        bush.castShadow = true;
        ictGroup.add(bush);

        // Corona Ring
        const ringGeom = new THREE.TorusGeometry(0.4, 0.05, 12, 24);
        ringGeom.rotateX(Math.PI / 2);
        const ring = new THREE.Mesh(ringGeom, coronaRingMat);
        ring.position.set(bx, 7.1, -1.8);
        ictGroup.add(ring);
      });

      // 220 kV Bushings (Slightly shorter on secondary side)
      [-1.5, 0, 1.5].forEach((bx) => {
        const bushGeom = new THREE.CylinderGeometry(0.14, 0.22, 2.0, 16);
        const bush = new THREE.Mesh(bushGeom, bushingMat);
        bush.position.set(bx, 5.4, 1.6);
        bush.rotation.x = 0.15;
        bush.castShadow = true;
        ictGroup.add(bush);
      });

      // Radiator Cooling Banks (lateral)
      const radMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
      [-3.8, 3.8].forEach((rx) => {
        const rad = new THREE.Mesh(new THREE.BoxGeometry(0.6, 3.2, 4.4), radMat);
        rad.position.set(rx, 2.6, 0);
        rad.castShadow = true;
        ictGroup.add(rad);

        // Cooling Fans
        const fanGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 8);
        fanGeom.rotateX(Math.PI / 2);
        const fan = new THREE.Mesh(fanGeom, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
        fan.position.set(rx > 0 ? rx + 0.35 : rx - 0.35, 2.2, 0);
        ictGroup.add(fan);
        fanMeshes.current.push(fan);
      });

      // Position ICT group
      ictGroup.position.set(ict.x, 0, 0);
      scene.add(ictGroup);
      interactableObjects.current.set(ictGroup, ict.id);
    });

    // 2. 125 MVAR Shunt Bus Reactor (RE-401)
    const reGroup = new THREE.Group();
    const reTank = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.4, 4.8, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.4, metalness: 0.6 })
    );
    reTank.position.set(0, 2.7, 0);
    reTank.castShadow = true;
    reGroup.add(reTank);

    // Reactor 400 kV Bushings
    [-1.2, 0, 1.2].forEach((bx) => {
      const bush = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.3, 2.6, 16),
        new THREE.MeshStandardMaterial({ color: 0x7c2d12 })
      );
      bush.position.set(bx, 5.8, 0);
      reGroup.add(bush);
    });
    reGroup.position.set(-36, 0, -18);
    scene.add(reGroup);
    interactableObjects.current.set(reGroup, 'RE-401');

    // 3. Live-Tank SF6 Circuit Breakers (400 kV & 220 kV)
    const breakerPositions = [
      { id: 'CB-401', pos: [-18, 0, -14], v: '400' },
      { id: 'CB-402', pos: [0, 0, -14], v: '400' },
      { id: 'CB-403', pos: [18, 0, -14], v: '400' },
      { id: 'CB-404', pos: [-36, 0, -28], v: '400' },
      { id: 'CB-405', pos: [36, 0, -28], v: '400' },
      { id: 'CB-406', pos: [-36, 0, -12], v: '400' },
      { id: 'CB-407', pos: [-18, 0, -32], v: '400' },
      // 220 kV Breakers
      { id: 'CB-201', pos: [-18, 0, 16], v: '220' },
      { id: 'CB-202', pos: [0, 0, 16], v: '220' },
      { id: 'CB-203', pos: [18, 0, 16], v: '220' },
      { id: 'CB-204', pos: [-36, 0, 30], v: '220' },
      { id: 'CB-205', pos: [0, 0, 30], v: '220' },
      { id: 'CB-206', pos: [36, 0, 30], v: '220' },
    ];

    breakerPositions.forEach((cb) => {
      const cbGroup = new THREE.Group();
      const is400 = cb.v === '400';
      const height = is400 ? 5.2 : 3.8;

      // Steel support structure / pedestal
      const ped = new THREE.Mesh(
        new THREE.BoxGeometry(3.0, 1.8, 1.0),
        new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6 })
      );
      ped.position.set(0, 0.9, 0);
      ped.castShadow = true;
      cbGroup.add(ped);

      // Central operating mechanism box
      const mechBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.6),
        new THREE.MeshStandardMaterial({ color: 0x64748b })
      );
      mechBox.position.set(0, 0.9, 0.55);
      cbGroup.add(mechBox);

      // 3 Porcelain Interrupter Columns (R, Y, B phases)
      const porcelainMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.3 });
      [-1.1, 0, 1.1].forEach((px) => {
        const col = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16, 0.22, height - 1.8, 16),
          porcelainMat
        );
        col.position.set(px, 1.8 + (height - 1.8) / 2, 0);
        col.castShadow = true;
        cbGroup.add(col);
      });

      // Operating state indicator beacon on top of breaker
      const state = telemetry.breakers[cb.id]?.state || 'CLOSED';
      const beaconColor = state === 'CLOSED' ? 0xef4444 : 0x10b981; // Red = Closed/Energized, Green = Open
      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 12, 12),
        new THREE.MeshBasicMaterial({ color: beaconColor })
      );
      beacon.position.set(0, height + 0.3, 0);
      cbGroup.add(beacon);

      cbGroup.position.set(cb.pos[0], cb.pos[1], cb.pos[2]);
      scene.add(cbGroup);
      interactableObjects.current.set(cbGroup, cb.id);
    });

    // 4. Control & Relay Building (CRB)
    const crbGroup = new THREE.Group();
    const crbMain = new THREE.Mesh(
      new THREE.BoxGeometry(16, 5.5, 10),
      new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.7 })
    );
    crbMain.position.set(0, 2.75, 0);
    crbMain.castShadow = true;
    crbGroup.add(crbMain);

    // CRB Roof
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(17, 0.6, 11),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    );
    roof.position.set(0, 5.8, 0);
    crbGroup.add(roof);

    // CRB Entrance & APTRANSCO Sign Plate
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(7, 1.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x047857 })
    );
    sign.position.set(0, 4.2, 5.1);
    crbGroup.add(sign);

    crbGroup.position.set(40, 0, -4);
    scene.add(crbGroup);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Control Bar & Camera Presets */}
      <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 flex flex-wrap items-center gap-2 shadow-xl z-10 text-xs">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300 font-medium">
          <Camera className="w-3.5 h-3.5 text-cyan-400" />
          <span>Camera Presets:</span>
        </div>

        {[
          { id: 'aerial', label: 'Overview Aerial' },
          { id: '400kv', label: '400 kV Yard' },
          { id: 'transformers', label: 'ICTs 1-3' },
          { id: '220kv', label: '220 kV Yard' },
          { id: 'reactor', label: 'Bus Reactor' },
          { id: 'control_room', label: 'Control Room' },
        ].map((preset) => (
          <button
            key={preset.id}
            onClick={() => setCameraPreset(preset.id)}
            className={`px-2.5 py-1 rounded transition-colors text-xs font-medium ${
              activePreset === preset.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Floating 3D Lighting Mode Override Toggle & Status */}
      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-2 flex flex-wrap items-center gap-2 shadow-xl z-10 text-xs">
        {/* Mode Status Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300 font-medium">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold hidden md:inline">Lighting:</span>
          {lightMode === 'AUTO' && (
            <span className="flex items-center gap-1 text-cyan-300 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Auto ({autoIsDay ? 'Day ☀️' : 'Night 🌙'} · {istHour.toString().padStart(2, '0')}:00 IST)</span>
            </span>
          )}
          {lightMode === 'DAY' && (
            <span className="flex items-center gap-1 text-amber-300 font-mono text-[11px]">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>☀️ Bright Mode</span>
            </span>
          )}
          {lightMode === 'NIGHT' && (
            <span className="flex items-center gap-1 text-indigo-300 font-mono text-[11px]">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>🌙 Night Mode</span>
            </span>
          )}
        </div>

        {/* Override Toggle Buttons */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={() => setLightMode('AUTO')}
            className={`px-2.5 py-1 rounded transition-colors text-xs font-medium flex items-center gap-1.5 ${
              lightMode === 'AUTO'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auto (Time-Based): Dynamically adjust illumination by substation IST time (06:00-18:00 Day / 18:00-06:00 Night)"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Auto</span>
          </button>
          <button
            onClick={() => setLightMode('DAY')}
            className={`px-2.5 py-1 rounded transition-colors text-xs font-medium flex items-center gap-1.5 ${
              lightMode === 'DAY'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Always Bright (Day Mode): Force bright daylight illumination with directional sun"
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Day</span>
          </button>
          <button
            onClick={() => setLightMode('NIGHT')}
            className={`px-2.5 py-1 rounded transition-colors text-xs font-medium flex items-center gap-1.5 ${
              lightMode === 'NIGHT'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Night Mode: Force dark sky with switchyard security floodlights"
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Night</span>
          </button>
        </div>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredAsset && (
        <div className="absolute top-16 left-3 bg-slate-900/95 border border-emerald-500/50 rounded-lg p-3 shadow-2xl z-10 max-w-xs text-xs pointer-events-none animate-fadeIn">
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="font-bold text-white font-mono">{hoveredAsset.id}</span>
            <span className="text-[10px] text-emerald-400 font-mono">CLICK TO INSPECT</span>
          </div>
          <div className="text-slate-300 font-medium text-xs mb-1">{hoveredAsset.name}</div>
          <div className="text-[11px] text-slate-400">{hoveredAsset.bayName}</div>
          {hoveredAsset.type === 'POWER_TRANSFORMER' && telemetry.transformers[hoveredAsset.id] && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-mono text-cyan-300 bg-slate-950 p-1.5 rounded">
              <div>Load: {telemetry.transformers[hoveredAsset.id].activePowerMW} MW</div>
              <div>HotSpot: {telemetry.transformers[hoveredAsset.id].windingHotSpotTempC}°C</div>
            </div>
          )}
          {hoveredAsset.type === 'CIRCUIT_BREAKER' && telemetry.breakers[hoveredAsset.id] && (
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-mono bg-slate-950 p-1.5 rounded">
              <div
                className={
                  telemetry.breakers[hoveredAsset.id].state === 'CLOSED' ? 'text-rose-400' : 'text-emerald-400'
                }
              >
                State: {telemetry.breakers[hoveredAsset.id].state}
              </div>
              <div className="text-slate-300">SF6: {telemetry.breakers[hoveredAsset.id].sf6PressureBar} bar</div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation Hint */}
      <div className="absolute bottom-3 right-3 bg-slate-900/90 border border-slate-800 rounded px-3 py-1.5 text-[11px] text-slate-400 font-mono flex items-center gap-2 pointer-events-none">
        <Compass className="w-3.5 h-3.5 text-cyan-400" />
        <span>Drag to orbit · Scroll to zoom · Click asset to inspect</span>
      </div>
    </div>
  );
};
