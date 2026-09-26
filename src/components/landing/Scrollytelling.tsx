import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import './Scrollytelling.css';

gsap.registerPlugin(ScrollTrigger);

export default function Scrollytelling() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const section = sectionRef.current;
    if (!section) return;

    const slides = gsap.utils.toArray(".scrolly-slide", section) as HTMLElement[];
    const slideCount = slides.length;
    const panViewers: Record<number, any> = {};
    const canvasSequences: Record<number, any> = {};

    if (slideCount === 0) return;

    // 1. INICIALIZAR RENDERIZADORES DE CANVAS SEQUENCE (ESTILO APPLE 60FPS)
    slides.forEach((slide, i) => {
      const isCanvasSeq = slide.getAttribute("data-is-canvas") === "true";
      const canvas = slide.querySelector(".scrolly-canvas-seq") as HTMLCanvasElement;

      if (isCanvasSeq && canvas) {
        const framesDir = canvas.getAttribute("data-frames-dir");
        const totalFrames = parseInt(canvas.getAttribute("data-total-frames") || "30", 10);
        const ctx2d = canvas.getContext("2d");
        const images: HTMLImageElement[] = [];

        // Pré-carregar todas as fotos da sequência
        for (let f = 1; f <= totalFrames; f++) {
          const img = new Image();
          const frameIndexStr = String(f).padStart(3, "0");
          img.src = `${framesDir}/frame_${frameIndexStr}.jpg`;
          images.push(img);
        }

        function resizeCanvas() {
          if (!canvas.parentElement) return;
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);

        let targetFrame = 0;
        let currentFrame = 0;
        let lastDrawnFrame = -1;

        function setTargetFrame(frameIdx: number) {
          targetFrame = Math.max(0, Math.min(frameIdx, totalFrames - 1));
        }

        function drawFrame(frameIdx: number) {
          const img = images[Math.max(0, Math.min(frameIdx, images.length - 1))];
          if (!img || (!img.complete && img.naturalWidth === 0)) return;
          if (!ctx2d) return;
          const cw = canvas.width;
          const ch = canvas.height;
          const iw = img.naturalWidth || 1280;
          const ih = img.naturalHeight || 720;
          const scale = Math.max(cw / iw, ch / ih);
          const nw = iw * scale;
          const nh = ih * scale;
          ctx2d.clearRect(0, 0, cw, ch);
          ctx2d.globalAlpha = 1.0;
          ctx2d.drawImage(img, (cw - nw) / 2, (ch - nh) / 2, nw, nh);
        }

        let rafId: number;
        function loopRAF() {
          const diff = targetFrame - currentFrame;
          if (Math.abs(diff) > 0.001) {
            currentFrame += diff * 0.25;
          } else {
            currentFrame = targetFrame;
          }
          const frameToDraw = Math.round(currentFrame);
          if (frameToDraw !== lastDrawnFrame) {
            drawFrame(frameToDraw);
            lastDrawnFrame = frameToDraw;
          }
          rafId = requestAnimationFrame(loopRAF);
        }
        rafId = requestAnimationFrame(loopRAF);

        canvasSequences[i] = { setTargetFrame, totalFrames, cleanup: () => cancelAnimationFrame(rafId) };
      }
    });

    // 2. INICIALIZAR VISUALIZADORES 360° WEBGL
    function createThree360Viewer(container: HTMLElement, imageSrc: string) {
      if (!container) return null;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
      camera.position.set(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      const loader = new THREE.TextureLoader();
      loader.load(imageSrc, (texture: THREE.Texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
      });

      let targetYaw = 0;
      let targetPitch = 0;
      let hoverYawOffset = 0;
      let hoverPitchOffset = 0;
      let currentLon = 0;
      let currentLat = 0;
      let isUserInteracting = false;
      let isScrolling = false;
      let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

      let onPointerDownMouseX = 0;
      let onPointerDownMouseY = 0;
      let onPointerDownLon = 0;
      let onPointerDownLat = 0;

      const onWheel = () => {
        isScrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isScrolling = false;
        }, 180);
      };
      window.addEventListener("wheel", onWheel, { passive: true });

      const onMouseMove = (e: MouseEvent) => {
        if (isUserInteracting || isScrolling) return;
        const rect = container.getBoundingClientRect();
        let normX = ((e.clientX - rect.left) / rect.width) - 0.5;
        let normY = ((e.clientY - rect.top) / rect.height) - 0.5;

        if (Math.abs(normX) < 0.08) normX = 0;
        if (Math.abs(normY) < 0.08) normY = 0;

        hoverYawOffset = normX * 50;
        hoverPitchOffset = -normY * 25;
      };
      container.addEventListener("mousemove", onMouseMove);

      const onPointerDown = (event: any) => {
        isUserInteracting = true;
        const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
        const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
        onPointerDownMouseX = clientX;
        onPointerDownMouseY = clientY;
        onPointerDownLon = currentLon;
        onPointerDownLat = currentLat;
      };

      const onPointerMove = (event: any) => {
        if (!isUserInteracting) return;
        const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
        const clientY = event.clientY || (event.touches && event.touches[0].clientY) || 0;
        currentLon = (onPointerDownMouseX - clientX) * 0.15 + onPointerDownLon;
        currentLat = (clientY - onPointerDownMouseY) * 0.15 + onPointerDownLat;
        currentLat = Math.max(-85, Math.min(85, currentLat));
      };

      const onPointerUp = () => {
        isUserInteracting = false;
      };

      const domElement = renderer.domElement;
      domElement.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);

      function updateYaw(newYaw: number) {
        targetYaw = newYaw;
      }

      let rafId: number;
      function animate() {
        rafId = requestAnimationFrame(animate);

        if (!isUserInteracting) {
          const targetHoverYaw = isScrolling ? 0 : hoverYawOffset;
          const targetHoverPitch = isScrolling ? 0 : hoverPitchOffset;

          const destLon = targetYaw + targetHoverYaw;
          const destLat = targetPitch + targetHoverPitch;
          currentLon += (destLon - currentLon) * 0.04;
          currentLat += (destLat - currentLat) * 0.04;
        }

        const phi = THREE.MathUtils.degToRad(90 - currentLat);
        const theta = THREE.MathUtils.degToRad(currentLon);
        const targetX = 500 * Math.sin(phi) * Math.cos(theta);
        const targetY = 500 * Math.cos(phi);
        const targetZ = 500 * Math.sin(phi) * Math.sin(theta);
        camera.lookAt(targetX, targetY, targetZ);
        renderer.render(scene, camera);
      }
      animate();

      const onResize = () => {
        const rw = container.clientWidth || window.innerWidth;
        const rh = container.clientHeight || window.innerHeight;
        camera.aspect = rw / rh;
        camera.updateProjectionMatrix();
        renderer.setSize(rw, rh);
      };
      window.addEventListener("resize", onResize);

      return { 
        updateYaw,
        cleanup: () => {
          cancelAnimationFrame(rafId);
          window.removeEventListener("wheel", onWheel);
          container.removeEventListener("mousemove", onMouseMove);
          domElement.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener("resize", onResize);
          if (container.contains(domElement)) {
            container.removeChild(domElement);
          }
          renderer.dispose();
        }
      };
    }

    slides.forEach((slide, i) => {
      const is360 = slide.getAttribute("data-is-360") === "true";
      const panElem = slide.querySelector(".scrolly-panorama") as HTMLElement;

      if (is360 && panElem) {
        const src = panElem.getAttribute("data-src") || "";
        panViewers[i] = createThree360Viewer(panElem, src);
      }
    });

    let totalHeight = 0;
    slides.forEach((slide) => {
      const isCanvasSeq = slide.getAttribute("data-is-canvas") === "true";
      if (isCanvasSeq) {
        const canvas = slide.querySelector(".scrolly-canvas-seq");
        const totalFrames = parseInt(canvas?.getAttribute("data-total-frames") || "30", 10);
        const extra = Math.min(220, Math.max(90, Math.round(totalFrames * 2.2)));
        totalHeight += 110 + extra;
      } else {
        totalHeight += 110;
      }
    });
    if (section) section.style.height = `${totalHeight}vh`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: prefersReducedMotion ? false : 1,
        anticipatePin: 1
      }
    });

    slides.forEach((slide, i) => {
      const media = slide.querySelector(".scrolly-media");
      const caption = slide.querySelector(".scrolly-caption-box");
      const isCanvasSeq = slide.getAttribute("data-is-canvas") === "true";

      // Se for Canvas Sequence (Estilo Voo de Drone FPV)
      if (isCanvasSeq && canvasSequences[i]) {
        const { setTargetFrame, totalFrames } = canvasSequences[i];
        const canvasElem = slide.querySelector(".scrolly-canvas-seq");
        const dummyFrame = { index: 0 };
        const seqDuration = Math.max(2.0, (totalFrames / 30) * 1.8);

        tl.to(dummyFrame, {
          index: totalFrames - 1,
          ease: "none",
          duration: seqDuration,
          onUpdate: () => {
            setTargetFrame(dummyFrame.index);
          }
        }, i === 0 ? 0 : i - 0.2);

        if (canvasElem) {
          tl.fromTo(canvasElem,
            { scale: 1.0 },
            { scale: 1.3499999999999999, ease: "none", duration: seqDuration },
            i === 0 ? 0 : i - 0.2
          );
        }
      }

      if (!prefersReducedMotion) {
        if (i === 0) {
          if (media) {
            tl.to(media, { scale: 1.45, ease: "none" }, 0);
          }
        } else {
          tl.to(slide, {
            autoAlpha: 1,
            duration: 1,
            ease: "power2.out"
          }, i - 0.35);

          if (media) {
            tl.fromTo(media, 
              { scale: Math.max(1.1, 1.45 - 0.10) },
              { scale: 1.0, duration: 1.1, ease: "power1.out" },
              i - 0.35
            );
          }

          if (i < slideCount - 1 && media) {
            tl.to(media, {
              scale: 1.45,
              duration: 1,
              ease: "none"
            }, i + 0.4);
          }
        }
      } else {
        // Movimento reduzido ativado: transições de opacidade simples sem escala
        if (i > 0) {
          tl.to(slide, { autoAlpha: 1, duration: 1 }, i - 0.2);
        }
      }

      if (caption) {
        tl.fromTo(caption,
          { opacity: 0, y: prefersReducedMotion ? 0 : 40, scale: prefersReducedMotion ? 1 : 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: "power2.out" },
          i === 0 ? 0.1 : i - 0.15
        );

        if (i < slideCount - 1) {
          tl.to(caption, {
            opacity: 0,
            y: prefersReducedMotion ? 0 : -30,
            scale: prefersReducedMotion ? 1 : 0.95,
            duration: 0.45,
            ease: "power2.in"
          }, i + 0.55);
        }
      }
    });

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleGlobalResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 200);
    };
    window.addEventListener("resize", handleGlobalResize);

    return () => {
      window.removeEventListener("resize", handleGlobalResize);
      tl.kill();
      Object.values(canvasSequences).forEach(seq => seq.cleanup && seq.cleanup());
      Object.values(panViewers).forEach(viewer => viewer && viewer.cleanup && viewer.cleanup());
    };
  }, []);

  return (
    <section className="scrollytelling-section" id="tour-virtual" ref={sectionRef}>
      <div className="scrollytelling-sticky-viewport" style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        <div className="scrollytelling-slides-wrapper" style={{ width: '100%', height: '100%' }}>
          
          {/* Slide 1: Para testar na prática */}
          <div className="scrolly-slide" data-slide-index="0" data-is-360="false" data-is-canvas="true" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 1 }}>
            <div className="scrolly-media-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
              
              <canvas id="canvas-seq-0" className="scrolly-canvas-seq" data-frames-dir="assets/frames_slide_1" data-total-frames="60" style={{ width: '100%', height: '100%', objectFit: 'cover' }}></canvas>
              
              {/* Badge e overlay removidos a pedido do usuário */}
            </div>
            
            <div className="scrolly-caption-box pos-center-left theme-glass" style={{ position: 'absolute', bottom: '10%', left: '10%', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', padding: '24px', borderRadius: '12px', color: 'white', maxWidth: '400px' }}>
              <div className="scrolly-step-tag" style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', opacity: 0.8 }}>
                <span className="step-num">01</span>
                <span className="step-divider">/</span>
                <span className="step-total">01</span>
                <span className="step-label ml-2">Passo a Passo do Imóvel</span>
              </div>
              <h3 className="scrolly-title" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Para testar na prática</h3>
            </div>
          </div>
        </div>
        
        {/* Indicador de navegação removido a pedido do usuário */}
      </div>
    </section>
  );
}
