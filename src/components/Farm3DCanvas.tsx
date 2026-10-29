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
  const tractorTruckRef = useRef<THREE.Group | null>(null);
  const scraperMeshRef = useRef<THREE.Mesh | null>(null);
  const milkTaxiRef = useRef<THREE.Group | null>(null);
  const workerAvatarRef = useRef<THREE.Group | null>(null);
  const routesOverlayRef = useRef<THREE.Group | null>(null);
  const digitalTwinGroupRef = useRef<THREE.Group | null>(null);
  const sheddingGateRef = useRef<THREE.Group | null>(null);
  const junoRobotRef = useRef<THREE.Group | null>(null);
  const discoveryRobotRef = useRef<THREE.Group | null>(null);
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
    buildFarmEnvironment(scene, fanBladesRef, tankerTruckRef, tractorTruckRef);

    // Build Biosecurity Structures & Movement Overlays
    buildBiosecurityStructures(scene, scraperMeshRef, milkTaxiRef);
    routesOverlayRef.current = buildBiosecurityRoutesOverlay(scene);
    workerAvatarRef.current = buildWorkerAvatar(scene);

    // Build Digital Twin IoT Sensor Probes & Smart Shedding Gate
    buildDigitalTwinObjects(scene, digitalTwinGroupRef, sheddingGateRef);
    buildAgriTwinFacilityAndRobots(scene, junoRobotRef, discoveryRobotRef);

    // Mouse and Keyboard Controls
    let isMouseDown = false;
    let activeMouseButton = 0; // 0: Sol Tık (Orbit), 2: Sağ Tık (Pan)
    let prevMouseX = 0;
    let prevMouseY = 0;
    let dragDistance = 0;
    let orbitAzimuth = 0.7;
    let orbitElevation = 0.55;
    let orbitDistance = 42;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isMouseDown = true;
        activeMouseButton = e.button;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
        dragDistance = 0;
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
      dragDistance += Math.abs(dx) + Math.abs(dy);

      if (activeMouseButton === 0) {
        // 🖱️ Fare Sol Tık + Sürükleme: Çiftlik etrafında 360° serbest yörüngede (Orbit) dönme
        orbitAzimuth -= dx * 0.006;
        orbitElevation = Math.max(0.1, Math.min(Math.PI / 2.1, orbitElevation + dy * 0.006));
      } else if (activeMouseButton === 2) {
        // 🖱️ Fare Sağ Tık + Sürükleme: Kamerayı koridorlar boyunca yatay düzlemde kaydır (Pan)
        const forward = new THREE.Vector3(-Math.sin(orbitAzimuth), 0, -Math.cos(orbitAzimuth)).normalize();
        const right = new THREE.Vector3(Math.cos(orbitAzimuth), 0, -Math.sin(orbitAzimuth)).normalize();
        const panFactor = orbitDistance * 0.0016;
        cameraTargetRef.current.addScaledVector(right, -dx * panFactor);
        cameraTargetRef.current.addScaledVector(forward, dy * panFactor);
      }
    };

    const onWheel = (e: WheelEvent) => {
      // 🔍 Fare Tekerleği: Yakınlaşma ve uzaklaşma (Zoom)
      orbitDistance = Math.max(12, Math.min(95, orbitDistance + e.deltaY * 0.04));
    };

    const onContextMenu = (e: MouseEvent) => {
      // Sağ tık pan sırasında tarayıcı menüsünün açılmasını engelle
      e.preventDefault();
    };

    // Raycast on Click to Select Cow
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      // Sürükleme yapıldıysa ineğe tıklama olayını tetikleme
      if (dragDistance > 6) return;
      if (e.button !== 0) return;

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
    dom.addEventListener('contextmenu', onContextMenu);

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

    // Catmull-Rom Smooth Closed Route for Tractor & TMR Mixer Wagon (Central Feed Alley & Feed Center Circuit)
    const feedRouteCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(14, 0.32, 10),   // 1. Silaj ambarı & yem hazırlama alanı
      new THREE.Vector3(13, 0.32, 4.5),  // 2. Avlu yaklaşım yolu
      new THREE.Vector3(9, 0.32, 0.65),  // 3. Doğu kapısından ahır içine giriş
      new THREE.Vector3(-10, 0.32, 0.65),// 4. Merkezi yem yolunda batıya seyir (Güney yemlik kilitleri hattı)
      new THREE.Vector3(-24, 0.32, 0.65),// 5. Batı kapısına yaklaşım
      new THREE.Vector3(-27, 0.32, 0.0), // 6. Batı U-dönüşü apeksi (5.0m yem yolu dönüş manevrası)
      new THREE.Vector3(-24, 0.32, -0.65),// 7. Kuzey yemlik kilitleri hattına dönüş
      new THREE.Vector3(-10, 0.32, -0.65),// 8. Merkezi yem yolunda doğuya seyir (Kuzey yemlik kilitleri hattı)
      new THREE.Vector3(9, 0.32, -0.65), // 9. Doğu kapısına varış
      new THREE.Vector3(13, 0.32, 4.5),  // 10. Doğu kapısından avluya çıkış ve yem merkezine dönüş
    ], true);

    const animate = (currentTime: number) => {
      animId = requestAnimationFrame(animate);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const time = (currentTime - startTime) / 1000;

      // Güncel Zustand store verisini doğrudan oku (React closure stale state problemini önler)
      const currentFarmState = useFarmStore.getState().farm;

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

      // Animate Manure Scrapers (Moving strictly from Clean East End towards West Drop Pit & Lagoon)
      const isScraperRunning = currentFarmState.logistics?.equipment.manureScraperRunning !== false;
      if (scraperMeshRef.current && isScraperRunning) {
        const cycleDuration = 32; // 32-second total cycle (slow, realistic animal-safe scraping speed)
        const progress = (time % cycleDuration) / cycleDuration; // 0.0 to 1.0

        let posX: number;
        let isScraping: boolean;

        if (progress < 0.58) {
          // Scraping Stroke: From Clean End (x = 5.5) towards West Discharge Drop Pit (x = -26.5)
          const t = progress / 0.58;
          posX = 5.5 + t * (-26.5 - 5.5);
          isScraping = true;
        } else {
          // Return Stroke: From Drop Pit (x = -26.5) back to Clean End (x = 5.5) with wings collapsed
          const t = (progress - 0.58) / 0.42;
          posX = -26.5 + t * (5.5 - (-26.5));
          isScraping = false;
        }

        ['scraper_north', 'scraper_south'].forEach((scraperName) => {
          const scraper = scraperMeshRef.current?.getObjectByName(scraperName);
          if (scraper) {
            scraper.position.x = posX;

            // Wing angles: open when scraping forward (pushing manure), folded when returning
            const targetWingAngle = isScraping ? 0.42 : 0.09;
            const wingL = scraper.getObjectByName('wing_l');
            const wingR = scraper.getObjectByName('wing_r');
            const manure = scraper.getObjectByName('manure_pile');

            if (wingL && wingR) {
              wingL.rotation.y = targetWingAngle;
              wingR.rotation.y = -targetWingAngle;
            }

            if (manure) {
              manure.visible = isScraping;
              // Accumulate manure volume as it advances towards the drop pit
              const progressFraction = Math.max(0.1, (5.5 - posX) / 32);
              manure.scale.set(0.6 + progressFraction * 0.6, 1, 0.7 + progressFraction * 0.5);
            }
          }
        });
      }

      // Animate Tractor & TMR Mixer Wagon along Central Feed Alley (Catmull-Rom kesintisiz pürüzsüz seyir)
      if (tractorTruckRef.current) {
        const isTmrRunning = currentFarmState.logistics?.equipment.tmrMixerRunning !== false;

        if (isTmrRunning) {
          const loopDuration = 48; // 48 saniyelik pürüzsüz ve gerçekçi yem dağıtım turu
          const u = (time % loopDuration) / loopDuration;
          const pos = feedRouteCurve.getPointAt(u);
          tractorTruckRef.current.position.copy(pos);

          // Sürüş yönüne doğru pürüzsüz yönelme (Heading)
          const tangent = feedRouteCurve.getTangentAt(u).normalize();
          if (tangent.lengthSq() > 0.001) {
            const targetYaw = Math.atan2(tangent.x, tangent.z);
            const curYaw = tractorTruckRef.current.rotation.y;
            let diff = targetYaw - curYaw;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            tractorTruckRef.current.rotation.y += diff * 0.25;
          }

          // Dikey helezon karıştırıcının dönüşü
          const auger = tractorTruckRef.current.getObjectByName('mixer_auger');
          if (auger) {
            auger.rotation.y += 15 * delta;
          }

          // Traktör ve mikser tekerleklerinin aks boyunca dönmesi
          tractorTruckRef.current.traverse((child) => {
            if (child.name.includes('wheel')) {
              child.rotation.x += 14 * delta;
            }
          });

          // Canlı yem döküm akışı (Ahır içindeyken yemlik kilitlerine taze TMR akışı)
          const feedStream = tractorTruckRef.current.getObjectByName('feed_stream');
          if (feedStream) {
            feedStream.visible = pos.x >= -25 && pos.x <= 8.5;
            if (feedStream.visible) {
              feedStream.scale.y = 0.85 + Math.sin(time * 25) * 0.15;
            }
          }

          // Motor rölanti mikro-titreşimi
          const hood = tractorTruckRef.current.getObjectByName('tractor_hood');
          if (hood) {
            hood.position.y = 1.2 + Math.sin(time * 35) * 0.008;
          }
        } else {
          // Park Halinde (Silaj ambarı önü)
          const parkPos = new THREE.Vector3(14, 0.32, 10);
          tractorTruckRef.current.position.lerp(parkPos, 0.08);
          tractorTruckRef.current.rotation.y = -0.6;
          const feedStream = tractorTruckRef.current.getObjectByName('feed_stream');
          if (feedStream) feedStream.visible = false;
        }
      }

      // Animate Juno-X Feed Pusher along central feed bunk
      if (junoRobotRef.current) {
        const junoX = -24 + ((Math.sin(time * 0.35) + 1) / 2) * 26;
        junoRobotRef.current.position.x = junoX;
        junoRobotRef.current.position.z = 1.7;
        const skirt = junoRobotRef.current.getObjectByName('juno_skirt');
        if (skirt) skirt.rotation.y += 6 * delta;
      }

      // Animate Discovery-Vac Manure Robot along alley
      if (discoveryRobotRef.current) {
        const vacX = -26 + ((Math.cos(time * 0.28) + 1) / 2) * 22;
        discoveryRobotRef.current.position.x = vacX;
        discoveryRobotRef.current.position.z = -5.8;
        discoveryRobotRef.current.rotation.y = Math.sin(time * 0.28) > 0 ? 0 : Math.PI;
      }

      // Animate Worker Avatar along clean-to-dirty biosecurity circuit
      if (workerAvatarRef.current) {
        const waypoints = [
          new THREE.Vector3(18, 0, 18),
          new THREE.Vector3(26, 0, -18),
          new THREE.Vector3(-16, 0, -22),
          new THREE.Vector3(-10, 0, 0),
          new THREE.Vector3(-28, 0, 8),
          new THREE.Vector3(-28, 0, -8),
        ];
        const loopDuration = 45;
        const t = (time % loopDuration) / loopDuration;
        const totalSegments = waypoints.length;
        const segFloat = t * totalSegments;
        const segIdx = Math.floor(segFloat);
        const segT = segFloat - segIdx;
        const p1 = waypoints[segIdx];
        const p2 = waypoints[(segIdx + 1) % totalSegments];

        workerAvatarRef.current.position.lerpVectors(p1, p2, segT);
        const lookDir = new THREE.Vector3().subVectors(p2, p1).normalize();
        if (lookDir.lengthSq() > 0.001) {
          workerAvatarRef.current.rotation.y = Math.atan2(lookDir.x, lookDir.z);
        }

        const leftLeg = workerAvatarRef.current.getObjectByName('worker_lleg');
        const rightLeg = workerAvatarRef.current.getObjectByName('worker_rleg');
        if (leftLeg && rightLeg) {
          leftLeg.rotation.x = Math.sin(time * 6) * 0.4;
          rightLeg.rotation.x = -Math.sin(time * 6) * 0.4;
        }
      }

      // Toggle Routes Overlay visibility based on live farm state
      if (routesOverlayRef.current) {
        routesOverlayRef.current.visible = !!currentFarmState.logistics?.routesVisible3D;
      }

      // Animate Digital Twin IoT Probes & Smart Shedding Gate
      if (digitalTwinGroupRef.current) {
        const isDtVisible = currentFarmState.digitalTwin?.mode3DOverlay ?? true;
        digitalTwinGroupRef.current.visible = isDtVisible;
        const beaconMat = digitalTwinGroupRef.current.userData?.beaconMat;
        if (beaconMat) {
          beaconMat.emissiveIntensity = 0.5 + Math.sin(time * 5) * 0.4;
        }
      }

      if (sheddingGateRef.current) {
        const gateProgress = currentFarmState.digitalTwin?.sheddingGate.gateOpenProgress ?? 0;
        const gateWing = sheddingGateRef.current.getObjectByName('shedding_wing');
        if (gateWing) {
          gateWing.rotation.y = gateProgress * 1.15;
        }
        const greenLight = sheddingGateRef.current.getObjectByName('light_green');
        const redLight = sheddingGateRef.current.getObjectByName('light_red');
        if (greenLight && redLight) {
          greenLight.visible = gateProgress < 0.2;
          redLight.visible = gateProgress >= 0.2;
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
      dom.removeEventListener('contextmenu', onContextMenu);
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
  tankerTruckRef: React.MutableRefObject<THREE.Group | null>,
  tractorTruckRef?: React.MutableRefObject<THREE.Group | null>
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

  // Pitched Roof (1:3 Slope for Optimal Thermal Stack Effect)
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

  // Continuous Open Ridge Vent with Wind Deflector (CIGR / MWPS Natural Chimney Ventilation)
  const ridgeVentCapGeo = new THREE.BoxGeometry(42, 0.12, 1.6);
  const ridgeCapMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
  const ridgeCap = new THREE.Mesh(ridgeVentCapGeo, ridgeCapMat);
  ridgeCap.position.set(-10, 8.65, 0);
  scene.add(ridgeCap);

  // Ridge vent vertical support brackets
  for (let rx = -28; rx <= 8; rx += 8) {
    const bracketGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8);
    const bracketMat = new THREE.MeshStandardMaterial({ color: '#64748b' });
    const b1 = new THREE.Mesh(bracketGeo, bracketMat);
    b1.position.set(rx, 8.4, -0.6);
    const b2 = new THREE.Mesh(bracketGeo, bracketMat);
    b2.position.set(rx, 8.4, 0.6);
    scene.add(b1, b2);
  }

  // Ceiling Ventilation Fans (High-Efficiency Circulation Fans over Stalls & Feed Alley)
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

  // 2.1 Self-Locking Feed Bunk Headlocks (Yemlik Kilitleri - CIGR / FAO Standard 70 cm per cow)
  const headlockMat = new THREE.MeshStandardMaterial({ color: '#64748b', metalness: 0.6, roughness: 0.3 });
  [-2.5, 2.5].forEach((bz) => {
    // Top and Bottom Horizontal Rails along feed bunk
    const topRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 34, 8), headlockMat);
    topRail.rotateZ(Math.PI / 2);
    topRail.position.set(-10, 1.05, bz);
    const bottomRail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 34, 8), headlockMat);
    bottomRail.rotateZ(Math.PI / 2);
    bottomRail.position.set(-10, 0.28, bz);
    scene.add(topRail, bottomRail);

    // Stanchions every 0.72m (Modular headlock pivot bars)
    for (let hx = -26; hx <= 6; hx += 0.72) {
      const vBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 6), headlockMat);
      vBar.position.set(hx, 0.65, bz);
      scene.add(vBar);

      // Angled pivot locking arm
      const pivotArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.75, 6), headlockMat);
      pivotArm.rotation.z = 0.22;
      pivotArm.position.set(hx + 0.16, 0.65, bz);
      scene.add(pivotArm);
    }
  });

  // 2.2 CIGR & Dairyland Initiative Freestalls (1.25 m Width, 2.60 m Length, Cantilever Loops)
  const stallMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.3, metalness: 0.5 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.4, metalness: 0.7 });
  const beddingMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.95 });
  const brisketMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });

  [-7.5, 7.5].forEach((sz) => {
    const isNorth = sz < 0;
    // Bedding Mattress Base (10 cm raised comfort layer)
    const mattressGeo = new THREE.BoxGeometry(33, 0.12, 2.6);
    const mattress = new THREE.Mesh(mattressGeo, beddingMat);
    mattress.position.set(-10, 0.16, sz);
    mattress.receiveShadow = true;
    scene.add(mattress);

    // Brisket Board (Göğüs Tahtası - 10 cm height along front of stall)
    const brisketGeo = new THREE.BoxGeometry(33, 0.16, 0.08);
    const brisket = new THREE.Mesh(brisketGeo, brisketMat);
    brisket.position.set(-10, 0.22, isNorth ? sz - 1.25 : sz + 1.25);
    scene.add(brisket);

    // Continuous Neck Rail (Boyun Demiri - 1.22 m height across all stalls)
    const neckRailGeo = new THREE.CylinderGeometry(0.035, 0.035, 33, 8);
    neckRailGeo.rotateZ(Math.PI / 2);
    const neckRail = new THREE.Mesh(neckRailGeo, pipeMat);
    neckRail.position.set(-10, 1.22, isNorth ? sz - 0.7 : sz + 0.7);
    scene.add(neckRail);

    // Cantilever Divider Loops at 1.25m spacing
    for (let sx = -26; sx <= 6; sx += 1.25) {
      // Support post
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.3, 8), pipeMat);
      post.position.set(sx, 0.75, isNorth ? sz - 1.25 : sz + 1.25);
      scene.add(post);

      // Curved loop
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.032, 8, 16, Math.PI), stallMat);
      loop.rotation.y = Math.PI / 2;
      loop.rotation.x = isNorth ? -Math.PI / 2 : Math.PI / 2;
      loop.position.set(sx, 0.95, isNorth ? sz - 0.5 : sz + 0.5);
      scene.add(loop);
    }
  });

  // 2.3 Crossover Tipping Water Troughs (Devrilir Paslanmaz Suluklar - CIGR / Dairyland Standard)
  const troughBodyMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.85, roughness: 0.2 });
  const waterMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.1, transparent: true, opacity: 0.85 });

  const waterTroughPositions = [
    [-10, -7.5],
    [-10, 7.5],
    [-26, -7.5],
  ];

  waterTroughPositions.forEach(([tx, tz]) => {
    const troughGroup = new THREE.Group();
    troughGroup.position.set(tx, 0.45, tz);

    // Stainless basin
    const basin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 0.6), troughBodyMat);
    basin.castShadow = true;
    troughGroup.add(basin);

    // Water level
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.48), waterMat);
    water.position.y = 0.15;
    troughGroup.add(water);

    // Overhead protective guard pipe
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.1, 8), headlockMat);
    guard.rotateZ(Math.PI / 2);
    guard.position.y = 0.45;
    troughGroup.add(guard);

    scene.add(troughGroup);
  });

  // 2.4 Automatic Oscillating Cow Brush (Döner Kaşıma Fırçası - EU Welfare Directive 98/58/EC)
  const brushGroup = new THREE.Group();
  brushGroup.position.set(-10, 2.1, 3.8);

  const mountArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), headlockMat);
  mountArm.position.z = -0.4;
  brushGroup.add(mountArm);

  const motorHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.35, 12), pipeMat);
  motorHousing.position.z = -0.8;
  brushGroup.add(motorHousing);

  const brushRollerMat = new THREE.MeshStandardMaterial({ color: '#eab308', roughness: 0.9 });
  const brushRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 16), brushRollerMat);
  brushRoller.position.set(0, -0.45, -0.8);
  brushRoller.rotation.x = 0.18;
  brushRoller.castShadow = true;
  brushGroup.add(brushRoller);

  scene.add(brushGroup);

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
  buildTractorAndMixer(scene, tractorTruckRef);

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

