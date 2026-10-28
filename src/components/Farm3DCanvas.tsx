import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFarmStore } from '../store/useFarmStore';
import { DEFAULT_BREEDS } from '../lib/sim/constants';
import { Cow } from '../lib/sim/types';

// Cow procedural patch texture generator (Cache per breed)
const textureCache: Record<string, THREE.CanvasTexture> = {};

function getCowCoatTexture(baseColorHex: string, spotColorHex: string, patternType: string): THREE.CanvasTexture {
  const key = `${baseColorHex}_${spotColorHex}_${patternType}`;
  if (textureCache[key]) {
    return textureCache[key];
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base coat
  ctx.fillStyle = baseColorHex;
  ctx.fillRect(0, 0, 512, 512);

  // Spot patches
  ctx.fillStyle = spotColorHex;
  const numSpots = patternType === 'solid' ? 0 : patternType === 'piebald' ? 12 : 18;

  for (let i = 0; i < numSpots; i++) {
    const cx = (i * 137.5) % 512;
    const cy = (i * 219.3) % 512;
    const rx = 35 + ((i * 17) % 45);
    const ry = 30 + ((i * 23) % 40);

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (i * 0.7), 0, Math.PI * 2);
    ctx.fill();

    // Additional organic irregularity
    ctx.beginPath();
    ctx.arc(cx + rx * 0.4, cy + ry * 0.3, rx * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache[key] = texture;
  return texture;
}

export const Farm3DCanvas: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const { farm, selectedCowId, setSelectedCowId, cameraPreset, graphicsQuality } = useFarmStore();

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cowMeshesRef = useRef<Map<string, THREE.Group>>(new Map());
  const fanBladesRef = useRef<THREE.Group[]>([]);
  const tankerTruckRef = useRef<THREE.Group | null>(null);
  const weatherParticlesRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<{
    sun: THREE.DirectionalLight;
    ambient: THREE.AmbientLight;
    barnLights: THREE.PointLight[];
  } | null>(null);

  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraCurrentPos = useRef(new THREE.Vector3(28, 22, 32));

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#87CEEB');
    scene.fog = new THREE.FogExp2('#87CEEB', 0.007);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 300);
    camera.position.set(28, 22, 32);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.6);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight('#fff5e6', 1.4);
    sunLight.position.set(40, 50, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Barn interior floodlights (for evening/night)
    const barnLight1 = new THREE.PointLight('#ffe6b3', 0, 30);
    barnLight1.position.set(-10, 8, -4);
    const barnLight2 = new THREE.PointLight('#ffe6b3', 0, 30);
    barnLight2.position.set(-10, 8, 8);
    scene.add(barnLight1, barnLight2);

    lightsRef.current = {
      sun: sunLight,
      ambient: ambientLight,
      barnLights: [barnLight1, barnLight2],
    };

    // Build Static Farm Environment
    buildFarmEnvironment(scene, fanBladesRef, tankerTruckRef);

    // Mouse and Keyboard Controls
    let isMouseDown = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let orbitAzimuth = 0.7;
    let orbitElevation = 0.55;
    let orbitDistance = 42;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isMouseDown = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isMouseDown) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      orbitAzimuth -= dx * 0.006;
      orbitElevation = Math.max(0.1, Math.min(Math.PI / 2.1, orbitElevation + dy * 0.006));
    };

    const onWheel = (e: WheelEvent) => {
      orbitDistance = Math.max(12, Math.min(95, orbitDistance + e.deltaY * 0.04));
    };

    // Raycast on Click to Select Cow
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      // Don't fire if user dragged significantly
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const interactiveTargets: THREE.Object3D[] = [];
      cowMeshesRef.current.forEach((mesh) => interactiveTargets.push(mesh));

      const intersects = raycaster.intersectObjects(interactiveTargets, true);
      if (intersects.length > 0) {
        // Find top-level cow group
        let cur: THREE.Object3D | null = intersects[0].object;
        while (cur && !cur.userData?.cowId) {
          cur = cur.parent;
        }
        if (cur && cur.userData?.cowId) {
          setSelectedCowId(cur.userData.cowId);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('wheel', onWheel, { passive: true });
    dom.addEventListener('click', onClick);

    // Keyboard Pan / Shortcuts
    const keyState: Record<string, boolean> = {};
    const onKeyDown = (e: KeyboardEvent) => {
      keyState[e.code] = true;
      if (e.code === 'KeyR') {
        orbitAzimuth = 0.7;
        orbitElevation = 0.55;
        orbitDistance = 42;
        cameraTargetRef.current.set(0, 0, 0);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keyState[e.code] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Weather Particles (Rain / Snow)
    const particleCount = 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 120;
      particlePositions[i + 1] = Math.random() * 40;
      particlePositions[i + 2] = (Math.random() - 0.5) * 120;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x99ccff,
      size: 0.25,
      transparent: true,
      opacity: 0.0,
    });
    const weatherPoints = new THREE.Points(particleGeo, particleMat);
    scene.add(weatherPoints);
    weatherParticlesRef.current = weatherPoints;

    // Animation Loop
    let animId: number;
    let lastTime = performance.now();
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const time = (currentTime - startTime) / 1000;

      // Pan keys (WASD / QE)
      const forward = new THREE.Vector3(-Math.sin(orbitAzimuth), 0, -Math.cos(orbitAzimuth)).normalize();
      const right = new THREE.Vector3(Math.cos(orbitAzimuth), 0, -Math.sin(orbitAzimuth)).normalize();

      const panSpeed = 20 * delta;
      if (keyState['KeyW']) cameraTargetRef.current.addScaledVector(forward, panSpeed);
      if (keyState['KeyS']) cameraTargetRef.current.addScaledVector(forward, -panSpeed);
      if (keyState['KeyA']) cameraTargetRef.current.addScaledVector(right, -panSpeed);
      if (keyState['KeyD']) cameraTargetRef.current.addScaledVector(right, panSpeed);
      if (keyState['KeyQ']) cameraTargetRef.current.y += panSpeed * 0.8;
      if (keyState['KeyE']) cameraTargetRef.current.y = Math.max(0, cameraTargetRef.current.y - panSpeed * 0.8);

      // Camera position interpolation
      const targetCamX = cameraTargetRef.current.x + orbitDistance * Math.cos(orbitElevation) * Math.sin(orbitAzimuth);
      const targetCamY = cameraTargetRef.current.y + orbitDistance * Math.sin(orbitElevation);
      const targetCamZ = cameraTargetRef.current.z + orbitDistance * Math.cos(orbitElevation) * Math.cos(orbitAzimuth);

      cameraCurrentPos.current.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.1);
      camera.position.copy(cameraCurrentPos.current);
      camera.lookAt(cameraTargetRef.current);

      // Spin ceiling ventilation fans if active
      if (fanBladesRef.current.length > 0) {
        fanBladesRef.current.forEach((fan) => {
          fan.rotation.y += 12 * delta;
        });
      }

      // Animate Cows (breathing, tail swishing, chewing)
      cowMeshesRef.current.forEach((cowGroup) => {
        const tail = cowGroup.getObjectByName('cow_tail');
        if (tail) {
          tail.rotation.z = Math.sin(time * 3 + cowGroup.position.x) * 0.35;
        }
        const head = cowGroup.getObjectByName('cow_head');
        if (head) {
          const isEating = cowGroup.userData?.behavior === 'eating' || cowGroup.userData?.behavior === 'grazing';
          if (isEating) {
            head.rotation.x = 0.45 + Math.sin(time * 5) * 0.08; // Chewing bob
          } else {
            head.rotation.x = Math.sin(time * 1.5) * 0.04;
          }
        }
        // Subtly animate body breathing
        const body = cowGroup.getObjectByName('cow_body');
        if (body) {
          body.scale.set(1.0 + Math.sin(time * 2 + cowGroup.position.z) * 0.015, 1, 1);
        }
      });

      // Animate Weather particles
      if (weatherParticlesRef.current && weatherParticlesRef.current.material) {
        const mat = weatherParticlesRef.current.material as THREE.PointsMaterial;
        if (mat.opacity > 0.01) {
          const posAttr = weatherParticlesRef.current.geometry.attributes.position as THREE.BufferAttribute;
          const posArray = posAttr.array as Float32Array;
          for (let i = 1; i < posArray.length; i += 3) {
            posArray[i] -= 18 * delta; // Fall speed
            if (posArray[i] < 0) {
              posArray[i] = 35 + Math.random() * 5;
            }
          }
          posAttr.needsUpdate = true;
        }
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('click', onClick);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', handleResize);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Camera based on Preset
  useEffect(() => {
    if (!cameraRef.current) return;
    if (cameraPreset === 1) {
      // Farm Overview
      cameraTargetRef.current.set(0, 0, 0);
      cameraCurrentPos.current.set(28, 24, 34);
    } else if (cameraPreset === 2) {
      // Milking Parlor
      cameraTargetRef.current.set(-16, 2, -14);
      cameraCurrentPos.current.set(-10, 8, -6);
    } else if (cameraPreset === 3) {
      // Freestall Barn
      cameraTargetRef.current.set(-8, 2, 0);
      cameraCurrentPos.current.set(-4, 12, 16);
    } else if (cameraPreset === 4) {
      // Calf Hutches
      cameraTargetRef.current.set(26, 1, -16);
      cameraCurrentPos.current.set(20, 6, -8);
    } else if (cameraPreset === 5) {
      // Silo & Bunker
      cameraTargetRef.current.set(-22, 4, 10);
      cameraCurrentPos.current.set(-14, 14, 22);
    }
  }, [cameraPreset]);

  // Adjust graphics quality presets
  useEffect(() => {
    if (!rendererRef.current) return;
    const renderer = rendererRef.current;
    if (graphicsQuality === 'low') {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
    } else if (graphicsQuality === 'medium') {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = true;
    } else if (graphicsQuality === 'high') {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
    } else {
      // Ultra
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
      renderer.shadowMap.enabled = true;
    }
  }, [graphicsQuality]);

  // Milk Tanker Truck visibility based on circadian phase
  useEffect(() => {
    if (tankerTruckRef.current) {
      tankerTruckRef.current.visible = farm.circadianPhase === 'milk_pickup';
    }
  }, [farm.circadianPhase]);

  // Update Dynamic Lighting & Sky based on Sim Time & Weather
  useEffect(() => {
    if (!lightsRef.current || !sceneRef.current) return;
    const { sun, ambient, barnLights } = lightsRef.current;
    const hour = farm.hour;

    // Day/Night Cycle calculation
    let sunIntensity = 1.4;
    let ambientIntensity = 0.6;
    let skyColor = new THREE.Color('#87CEEB'); // Noon blue
    let sunColor = new THREE.Color('#fff7e6');
    let barnLightIntensity = 0.0;

    if (hour >= 6 && hour < 8) {
      // Sunrise / Golden Hour
      const t = (hour - 6) / 2;
      skyColor.set('#ffb07c').lerp(new THREE.Color('#87CEEB'), t);
      sunColor.set('#ff8844').lerp(new THREE.Color('#fff7e6'), t);
      sunIntensity = 0.8 + 0.6 * t;
      barnLightIntensity = 1.5 * (1 - t);
    } else if (hour >= 8 && hour < 18) {
      // Daylight
      skyColor.set('#87CEEB');
      sunIntensity = 1.4;
      ambientIntensity = 0.65;
      barnLightIntensity = 0.0;
    } else if (hour >= 18 && hour < 20) {
      // Sunset
      const t = (hour - 18) / 2;
      skyColor.set('#87CEEB').lerp(new THREE.Color('#e25822'), t);
      sunColor.set('#ff9944');
      sunIntensity = 1.2 * (1 - t) + 0.2;
      barnLightIntensity = 2.0 * t;
    } else {
      // Night (hour >= 20 or < 6)
      skyColor.set('#0b1021');
      sunIntensity = 0.15; // Moonlight
      sunColor.set('#8899cc');
      ambientIntensity = 0.25;
      barnLightIntensity = 3.5; // Floodlights on
    }

    // Weather adjustments
    if (farm.weather === 'rainy' || farm.weather === 'storm') {
      skyColor.lerp(new THREE.Color('#4a5568'), 0.7);
      sunIntensity *= 0.4;
    } else if (farm.weather === 'snow') {
      skyColor.lerp(new THREE.Color('#d1d5db'), 0.8);
      sunIntensity *= 0.6;
    }

    sceneRef.current.background = skyColor;
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color = skyColor;
    }

    sun.intensity = sunIntensity;
    sun.color = sunColor;
    ambient.intensity = ambientIntensity;

    barnLights.forEach((l) => {
      l.intensity = barnLightIntensity;
    });

    // Weather particles visibility
    if (weatherParticlesRef.current) {
      const mat = weatherParticlesRef.current.material as THREE.PointsMaterial;
      if (farm.weather === 'rainy' || farm.weather === 'storm') {
        mat.opacity = 0.65;
        mat.color.set(0x77aaff);
        mat.size = 0.22;
      } else if (farm.weather === 'snow') {
        mat.opacity = 0.85;
        mat.color.set(0xffffff);
        mat.size = 0.45;
      } else {
        mat.opacity = 0.0;
      }
    }
  }, [farm.hour, farm.weather]);

  // Synchronize Cows Meshes in 3D Scene
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const currentMeshMap = cowMeshesRef.current;

    // Identify and remove culled/deleted cows
    const activeCowIds = new Set(farm.cows.map((c) => c.id));
    currentMeshMap.forEach((mesh, id) => {
      if (!activeCowIds.has(id)) {
        scene.remove(mesh);
        currentMeshMap.delete(id);
      }
    });

    const allBreeds = [...DEFAULT_BREEDS, ...farm.customBreeds];

    // Add or update cows
    farm.cows.forEach((cow) => {
      let cowGroup = currentMeshMap.get(cow.id);

      if (!cowGroup) {
        const breed = allBreeds.find((b) => b.id === cow.breedId) || DEFAULT_BREEDS[0];
        cowGroup = createProceduralCowMesh(cow, breed);
        scene.add(cowGroup);
        currentMeshMap.set(cow.id, cowGroup);
      }

      // Update position & behavior
      const isResting = cow.behaviorState === 'resting';
      const targetY = isResting ? (cow.state === 'calf' ? -0.2 : -0.45) : 0;
      cowGroup.position.set(cow.position[0], targetY, cow.position[2]);
      cowGroup.rotation.y = cow.rotationY;
      cowGroup.userData.behavior = cow.behaviorState;

      // Selection ring indicator
      let ring = cowGroup.getObjectByName('selection_ring') as THREE.Mesh;
      if (cow.id === selectedCowId) {
        if (!ring) {
          const ringGeo = new THREE.RingGeometry(1.4, 1.7, 32);
          ringGeo.rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0x22c55e,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          });
          ring = new THREE.Mesh(ringGeo, ringMat);
          ring.name = 'selection_ring';
          ring.position.y = 0.08;
          cowGroup.add(ring);
        }
        ring.visible = true;
      } else if (ring) {
        ring.visible = false;
      }
    });
  }, [farm.cows, farm.customBreeds, selectedCowId]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
    />
  );
};

