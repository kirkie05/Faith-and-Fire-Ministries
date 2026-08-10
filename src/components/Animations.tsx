import React, { useEffect, useState } from 'react';
import { motion, useAnimation, useInView, Variants } from 'motion/react';
import { useRef } from 'react';

// ScrollReveal: Fades up and slides in when entering the viewport
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}> = ({ children, className = '', delay = 0, direction = 'up', duration = 0.8 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });

  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 40 };
      case 'down': return { opacity: 0, y: -40 };
      case 'left': return { opacity: 0, x: -40 };
      case 'right': return { opacity: 0, x: 40 };
      case 'none': return { opacity: 0 };
      default: return { opacity: 0, y: 40 };
    }
  };

  const getAnimate = () => {
    if (direction === 'none') return { opacity: 1 };
    return { opacity: 1, x: 0, y: 0 };
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={getInitial()}
      animate={isInView ? getAnimate() : getInitial()}
      transition={{ duration, delay, ease: [0.25, 1, 0.5, 1] }} // ease-out
    >
      {children}
    </motion.div>
  );
};

// StaggeredList: Wraps a list to stagger its children
export const StaggeredList: React.FC<{
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}> = ({ children, className = '', staggerDelay = 0.15 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-15% 0px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
    >
      {children}
    </motion.div>
  );
};

// StaggeredItem: Must be a direct child of StaggeredList
export const StaggeredItem: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}> = ({ children, className = '', direction = 'up' }) => {
  
  const getInitial = () => {
    switch (direction) {
      case 'up': return { opacity: 0, y: 40 };
      case 'down': return { opacity: 0, y: -40 };
      case 'left': return { opacity: 0, x: -40 };
      case 'right': return { opacity: 0, x: 40 };
      case 'none': return { opacity: 0 };
      default: return { opacity: 0, y: 40 };
    }
  };

  const getAnimate = () => {
    if (direction === 'none') return { opacity: 1 };
    return { opacity: 1, x: 0, y: 0 };
  };

  const itemVariants: Variants = {
    hidden: getInitial(),
    visible: {
      ...getAnimate(),
      transition: { duration: 0.8, ease: "easeOut" }
    },
  };

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
};

// Counter: Animates a number from 0 to target
export const Counter: React.FC<{
  end: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}> = ({ end, duration = 2, className = '', prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });

  useEffect(() => {
    if (isInView) {
      let startTimestamp: number | null = null;
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
        // easeOutQuart easing
        const easeOut = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOut * end));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [isInView, end, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
};