function buildTractorAndMixer(
  scene: THREE.Scene,
  tractorRef?: React.MutableRefObject<THREE.Group | null>
): void {
  const tractorGroup = new THREE.Group();
  tractorGroup.name = 'tractor_tmr_group';
  tractorGroup.position.set(6, 0.1, 14);
  tractorGroup.rotation.y = -0.6;

  const redMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 });
  const blackMat = new THREE.MeshStandardMaterial({ color: '#171717', roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.1, transparent: true, opacity: 0.7 });

  // Chassis & Engine Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 2.2), redMat);
  hood.name = 'tractor_hood';
  hood.position.set(0, 1.2, 0.6);
  hood.castShadow = true;
  tractorGroup.add(hood);

  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1.4), glassMat);
  cabin.name = 'tractor_cabin';
  cabin.position.set(0, 2.2, -0.9);
  tractorGroup.add(cabin);

  // Exhaust Stack
  const exhaustMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.3, metalness: 0.8 });
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), exhaustMat);
  exhaust.position.set(0.7, 2.2, 0.2);
  exhaust.castShadow = true;
  tractorGroup.add(exhaust);

  // Headlights
  const lightMat = new THREE.MeshStandardMaterial({ color: '#fef08a', emissive: '#fef08a', emissiveIntensity: 0.8 });
  [-0.6, 0.6].forEach((lx) => {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.1), lightMat);
    lamp.position.set(lx, 1.3, 1.72);
    tractorGroup.add(lamp);
  });

  // Big Rear Wheels
  const rearWheelGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.5, 16);
  rearWheelGeo.rotateZ(Math.PI / 2);
  [-1.0, 1.0].forEach((wx) => {
    const rearWheel = new THREE.Mesh(rearWheelGeo, blackMat);
    rearWheel.position.set(wx, 0.85, -0.9);
    rearWheel.castShadow = true;
    rearWheel.name = 'tractor_wheel_rear';
    tractorGroup.add(rearWheel);
  });

  // Front Wheels
  const frontWheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16);
  frontWheelGeo.rotateZ(Math.PI / 2);
  [-0.9, 0.9].forEach((wx) => {
    const frontWheel = new THREE.Mesh(frontWheelGeo, blackMat);
    frontWheel.position.set(wx, 0.5, 1.2);
    frontWheel.castShadow = true;
    frontWheel.name = 'tractor_wheel_front';
    tractorGroup.add(frontWheel);
  });

  // TMR Vertical Mixer Wagon attached behind
  const mixerGroup = new THREE.Group();
  mixerGroup.name = 'tmr_mixer_wagon';
  mixerGroup.position.set(0, 0, -3.8);

  const wagonMat = new THREE.MeshStandardMaterial({ color: '#2563eb', roughness: 0.5 });
  const tubGeo = new THREE.CylinderGeometry(1.6, 1.2, 2.2, 16);
  const tub = new THREE.Mesh(tubGeo, wagonMat);
  tub.name = 'mixer_tub';
  tub.position.y = 1.6;
  tub.castShadow = true;
  mixerGroup.add(tub);

  // Mixer Trailer Wheels
  const wagonWheelGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.38, 16);
  wagonWheelGeo.rotateZ(Math.PI / 2);
  [-1.25, 1.25].forEach((wx) => {
    const wagonWheel = new THREE.Mesh(wagonWheelGeo, blackMat);
    wagonWheel.position.set(wx, 0.65, 0);
    wagonWheel.castShadow = true;
    wagonWheel.name = 'wagon_wheel';
    mixerGroup.add(wagonWheel);
  });

  // Side Discharge Chute (Yem Boşaltma Konveyörü)
  const chuteMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.6 });
  const chute = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.6), chuteMat);
  chute.position.set(1.4, 0.9, 0.4);
  chute.rotation.z = -0.3;
  mixerGroup.add(chute);

  // Live Silage Stream from Chute onto Feed Bunk (Aktif TMR Döküm Akışı)
  const streamMat = new THREE.MeshStandardMaterial({
    color: '#ca8a04',
    roughness: 0.95,
    emissive: '#713f12',
    emissiveIntensity: 0.25,
  });
  const feedStream = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.75, 0.45), streamMat);
  feedStream.name = 'feed_stream';
  feedStream.position.set(1.55, 0.45, 0.4);
  feedStream.rotation.z = -0.2;
  mixerGroup.add(feedStream);

  // Mixer Auger inside tub (Dönen dikey helezon karıştırıcı)
  const auger = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 8), new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.4 }));
  auger.name = 'mixer_auger';
  auger.position.y = 1.6;
  mixerGroup.add(auger);

  tractorGroup.add(mixerGroup);
  scene.add(tractorGroup);
  if (tractorRef) {
    tractorRef.current = tractorGroup;
  }
}