// ==========================================
// PROCEDURAL 3D COW MESH BUILDER
// ==========================================
function createProceduralCowMesh(cow: Cow, breed: typeof DEFAULT_BREEDS[0]): THREE.Group {
  const group = new THREE.Group();
  group.userData = { cowId: cow.id };

  const isCalf = cow.state === 'calf';
  const isHeifer = cow.state === 'heifer' || cow.state === 'pregnant_heifer';
  const scale = isCalf ? 0.48 : isHeifer ? 0.78 : 1.0;

  // Coat Material
  const patternType = breed.id === 'holstein' ? 'patches' : breed.id === 'simmental' ? 'piebald' : 'solid';
  const texture = getCowCoatTexture(breed.coatColor, breed.spotColor, patternType);
  const coatMaterial = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.05,
  });

  const muzzleMaterial = new THREE.MeshStandardMaterial({
    color: '#332724',
    roughness: 0.9,
  });

  const hornMaterial = new THREE.MeshStandardMaterial({
    color: '#d4cbb8',
    roughness: 0.5,
  });

  const hoofMaterial = new THREE.MeshStandardMaterial({
    color: '#2a2421',
    roughness: 0.7,
  });

  const udderMaterial = new THREE.MeshStandardMaterial({
    color: '#f4b8ba',
    roughness: 0.6,
  });

  // 1. Torso / Body
  const bodyGeo = new THREE.BoxGeometry(1.4, 1.45, 2.7);
  const bodyMesh = new THREE.Mesh(bodyGeo, coatMaterial);
  bodyMesh.name = 'cow_body';
  bodyMesh.position.y = 1.45;
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  group.add(bodyMesh);

  // 2. Neck & Head
  const headGroup = new THREE.Group();
  headGroup.name = 'cow_head';
  headGroup.position.set(0, 1.8, 1.4);

  const headGeo = new THREE.BoxGeometry(0.75, 0.85, 1.0);
  const headMesh = new THREE.Mesh(headGeo, coatMaterial);
  headMesh.position.set(0, 0, 0.3);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Muzzle (Nose/Mouth)
  const muzzleGeo = new THREE.BoxGeometry(0.65, 0.45, 0.5);
  const muzzleMesh = new THREE.Mesh(muzzleGeo, muzzleMaterial);
  muzzleMesh.position.set(0, -0.2, 0.9);
  muzzleMesh.castShadow = true;
  headGroup.add(muzzleMesh);

  // Ears
  const earGeo = new THREE.BoxGeometry(0.4, 0.15, 0.15);
  const leftEar = new THREE.Mesh(earGeo, coatMaterial);
  leftEar.position.set(0.48, 0.25, 0.2);
  leftEar.rotation.z = -0.3;
  const rightEar = new THREE.Mesh(earGeo, coatMaterial);
  rightEar.position.set(-0.48, 0.25, 0.2);
  rightEar.rotation.z = 0.3;
  headGroup.add(leftEar, rightEar);

  // Horns (if breed has horns and not calf)
  if (breed.hasHorns && !isCalf) {
    const hornGeo = new THREE.ConeGeometry(0.08, 0.35, 8);
    const leftHorn = new THREE.Mesh(hornGeo, hornMaterial);
    leftHorn.position.set(0.32, 0.55, 0.2);
    leftHorn.rotation.set(-0.2, 0, -0.4);
    const rightHorn = new THREE.Mesh(hornGeo, hornMaterial);
    rightHorn.position.set(-0.32, 0.55, 0.2);
    rightHorn.rotation.set(-0.2, 0, 0.4);
    headGroup.add(leftHorn, rightHorn);
  }

  group.add(headGroup);

  // 3. Legs & Hooves
  const legPositions = [
    [-0.5, 0.55, 0.9],   // Front Left
    [0.5, 0.55, 0.9],    // Front Right
    [-0.5, 0.55, -0.9],  // Rear Left
    [0.5, 0.55, -0.9],   // Rear Right
  ];

  legPositions.forEach(([x, y, z]) => {
    const legGeo = new THREE.CylinderGeometry(0.14, 0.12, 1.1, 8);
    const legMesh = new THREE.Mesh(legGeo, coatMaterial);
    legMesh.position.set(x, y, z);
    legMesh.castShadow = true;
    group.add(legMesh);

    // Hoof
    const hoofGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.2, 8);
    const hoofMesh = new THREE.Mesh(hoofGeo, hoofMaterial);
    hoofMesh.position.set(x, 0.1, z);
    group.add(hoofMesh);
  });

  // 4. Udder (Meme) - Only for mature cows
  if (!isCalf && cow.state !== 'heifer') {
    const udderGeo = new THREE.SphereGeometry(0.35, 12, 12);
    udderGeo.scale(1.0, 0.8, 1.2);
    const udderMesh = new THREE.Mesh(udderGeo, udderMaterial);
    udderMesh.position.set(0, 0.85, -0.3);
    group.add(udderMesh);

    // 4 Teats
    [
      [-0.12, 0.65, -0.2],
      [0.12, 0.65, -0.2],
      [-0.12, 0.65, -0.4],
      [0.12, 0.65, -0.4],
    ].forEach(([tx, ty, tz]) => {
      const teatGeo = new THREE.CylinderGeometry(0.03, 0.025, 0.14, 6);
      const teatMesh = new THREE.Mesh(teatGeo, udderMaterial);
      teatMesh.position.set(tx, ty, tz);
      group.add(teatMesh);
    });
  }

  // 5. Tail
  const tailGroup = new THREE.Group();
  tailGroup.name = 'cow_tail';
  tailGroup.position.set(0, 1.9, -1.35);

  const tailGeo = new THREE.CylinderGeometry(0.04, 0.03, 1.1, 6);
  const tailMesh = new THREE.Mesh(tailGeo, coatMaterial);
  tailMesh.position.y = -0.55;
  tailMesh.rotation.x = 0.15;
  tailGroup.add(tailMesh);

  // Switch (tail tip tuft)
  const tuftGeo = new THREE.ConeGeometry(0.09, 0.28, 6);
  const tuftMesh = new THREE.Mesh(tuftGeo, muzzleMaterial);
  tuftMesh.position.set(0, -1.15, 0.1);
  tuftMesh.rotation.x = Math.PI;
  tailGroup.add(tuftMesh);

  group.add(tailGroup);

  // Scale overall cow based on age/state
  group.scale.set(scale, scale, scale);

  return group;
}

