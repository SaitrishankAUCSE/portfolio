"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

interface AnimatedGradientBackgroundProps {
    className?: string;
    children?: React.ReactNode;
    intensity?: "subtle" | "medium" | "strong";
}

interface Beam {
    x: number;
    y: number;
    width: number;
    length: number;
    angle: number;
    speed: number;
    opacity: number;
    hue: number;
    pulse: number;
    pulseSpeed: number;
}

function createBeam(width: number, height: number): Beam {
    const angle = -35 + Math.random() * 10;
    return {
        x: Math.random() * width * 1.5 - width * 0.25,
        y: Math.random() * height * 1.5 - height * 0.25,
        width: 40 + Math.random() * 70,
        length: height * 2.5,
        angle: angle,
        speed: 0.4 + Math.random() * 0.8,
        opacity: 0.05 + Math.random() * 0.08,
        hue: 35 + Math.random() * 20, // Champagne gold / amber range (35-55)
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.02,
    };
}

export function BeamsBackground({
    className,
    intensity = "medium",
}: AnimatedGradientBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const beamsRef = useRef<Beam[]>([]);
    const mouseRef = useRef({ x: -1000, y: -1000, active: false });
    const animationFrameRef = useRef<number>(0);
    const MINIMUM_BEAMS = 22;

    const opacityMap = {
        subtle: 0.4,
        medium: 0.7,
        strong: 1,
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const updateCanvasSize = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);

            const totalBeams = MINIMUM_BEAMS * 1.5;
            beamsRef.current = Array.from({ length: totalBeams }, () =>
                createBeam(canvas.width, canvas.height)
            );
        };

        updateCanvasSize();
        window.addEventListener("resize", updateCanvasSize);

        // Track global mouse position for reactive background
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
            mouseRef.current.active = true;
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        document.addEventListener("mouseleave", handleMouseLeave);

        function resetBeam(beam: Beam, index: number, totalBeams: number) {
            if (!canvas) return beam;

            const column = index % 3;
            const spacing = canvas.width / 3;

            beam.y = canvas.height + 100;
            beam.x =
                column * spacing +
                spacing / 2 +
                (Math.random() - 0.5) * spacing * 0.5;
            beam.width = 100 + Math.random() * 120;
            beam.speed = 0.3 + Math.random() * 0.4;
            beam.hue = 35 + (index * 20) / totalBeams; // Amber/Gold gradient
            beam.opacity = 0.08 + Math.random() * 0.08;
            return beam;
        }

        function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
            ctx.save();
            ctx.translate(beam.x, beam.y);
            ctx.rotate((beam.angle * Math.PI) / 180);

            // Calculate distance to mouse cursor for reactive feedback
            let reactiveOpacityMultiplier = 1;
            if (mouseRef.current.active) {
                // Approximate beam path distance
                // Project mouse coordinates to beam coordinate system
                const globalBeamX = beam.x;
                const globalBeamY = beam.y;
                const distToMouse = Math.hypot(mouseRef.current.x - globalBeamX, mouseRef.current.y - globalBeamY);
                
                if (distToMouse < 400) {
                    // Boost brightness/opacity when near mouse
                    reactiveOpacityMultiplier = 1.0 + (1.0 - distToMouse / 400) * 0.8;
                }
            }

            const pulsingOpacity =
                beam.opacity *
                (0.85 + Math.sin(beam.pulse) * 0.15) *
                opacityMap[intensity] *
                reactiveOpacityMultiplier;

            const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);

            // Sophisticated warm gold/champagne gradients
            gradient.addColorStop(0, `hsla(${beam.hue}, 50%, 55%, 0)`);
            gradient.addColorStop(
                0.15,
                `hsla(${beam.hue}, 50%, 55%, ${pulsingOpacity * 0.4})`
            );
            gradient.addColorStop(
                0.45,
                `hsla(${beam.hue}, 52%, 58%, ${pulsingOpacity})`
            );
            gradient.addColorStop(
                0.65,
                `hsla(${beam.hue}, 52%, 58%, ${pulsingOpacity})`
            );
            gradient.addColorStop(
                0.85,
                `hsla(${beam.hue}, 50%, 55%, ${pulsingOpacity * 0.4})`
            );
            gradient.addColorStop(1, `hsla(${beam.hue}, 50%, 55%, 0)`);

            ctx.fillStyle = gradient;
            ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
            ctx.restore();
        }

        function animate() {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.filter = "blur(40px)";

            const totalBeams = beamsRef.current.length;
            beamsRef.current.forEach((beam, index) => {
                beam.y -= beam.speed;
                beam.pulse += beam.pulseSpeed;

                if (beam.y + beam.length < -100) {
                    resetBeam(beam, index, totalBeams);
                }

                drawBeam(ctx, beam);
            });

            // Draw a subtle reactive mouse aura directly on the background
            if (mouseRef.current.active) {
                ctx.save();
                ctx.globalCompositeOperation = "screen";
                const mouseGradient = ctx.createRadialGradient(
                    mouseRef.current.x,
                    mouseRef.current.y,
                    0,
                    mouseRef.current.x,
                    mouseRef.current.y,
                    320
                );
                mouseGradient.addColorStop(0, "rgba(201, 169, 110, 0.04)");
                mouseGradient.addColorStop(0.5, "rgba(201, 169, 110, 0.01)");
                mouseGradient.addColorStop(1, "rgba(201, 169, 110, 0)");
                ctx.fillStyle = mouseGradient;
                ctx.beginPath();
                ctx.arc(mouseRef.current.x, mouseRef.current.y, 320, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        }

        animate();

        return () => {
            window.removeEventListener("resize", updateCanvasSize);
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [intensity]);

    return (
        <div
            className={cn(
                "fixed inset-0 w-full h-full overflow-hidden pointer-events-none",
                className
            )}
            style={{ zIndex: 0, background: '#09090b' }}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0"
                style={{ filter: "blur(18px)" }}
            />

            <motion.div
                className="absolute inset-0"
                animate={{
                    opacity: [0.06, 0.12, 0.06],
                }}
                transition={{
                    duration: 12,
                    ease: "easeInOut",
                    repeat: Infinity,
                }}
                style={{
                    backdropFilter: "blur(60px)",
                    background: 'rgba(9, 9, 11, 0.1)',
                }}
            />
        </div>
    );
}