// -------------------------------------------------------------
// Biosecurity & Logistics 3D Helpers
// -------------------------------------------------------------

function buildBiosecurityStructures(
  scene: THREE.Scene,
  scraperRef: React.MutableRefObject<THREE.Mesh | null>,
  milkTaxiRef: React.MutableRefObject<THREE.Group | null>
): void {
  // 1. Office & Personnel Entrance Disinfection Footbath
  const officeBasinMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.8 });
  const liquidMat = new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.1, transparent: true, opacity: 0.8 });

  const officeBasin = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 1.6), officeBasinMat);
  officeBasin.position.set(18, 0.1, 15);
  scene.add(officeBasin);

  const officeLiquid = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.12, 1.3), liquidMat);
  officeLiquid.position.set(18, 0.16, 15);
  scene.add(officeLiquid);

  // 2. Milking Parlor Exit Cattle Footbath (Dairyland Initiative / Dr. Nigel Cook Standard)
  // Length: 3.60 m (guarantees >= 2 dunks per foot), Width: 0.75 m (prevents double file), Depth: 0.15 m
  const footbathGroup = new THREE.Group();
  footbathGroup.position.set(-16, 0.1, -15);

  const footbathBasin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.28, 3.8), officeBasinMat);
  footbathGroup.add(footbathBasin);

  const footbathLiquid = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.15, 3.6),
    new THREE.MeshStandardMaterial({ color: '#059669', roughness: 0.2, transparent: true, opacity: 0.85 })
  );
  footbathLiquid.position.y = 0.08;
  footbathGroup.add(footbathLiquid);

  // Angled Side Splashboards (70° incline to keep solution inside and guide hooves)
  const splashboardMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.5 });
  [-0.48, 0.48].forEach((bx) => {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.6, 3.6), splashboardMat);
    board.position.set(bx, 0.35, 0);
    board.rotation.z = bx > 0 ? 0.35 : -0.35;
    footbathGroup.add(board);
  });

  scene.add(footbathGroup);

  // 3. Barn Dual Alley Manure Scrapers (Kuzey ve Güney Gübre Koridorları Otomatik Sıyırıcıları)
  // Direction of Travel: From Clean East End (x = +6) towards West Drop Pit & Lagoon (x = -27)
  const scrapersMasterGroup = new THREE.Group();
  scrapersMasterGroup.name = 'scrapers_master_group';

  const scraperMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.3 });
  const cableMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
  const grateMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.9, roughness: 0.4 });
  const motorMat = new THREE.MeshStandardMaterial({ color: '#1e3a8a', roughness: 0.5 });
  const manureMat = new THREE.MeshStandardMaterial({ color: '#27201c', roughness: 0.95 });

  const alleyConfigs = [
    { name: 'scraper_north', z: -5.0 },
    { name: 'scraper_south', z: 5.0 },
  ];

  alleyConfigs.forEach(({ name, z }) => {
    // 3.1 Heavy-Duty Steel Guide Cable along X axis
    const cableGeo = new THREE.CylinderGeometry(0.02, 0.02, 34, 8);
    cableGeo.rotateZ(Math.PI / 2);
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(-10, 0.08, z);
    scrapersMasterGroup.add(cable);

    // 3.2 Idler Corner Pulley at Clean East End (x = 6.8)
    const idlerPulley = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.15, 12), scraperMat);
    idlerPulley.position.set(6.8, 0.15, z);
    scrapersMasterGroup.add(idlerPulley);

    // 3.3 Drive Winch & Electric Gear Motor at Discharge West End (x = -27.8)
    const driveMotor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), motorMat);
    driveMotor.position.set(-27.8, 0.45, z);
    driveMotor.castShadow = true;
    scrapersMasterGroup.add(driveMotor);

    // 3.4 Cross-Gutter Drop Pit Grate (Enine Gübre Boşaltım Izgarası at x = -26.8)
    // Manure drops through this grate into the underground pipe connecting to the lagoon
    const dropGrate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 3.4), grateMat);
    dropGrate.position.set(-26.8, 0.12, z);
    dropGrate.receiveShadow = true;
    scrapersMasterGroup.add(dropGrate);

    // 3.5 The Scraper Sled with Folding V-Wings (Sıyırıcı Kızağı ve Katlanır Kanatlar)
    const scraperSled = new THREE.Group();
    scraperSled.name = name;
    scraperSled.position.set(0, 0.12, z);

    // Center Hitch / Guide Slider
    const centerSlider = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.35), scraperMat);
    centerSlider.position.set(0, 0.1, 0);
    centerSlider.castShadow = true;
    scraperSled.add(centerSlider);

    // Left Folding Wing (Pivot attached to slider, reaches to alley curb)
    const wingLGroup = new THREE.Group();
    wingLGroup.name = 'wing_l';
    wingLGroup.position.set(0.1, 0.12, -0.15);
    const bladeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 1.6), scraperMat);
    bladeL.position.set(0.15, 0, -0.8);
    bladeL.castShadow = true;
    wingLGroup.add(bladeL);
    scraperSled.add(wingLGroup);

    // Right Folding Wing (Pivot attached to slider, reaches to alley curb)
    const wingRGroup = new THREE.Group();
    wingRGroup.name = 'wing_r';
    wingRGroup.position.set(0.1, 0.12, 0.15);
    const bladeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 1.6), scraperMat);
    bladeR.position.set(0.15, 0, 0.8);
    bladeR.castShadow = true;
    wingRGroup.add(bladeR);
    scraperSled.add(wingRGroup);

    // Manure Wave / Pile in front of the blade being pushed towards the drop pit (-X direction)
    const manurePile = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 2.6), manureMat);
    manurePile.name = 'manure_pile';
    manurePile.position.set(-0.55, 0.11, 0);
    scraperSled.add(manurePile);

    scrapersMasterGroup.add(scraperSled);
  });

  scene.add(scrapersMasterGroup);
  scraperRef.current = scrapersMasterGroup as unknown as THREE.Mesh;

  // 4. Milk Taxi (Buzağı Süt Taksisi - Mobile Calf Milk Feeder)
  const milkTaxi = new THREE.Group();
  milkTaxi.position.set(23, 0, -15);

  const tankMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.9, roughness: 0.15 });
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.9, 16), tankMat);
  tank.position.y = 0.8;
  tank.castShadow = true;
  milkTaxi.add(tank);

  // Milk Taxi Handle & Wheels
  const wheelMat = new THREE.MeshStandardMaterial({ color: '#1f2937' });
  [-0.45, 0.45].forEach((wx) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 12), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(wx, 0.2, 0);
    milkTaxi.add(w);
  });
  const castor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), wheelMat);
  castor.rotation.z = Math.PI / 2;
  castor.position.set(0, 0.12, -0.45);
  milkTaxi.add(castor);

  // Handlebar
  const barMat = new THREE.MeshStandardMaterial({ color: '#ef4444' });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.05), barMat);
  bar.position.set(0, 1.1, -0.5);
  milkTaxi.add(bar);

  scene.add(milkTaxi);
  milkTaxiRef.current = milkTaxi;

  // 5. Cattle Loading / Unloading Ramp (Hayvan Yükleme Rampası)
  const rampGroup = new THREE.Group();
  rampGroup.position.set(-36, 0, 10);

  const rampMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.8 });
  const ramp = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 7.0), rampMat);
  ramp.position.set(0, 0.9, 0);
  ramp.rotation.x = -0.25;
  ramp.castShadow = true;
  rampGroup.add(ramp);

  // Ramp safety rails
  const railMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.6 });
  [-1.7, 1.7].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 7.0), railMat);
    rail.position.set(rx, 1.5, 0);
    rail.rotation.x = -0.25;
    rampGroup.add(rail);
  });

  scene.add(rampGroup);

  // 6. Downwind Manure Lagoon & Separator Platform (ASABE / EU Directive Compliance)
  const lagoonGroup = new THREE.Group();
  lagoonGroup.position.set(-38, 0, -2);

  // Concrete pit wall rim
  const wallMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.9 });
  const lagoonWall = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.8, 8.0), wallMat);
  lagoonWall.position.y = 0.4;
  lagoonGroup.add(lagoonWall);

  // Dark manure slurry liquid
  const slurryMat = new THREE.MeshStandardMaterial({ color: '#27201c', roughness: 0.2, metalness: 0.3 });
  const slurry = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.1, 7.4), slurryMat);
  slurry.position.y = 0.65;
  lagoonGroup.add(slurry);

  // Perimeter Safety Fence (Mandatory by ASABE safety code)
  const safetyFenceGeo = new THREE.BoxGeometry(8.2, 1.2, 8.2);
  const safetyWireMat = new THREE.MeshBasicMaterial({ color: '#e2e8f0', wireframe: true });
  const safetyFence = new THREE.Mesh(safetyFenceGeo, safetyWireMat);
  safetyFence.position.y = 1.0;
  lagoonGroup.add(safetyFence);

  // Mechanical Screw-press Separator Tower
  const towerMat = new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.7, roughness: 0.3 });
  const separatorTower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.2, 1.6), towerMat);
  separatorTower.position.set(3.2, 1.6, 3.2);
  separatorTower.castShadow = true;
  lagoonGroup.add(separatorTower);

  scene.add(lagoonGroup);
}