// ==========================================
// BUILD DETAILED 3D FARM ENVIRONMENT
// ==========================================
function buildFarmEnvironment(
  scene: THREE.Scene,
  fanBladesRef: React.MutableRefObject<THREE.Group[]>,
  tankerTruckRef: React.MutableRefObject<THREE.Group | null>
): void {
  // 1. Terrain Ground
  const terrainGeo = new THREE.PlaneGeometry(240, 240, 32, 32);
  terrainGeo.rotateX(-Math.PI / 2);

  const groundMat = new THREE.MeshStandardMaterial({
    color: '#4d7c0f', // Lush pasture green
    roughness: 0.9,
    metalness: 0.05,
  });
  const ground = new THREE.Mesh(terrainGeo, groundMat);
  ground.receiveShadow = true;
  scene.add(ground);

  // Barn Concrete Slab Floor
  const barnSlabGeo = new THREE.BoxGeometry(42, 0.2, 34);
  const concreteMat = new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    roughness: 0.85,
  });
  const barnSlab = new THREE.Mesh(barnSlabGeo, concreteMat);
  barnSlab.position.set(-10, 0.1, 0);
  barnSlab.receiveShadow = true;
  scene.add(barnSlab);

  // Central Feed Alley (Yem Yolu & Yemlik)
  const feedAlleyGeo = new THREE.BoxGeometry(40, 0.15, 5);
  const feedAlleyMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.8 });
  const feedAlley = new THREE.Mesh(feedAlleyGeo, feedAlleyMat);
  feedAlley.position.set(-10, 0.25, 0);
  scene.add(feedAlley);

  // Silage Feed Mound on Bunk
  const silageMoundGeo = new THREE.CylinderGeometry(0.4, 0.8, 38, 8);
  silageMoundGeo.rotateZ(Math.PI / 2);
  const silageMat = new THREE.MeshStandardMaterial({ color: '#854d0e', roughness: 0.95 });
  const silageMound = new THREE.Mesh(silageMoundGeo, silageMat);
  silageMound.position.set(-10, 0.5, 0);
  silageMound.castShadow = true;
  scene.add(silageMound);

  // 2. Modern Steel Barn Structure (Freestall Pillars & Trusses)
  const steelMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.4, metalness: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, side: THREE.DoubleSide });

  // Steel Pillars
  for (let x = -28; x <= 8; x += 12) {
    [-15, 15].forEach((z) => {
      const pillarGeo = new THREE.BoxGeometry(0.5, 7.5, 0.5);
      const pillar = new THREE.Mesh(pillarGeo, steelMat);
      pillar.position.set(x, 3.75, z);
      pillar.castShadow = true;
      scene.add(pillar);
    });
  }

  // Pitched Roof
  const roofShape = new THREE.BufferGeometry();
  const roofLeftGeo = new THREE.BoxGeometry(42, 0.3, 17);
  roofLeftGeo.rotateX(0.18);
  const roofLeft = new THREE.Mesh(roofLeftGeo, roofMat);
  roofLeft.position.set(-10, 8.2, -7.5);
  roofLeft.castShadow = true;

  const roofRightGeo = new THREE.BoxGeometry(42, 0.3, 17);
  roofRightGeo.rotateX(-0.18);
  const roofRight = new THREE.Mesh(roofRightGeo, roofMat);
  roofRight.position.set(-10, 8.2, 7.5);
  roofRight.castShadow = true;
  scene.add(roofLeft, roofRight);

  // Ceiling Ventilation Fans
  [-20, -10, 0].forEach((fx) => {
    const fanGroup = new THREE.Group();
    fanGroup.position.set(fx, 6.8, 0);

    const motorGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 12);
    const motor = new THREE.Mesh(motorGeo, steelMat);
    fanGroup.add(motor);

    const bladesGroup = new THREE.Group();
    for (let b = 0; b < 4; b++) {
      const bladeGeo = new THREE.BoxGeometry(1.6, 0.04, 0.25);
      const blade = new THREE.Mesh(bladeGeo, new THREE.MeshStandardMaterial({ color: '#e2e8f0' }));
      blade.rotation.y = (b * Math.PI) / 2;
      blade.position.x = Math.cos((b * Math.PI) / 2) * 0.8;
      blade.position.z = Math.sin((b * Math.PI) / 2) * 0.8;
      bladesGroup.add(blade);
    }
    fanGroup.add(bladesGroup);
    scene.add(fanGroup);
    fanBladesRef.current.push(bladesGroup);
  });

  // Stalls Rails (Yellow divider cubicles)
  const stallMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.3, metalness: 0.5 });
  for (let sx = -26; sx <= 6; sx += 3.2) {
    [-7, 7].forEach((sz) => {
      const stallRail = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 16, Math.PI), stallMat);
      stallRail.rotation.y = Math.PI / 2;
      stallRail.position.set(sx, 1.2, sz);
      scene.add(stallRail);
    });
  }

  // 3. Milking Parlor & Bulk Tank Building
  const parlorGeo = new THREE.BoxGeometry(16, 5.5, 12);
  const parlorMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.7 });
  const parlorBuilding = new THREE.Mesh(parlorGeo, parlorMat);
  parlorBuilding.position.set(-16, 2.75, -22);
  parlorBuilding.castShadow = true;
  parlorBuilding.receiveShadow = true;
  scene.add(parlorBuilding);

  // Exterior Bulk Milk Storage Tank (Silver Cylinder)
  const milkTankGeo = new THREE.CylinderGeometry(1.8, 1.8, 5.2, 16);
  const tankMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.2, metalness: 0.85 });
  const milkTank = new THREE.Mesh(milkTankGeo, tankMat);
  milkTank.position.set(-22, 2.6, -14);
  milkTank.castShadow = true;
  scene.add(milkTank);

  // 3.1 Dairy Processing Milk Tanker Truck (Arrives at 20:00 - 22:00)
  const tankerGroup = new THREE.Group();
  tankerGroup.name = 'milk_tanker_truck';
  tankerGroup.position.set(-26, 0, -6);
  tankerGroup.rotation.y = -Math.PI / 2;

  // Truck Chassis
  const chassisGeo = new THREE.BoxGeometry(2.6, 0.4, 11);
  const chassisMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 });
  const chassis = new THREE.Mesh(chassisGeo, chassisMat);
  chassis.position.y = 0.8;
  chassis.castShadow = true;
  tankerGroup.add(chassis);

  // Driver Cab
  const cabGeo = new THREE.BoxGeometry(2.5, 2.4, 2.8);
  const cabMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.3, metalness: 0.3 });
  const cab = new THREE.Mesh(cabGeo, cabMat);
  cab.position.set(0, 2.1, 3.8);
  cab.castShadow = true;
  tankerGroup.add(cab);

  // Cab Windshield
  const windshieldGeo = new THREE.BoxGeometry(2.3, 1.0, 0.1);
  const glassMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, metalness: 0.9 });
  const windshield = new THREE.Mesh(windshieldGeo, glassMat);
  windshield.position.set(0, 2.4, 5.25);
  tankerGroup.add(windshield);

  // Stainless Steel Milk Cistern Tank
  const cisternGeo = new THREE.CylinderGeometry(1.4, 1.4, 7.2, 16);
  cisternGeo.rotateX(Math.PI / 2);
  const cisternMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.15, metalness: 0.95 });
  const cistern = new THREE.Mesh(cisternGeo, cisternMat);
  cistern.position.set(0, 2.3, -1.6);
  cistern.castShadow = true;
  tankerGroup.add(cistern);

  // Tanker Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
  [-4.0, -2.5, 1.5, 3.5].forEach((wz) => {
    [-1.3, 1.3].forEach((wx) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.position.set(wx, 0.5, wz);
      tankerGroup.add(wheel);
    });
  });

  // Milk Transfer Hose connecting to the bulk tank
  const hoseGeo = new THREE.CylinderGeometry(0.08, 0.08, 6.5, 8);
  hoseGeo.rotateX(Math.PI / 2);
  const hoseMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.5 });
  const hose = new THREE.Mesh(hoseGeo, hoseMat);
  hose.position.set(1.5, 0.6, -3.5);
  hose.rotation.y = -0.4;
  tankerGroup.add(hose);

  tankerGroup.visible = false;
  scene.add(tankerGroup);
  tankerTruckRef.current = tankerGroup;

  // 4. Feed Storage Silos (Tower Silos)
  const siloMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.75 });
  [-24, -28].forEach((sx, idx) => {
    const siloBodyGeo = new THREE.CylinderGeometry(2.4, 2.4, 14, 16);
    const siloBody = new THREE.Mesh(siloBodyGeo, siloMat);
    siloBody.position.set(sx, 7, 18);
    siloBody.castShadow = true;

    const siloCapGeo = new THREE.ConeGeometry(2.6, 2.5, 16);
    const siloCap = new THREE.Mesh(siloCapGeo, new THREE.MeshStandardMaterial({ color: '#334155' }));
    siloCap.position.set(sx, 15.2, 18);
    siloCap.castShadow = true;

    scene.add(siloBody, siloCap);
  });

  // 5. Calf Hutches (Buzağı Kulübeleri)
  const hutchMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.6 });
  [22, 26, 30].forEach((hx) => {
    const hutchGeo = new THREE.CylinderGeometry(1.1, 1.3, 1.8, 12);
    hutchGeo.rotateZ(Math.PI / 2);
    const hutch = new THREE.Mesh(hutchGeo, hutchMat);
    hutch.position.set(hx, 0.9, -18);
    hutch.castShadow = true;
    scene.add(hutch);

    // Wire pen fence in front of hutch
    const penFenceGeo = new THREE.BoxGeometry(2.2, 0.8, 2.5);
    const penWireMat = new THREE.MeshBasicMaterial({ color: '#64748b', wireframe: true });
    const pen = new THREE.Mesh(penFenceGeo, penWireMat);
    pen.position.set(hx, 0.4, -16.5);
    scene.add(pen);
  });

  // 6. Tractor & TMR Wagon
  buildTractorAndMixer(scene);

  // 7. Perimeter Pasture Wooden Fences
  const fenceMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.85 });
  for (let fz = -30; fz <= 30; fz += 6) {
    const postGeo = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    const post = new THREE.Mesh(postGeo, fenceMat);
    post.position.set(40, 0.75, fz);
    post.castShadow = true;
    scene.add(post);

    const railGeo = new THREE.BoxGeometry(0.1, 0.15, 6.0);
    const rail1 = new THREE.Mesh(railGeo, fenceMat);
    rail1.position.set(40, 1.1, fz + 3);
    const rail2 = new THREE.Mesh(railGeo, fenceMat);
    rail2.position.set(40, 0.6, fz + 3);
    scene.add(rail1, rail2);
  }
}

