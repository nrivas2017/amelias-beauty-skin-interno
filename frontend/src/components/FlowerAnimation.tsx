import React, { useEffect } from "react";
import confetti from "canvas-confetti";

const lanzarLluviaDeFlores = () => {
  const girasol = confetti.shapeFromText({ text: "🌻", scalar: 3 });
  const tulipan = confetti.shapeFromText({ text: "🌷", scalar: 2 });
  const sakura = confetti.shapeFromText({ text: "🌸", scalar: 2 });

  const defaults = {
    spread: 360,
    ticks: 250,
    gravity: 0.5,
    decay: 0.95,
    startVelocity: 30,
    shapes: [girasol, tulipan, sakura],
    zIndex: 10000,
  };

  confetti({ ...defaults, particleCount: 50, scalar: 2 });
  confetti({ ...defaults, particleCount: 20, scalar: 3.5 });
};

interface FlowerAnimationProps {
  onAnimationEnd: () => void;
}

const FlowerAnimation: React.FC<FlowerAnimationProps> = ({
  onAnimationEnd,
}) => {
  useEffect(() => {
    lanzarLluviaDeFlores();

    const totalEndTimer = setTimeout(() => {
      onAnimationEnd();
    }, 4500);

    return () => {
      clearTimeout(totalEndTimer);
    };
  }, [onAnimationEnd]);

  return null;
};

export default FlowerAnimation;