function buildBiosecurityRoutesOverlay(scene: THREE.Scene): THREE.Group {
  const overlayGroup = new THREE.Group();
  overlayGroup.name = 'biosecurity_routes_overlay';

  // 1. Clean Path (Green): Entry -> Office -> Calves -> Milking Parlor -> Barn
  const cleanPoints = [
    new THREE.Vector3(18, 0.25, 22),
    new THREE.Vector3(18, 0.25, 14),
    new THREE.Vector3(26, 0.25, -14),
    new THREE.Vector3(26, 0.25, -20),
    new THREE.Vector3(-16, 0.25, -20),
    new THREE.Vector3(-10, 0.25, -5),
    new THREE.Vector3(-10, 0.25, 0),
  ];
  const cleanGeo = new THREE.BufferGeometry().setFromPoints(cleanPoints);
  const cleanMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 });
  const cleanLine = new THREE.Line(cleanGeo, cleanMat);
  overlayGroup.add(cleanLine);

  // 2. Dirty Path (Red): Barn -> Sick Bay / Quarantine -> Manure Lagoon
  const dirtyPoints = [
    new THREE.Vector3(-10, 0.25, 0),
    new THREE.Vector3(-28, 0.25, -8),
    new THREE.Vector3(-36, 0.25, -5),
    new THREE.Vector3(-36, 0.25, 10),
  ];
  const dirtyGeo = new THREE.BufferGeometry().setFromPoints(dirtyPoints);
  const dirtyMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 });
  const dirtyLine = new THREE.Line(dirtyGeo, dirtyMat);
  overlayGroup.add(dirtyLine);

  // 3. Cow Milking Flow (Cyan/Blue): Barn -> Parlor -> Footbath -> Return
  const milkingLoop = [
    new THREE.Vector3(-10, 0.25, -2),
    new THREE.Vector3(-16, 0.25, -12),
    new THREE.Vector3(-16, 0.25, -22),
    new THREE.Vector3(-14, 0.25, -16),
    new THREE.Vector3(-10, 0.25, 4),
  ];
  const milkingGeo = new THREE.BufferGeometry().setFromPoints(milkingLoop);
  const milkingMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, linewidth: 2 });
  const milkingLine = new THREE.Line(milkingGeo, milkingMat);
  overlayGroup.add(milkingLine);

  // 4. Zone Markers (Glowing discs on the ground)
  const zoneMarkersData = [
    { pos: [18, 0.15, 18], color: 0x3b82f6, radius: 2.2 }, // Office / Entry
    { pos: [26, 0.15, -18], color: 0x10b981, radius: 3.5 }, // Calves (Level 1)
    { pos: [-16, 0.15, -22], color: 0x10b981, radius: 4.0 }, // Milking (Level 1)
    { pos: [-10, 0.15, 0], color: 0xf59e0b, radius: 5.0 }, // Freestall Barn (Level 3)
    { pos: [-28, 0.15, 8], color: 0xf59e0b, radius: 3.0 }, // Maternity (Level 3)
    { pos: [-28, 0.15, -8], color: 0xef4444, radius: 3.0 }, // Quarantine (Level 4)
    { pos: [-36, 0.15, 4], color: 0x78716c, radius: 4.0 }, // Manure Lagoon (Level 5)
  ];

  zoneMarkersData.forEach((z) => {
    const discGeo = new THREE.RingGeometry(z.radius - 0.2, z.radius, 32);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({ color: z.color, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const disc = new THREE.Mesh(discGeo, discMat);
    disc.position.set(z.pos[0], z.pos[1], z.pos[2]);
    overlayGroup.add(disc);
  });

  overlayGroup.visible = true;
  scene.add(overlayGroup);
  return overlayGroup;
}

function buildWorkerAvatar(scene: THREE.Scene): THREE.Group {
  const worker = new THREE.Group();
  worker.name = 'farm_worker_avatar';
  worker.position.set(18, 0, 18);

  const suitMat = new THREE.MeshStandardMaterial({ color: '#1d4ed8', roughness: 0.6 }); // Clean Blue coveralls
  const vestMat = new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.4 }); // Hi-vis safety vest
  const skinMat = new THREE.MeshStandardMaterial({ color: '#fed7aa', roughness: 0.5 });
  const bootMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
  const capMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 }); // White hygiene cap

  // Pelvis / Waist
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), suitMat);
  pelvis.position.y = 1.05;
  worker.add(pelvis);

  // Torso & Hi-vis Vest
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.65, 0.35), vestMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  worker.add(torso);

  // Head & Hygiene Cap
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.32), skinMat);
  head.position.y = 1.95;
  head.castShadow = true;
  worker.add(head);

  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.16, 12), capMat);
  cap.position.y = 2.14;
  worker.add(cap);

  // Arms
  [-0.38, 0.38].forEach((ax) => {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), suitMat);
    arm.position.set(ax, 1.4, 0);
    worker.add(arm);
  });

  // Left Leg
  const leftLegGroup = new THREE.Group();
  leftLegGroup.name = 'worker_lleg';
  leftLegGroup.position.set(-0.16, 0.95, 0);
  const leftPants = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.2), suitMat);
  leftPants.position.y = -0.3;
  leftLegGroup.add(leftPants);
  const leftBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.3), bootMat);
  leftBoot.position.set(0, -0.65, 0.05);
  leftLegGroup.add(leftBoot);
  worker.add(leftLegGroup);

  // Right Leg
  const rightLegGroup = new THREE.Group();
  rightLegGroup.name = 'worker_rleg';
  rightLegGroup.position.set(0.16, 0.95, 0);
  const rightPants = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.2), suitMat);
  rightPants.position.y = -0.3;
  rightLegGroup.add(rightPants);
  const rightBoot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.3), bootMat);
  rightBoot.position.set(0, -0.65, 0.05);
  rightLegGroup.add(rightBoot);
  worker.add(rightLegGroup);

  scene.add(worker);
  return worker;
}