function buildTractorAndMixer(scene: THREE.Scene): void {
  const tractorGroup = new THREE.Group();
  tractorGroup.position.set(6, 0, 14);
  tractorGroup.rotation.y = -0.6;

  const redMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, transparent: true, opacity: 0.7 });

  // Chassis & Engine Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2.2), redMat);
  hood.position.set(0, 1.2, 0.6);
  hood.castShadow = true;
  tractorGroup.add(hood);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.4), glassMat);
  cabin.position.set(0, 2.2, -0.9);
  tractorGroup.add(cabin);

  // Big Rear Wheels
  [-1.0, 1.0].forEach((wx) => {
    const rearWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.5, 16), blackMat);
    rearWheel.rotateZ(Math.PI / 2);
    rearWheel.position.set(wx, 0.85, -0.9);
    rearWheel.castShadow = true;
    tractorGroup.add(rearWheel);
  });

  // Front Wheels
  [-0.9, 0.9].forEach((wx) => {
    const frontWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16), blackMat);
    frontWheel.rotateZ(Math.PI / 2);
    frontWheel.position.set(wx, 0.5, 1.2);
    frontWheel.castShadow = true;
    tractorGroup.add(frontWheel);
  });

  // TMR Vertical Mixer Wagon attached behind
  const mixerGroup = new THREE.Group();
  mixerGroup.position.set(0, 0, -3.8);

  const wagonMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.5 });
  const tubGeo = new THREE.CylinderGeometry(1.6, 1.2, 2.2, 16);
  const tub = new THREE.Mesh(tubGeo, wagonMat);
  tub.position.y = 1.6;
  tub.castShadow = true;
  mixerGroup.add(tub);

  // Mixer Auger inside tub
  const auger = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 8), new THREE.MeshStandardMaterial({ color: '#64748b' }));
  auger.position.y = 1.6;
  mixerGroup.add(auger);

  tractorGroup.add(mixerGroup);
  scene.add(tractorGroup);
}
