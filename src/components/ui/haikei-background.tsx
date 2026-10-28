"use client";

import React from 'react';
import { motion } from 'framer-motion';

export function HaikeiBackground({ className }: { className?: string }) {
  return (
    <div className={`absolute inset-0 z-0 overflow-hidden ${className || ''}`}>
      <svg
        id="visual"
        viewBox="0 0 900 600"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        version="1.1"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full object-cover"
      >
        <rect x="0" y="0" width="900" height="600" fill="#000000"></rect>
        
        <motion.path
          d="M0,400 C150,500 300,300 450,450 C600,600 750,400 900,500 L900,600 L0,600 Z"
          fill="#111111"
          animate={{
            d: [
              "M0,400 C150,500 300,300 450,450 C600,600 750,400 900,500 L900,600 L0,600 Z",
              "M0,450 C150,350 300,500 450,400 C600,300 750,550 900,450 L900,600 L0,600 Z",
              "M0,400 C150,500 300,300 450,450 C600,600 750,400 900,500 L900,600 L0,600 Z",
            ]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.path
          d="M0,500 C150,400 300,550 450,450 C600,350 750,500 900,400 L900,600 L0,600 Z"
          fill="#1a1a1a"
          animate={{
            d: [
              "M0,500 C150,400 300,550 450,450 C600,350 750,500 900,400 L900,600 L0,600 Z",
              "M0,400 C150,550 300,350 450,500 C600,450 750,350 900,500 L900,600 L0,600 Z",
              "M0,500 C150,400 300,550 450,450 C600,350 750,500 900,400 L900,600 L0,600 Z",
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        
        <motion.path
          d="M0,550 C150,600 300,500 450,550 C600,600 750,500 900,550 L900,600 L0,600 Z"
          fill="rgba(249, 115, 22, 0.05)"
          animate={{
            d: [
              "M0,550 C150,600 300,500 450,550 C600,600 750,500 900,550 L900,600 L0,600 Z",
              "M0,500 C150,550 300,600 450,500 C600,550 750,600 900,500 L900,600 L0,600 Z",
              "M0,550 C150,600 300,500 450,550 C600,600 750,500 900,550 L900,600 L0,600 Z",
            ]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
      </svg>
      {/* Overlay gradient to blend with the scene */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/80" />
    </div>
  );
}