// -----------------------------------------------------------------------------
// Dijital İkiz (Digital Twin) 3D IoT Sensör Probları & Akıllı Ayırma Kapısı
// -----------------------------------------------------------------------------
function buildDigitalTwinObjects(
  scene: THREE.Scene,
  dtGroupRef: React.MutableRefObject<THREE.Group | null>,
  sheddingGateRef: React.MutableRefObject<THREE.Group | null>
): void {
  const dtMasterGroup = new THREE.Group();
  dtMasterGroup.name = 'digital_twin_master_group';

  // 1. IoT Sensör Düğümleri (Barınak makaslarına ve kritik noktalara asılı problar)
  const sensorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.38, 8);
  const sensorHousingMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.2 });
  const beaconMat = new THREE.MeshStandardMaterial({
    color: '#10b981',
    emissive: '#10b981',
    emissiveIntensity: 0.8,
  });
  dtMasterGroup.userData.beaconMat = beaconMat;

  const probeLocations: [number, number, number][] = [
    [-18, 7.5, 5],
    [-2, 7.5, 5],
    [-18, 7.5, -5],
    [-2, 7.5, -5],
    [-10, 3.5, 0],
    [-10, 8.5, 0],
    [-10, 0.4, 2.5],
    [-10, 0.4, -2.5],
  ];

  probeLocations.forEach(([px, py, pz]) => {
    const probe = new THREE.Group();
    probe.position.set(px, py, pz);

    const housing = new THREE.Mesh(sensorGeo, sensorHousingMat);
    housing.castShadow = true;
    probe.add(housing);

    const led = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), beaconMat);
    led.position.y = 0.24;
    probe.add(led);

    // Çatı asma teli
    if (py > 5) {
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 2.2, 4),
        new THREE.MeshBasicMaterial({ color: '#475569' })
      );
      wire.position.y = 1.25;
      probe.add(wire);
    }

    dtMasterGroup.add(probe);
  });

  // 2. Mikroklima THI Termal Isı Haritası (Zemin üzeri şeffaf konfor/stres ızgarası)
  const heatmapMat = new THREE.MeshStandardMaterial({
    color: '#059669',
    transparent: true,
    opacity: 0.16,
    roughness: 0.9,
  });
  const heatmapGrid = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), heatmapMat);
  heatmapGrid.rotateX(-Math.PI / 2);
  heatmapGrid.position.set(-10, 0.18, 0);
  dtMasterGroup.add(heatmapGrid);

  scene.add(dtMasterGroup);
  dtGroupRef.current = dtMasterGroup;

  // 3. Pnömatik Otomatik Ayırma Kapısı (Smart Shedding Gate at Parlor Exit)
  const gateGroup = new THREE.Group();
  gateGroup.name = 'smart_shedding_gate';
  gateGroup.position.set(-16, 0.1, -11.5);

  const postMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8 });
  const wingMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.4, roughness: 0.3 });

  // Taşıyıcı direkler
  [-1.0, 1.0].forEach((gx) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.2, 0.15), postMat);
    post.position.set(gx, 1.1, 0);
    post.castShadow = true;
    gateGroup.add(post);
  });

  // Üst telemetri ve sensör kirişi
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.25, 0.25), postMat);
  beam.position.set(0, 2.1, 0);
  gateGroup.add(beam);

  // Durum Işıkları (Yeşil: Sürüye Dönüş / Kırmızı: Revire Ayırma)
  const greenLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 1.0 })
  );
  greenLight.name = 'light_green';
  greenLight.position.set(-0.4, 2.35, 0);
  gateGroup.add(greenLight);

  const redLight = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#ef4444', emissive: '#ef4444', emissiveIntensity: 1.0 })
  );
  redLight.name = 'light_red';
  redLight.position.set(0.4, 2.35, 0);
  redLight.visible = false;
  gateGroup.add(redLight);

  // Pnömatik itici silindir
  const cylMat = new THREE.MeshStandardMaterial({ color: '#0ea5e9', metalness: 0.6 });
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), cylMat);
  cyl.position.set(-0.85, 1.4, 0.2);
  gateGroup.add(cyl);

  // Dönen Ayırma Kanadı (Shedding Gate Wing)
  const gateWing = new THREE.Group();
  gateWing.name = 'shedding_wing';
  gateWing.position.set(-0.9, 0, 0);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.1, 0.08), wingMat);
  blade.position.set(0.9, 0.7, 0);
  blade.castShadow = true;
  gateWing.add(blade);

  gateGroup.add(gateWing);

  scene.add(gateGroup);
  sheddingGateRef.current = gateGroup;
}

function buildAgriTwinFacilityAndRobots(
  scene: THREE.Scene,
  junoRobotRef: React.MutableRefObject<THREE.Group | null>,
  discoveryRobotRef: React.MutableRefObject<THREE.Group | null>
): void {
  // 1. BIOGAS ANAEROBIC DIGESTER DOME & 60 kW CHP GENERATOR
  const biogasGroup = new THREE.Group();
  biogasGroup.name = 'biogas_facility_group';
  biogasGroup.position.set(24, 0, 18);

  // Concrete Tank Base
  const baseGeo = new THREE.CylinderGeometry(5.2, 5.2, 3.2, 24);
  const concreteMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.85 });
  const tankBase = new THREE.Mesh(baseGeo, concreteMat);
  tankBase.position.y = 1.6;
  tankBase.castShadow = true;
  tankBase.receiveShadow = true;
  biogasGroup.add(tankBase);

  // Green Gas Holder Membrane Dome
  const domeGeo = new THREE.SphereGeometry(5.2, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  const domeMat = new THREE.MeshStandardMaterial({
    color: '#15803d',
    roughness: 0.4,
    metalness: 0.1,
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.position.y = 3.2;
  domeMesh.castShadow = true;
  biogasGroup.add(domeMesh);

  // Digestate slurry inlet pipe from barn
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.7, roughness: 0.3 });
  const inletPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 12, 12), pipeMat);
  inletPipe.rotation.z = Math.PI / 2;
  inletPipe.position.set(-6, 0.4, -4);
  biogasGroup.add(inletPipe);

  // 60 kW CHP Microturbine Building
  const chpBuildingMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 });
  const chpBuilding = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.8, 3.4), chpBuildingMat);
  chpBuilding.position.set(6.5, 1.4, 0);
  chpBuilding.castShadow = true;
  biogasGroup.add(chpBuilding);

  // Exhaust Stack with thermal glow
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.5, 12), pipeMat);
  stack.position.set(6.5, 3.8, 0);
  biogasGroup.add(stack);

  // Status LED Beacon on CHP
  const chpLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#10b981', emissive: '#10b981', emissiveIntensity: 1.0 })
  );
  chpLed.position.set(4.5, 2.4, 1.8);
  biogasGroup.add(chpLed);

  scene.add(biogasGroup);

  // 2. JUNO-X AUTONOMOUS FEED PUSHER ROBOT
  const junoGroup = new THREE.Group();
  junoGroup.name = 'juno_feed_pusher';
  junoGroup.position.set(-10, 0.25, 1.7);

  // Red main cylinder body
  const junoBodyMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.35 });
  const junoBody = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 0.65, 16), junoBodyMat);
  junoBody.position.y = 0.45;
  junoBody.castShadow = true;
  junoGroup.add(junoBody);

  // Bottom Rotating Scraper Skirt
  const skirtMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 });
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.14, 16), skirtMat);
  skirt.name = 'juno_skirt';
  skirt.position.y = 0.1;
  junoGroup.add(skirt);

  // Top Dome & Ultrasonic Radar
  const topLidMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.2 });
  const topLid = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), topLidMat);
  topLid.position.y = 0.78;
  junoGroup.add(topLid);

  // Telemetry Antenna
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.45, 6), pipeMat);
  antenna.position.set(0, 1.15, 0);
  junoGroup.add(antenna);

  scene.add(junoGroup);
  junoRobotRef.current = junoGroup;

  // 3. DISCOVERY-VAC AUTONOMOUS SLURRY VACUUM ROBOT
  const vacGroup = new THREE.Group();
  vacGroup.name = 'discovery_slurry_vac';
  vacGroup.position.set(-16, 0.25, -5.8);

  const vacBodyMat = new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.4 });
  const vacBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.2), vacBodyMat);
  vacBody.position.y = 0.35;
  vacBody.castShadow = true;
  vacGroup.add(vacBody);

  // Front Suction Nozzle / Squeegee
  const nozzleMat = new THREE.MeshStandardMaterial({ color: '#0f172a', roughness: 0.9 });
  const nozzle = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.18, 0.3), nozzleMat);
  nozzle.position.set(0, 0.12, 0.65);
  vacGroup.add(nozzle);

  // Status Beacon
  const vacLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 8, 8),
    new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0.9 })
  );
  vacLed.position.set(0, 0.65, 0);
  vacGroup.add(vacLed);

  scene.add(vacGroup);
  discoveryRobotRef.current = vacGroup;
}
