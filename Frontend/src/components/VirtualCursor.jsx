import React, { useEffect, useState } from 'react';

// Custom hook to listen for cursor events
export const useVirtualCursor = () => {
    useEffect(() => {
        // Event listener setup is handled within the component itself
    }, []);
};

export default function VirtualCursor() {
    const [position, setPosition] = useState({ x: -100, y: -100 });
    const [isClicking, setIsClicking] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [textToType, setTextToType] = useState("");
    
    useEffect(() => {
        const handleMove = (e) => {
            const { x, y } = e.detail;
            setPosition({ x, y });
            setIsVisible(true);
        };

        const handleClick = () => {
            setIsClicking(true);
            setTimeout(() => setIsClicking(false), 300); // ripple duration
        };

        const handleType = (e) => {
            const { text } = e.detail;
            setTextToType(text);
            setTimeout(() => setTextToType(""), text.length * 100 + 500);
        };
        
        const handleHide = () => {
            setIsVisible(false);
        }

        window.addEventListener('agent-cursor-move', handleMove);
        window.addEventListener('agent-cursor-click', handleClick);
        window.addEventListener('agent-cursor-type', handleType);
        window.addEventListener('agent-cursor-hide', handleHide);

        return () => {
            window.removeEventListener('agent-cursor-move', handleMove);
            window.removeEventListener('agent-cursor-click', handleClick);
            window.removeEventListener('agent-cursor-type', handleType);
            window.removeEventListener('agent-cursor-hide', handleHide);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div 
            className="pointer-events-none fixed top-0 left-0 z-[99999]"
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)' 
            }}
        >
            {/* The Cursor Graphic (Tailwind/SVG) */}
            <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="black"
                strokeWidth="1.5"
                className={`drop-shadow-lg transition-transform ${isClicking ? 'scale-75' : 'scale-100'}`}
                style={{ transformOrigin: 'top left' }}
            >
                <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.42c.45 0 .67-.54.35-.85L5.5 3.21z" fill="white" />
            </svg>
            
            {/* Click Ripple Effect */}
            {isClicking && (
                <div 
                    className="absolute top-[-10px] left-[-10px] w-8 h-8 rounded-full border-2 border-stone-900 bg-stone-900/20 animate-ping"
                    style={{ animationDuration: '0.5s' }}
                />
            )}

            {/* Typing Indicator / Floating text bubble */}
            {textToType && (
                <div className="absolute top-6 left-4 bg-stone-900 text-white text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap animate-fade-in">
                    Typing: "{textToType}"
                </div>
            )}
            
            {/* Agent Label */}
            <div className="absolute top-6 left-4 bg-stone-100 border border-stone-300 text-stone-800 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded shadow-sm opacity-80 whitespace-nowrap">
                Agent
            </div>
        </div>
    );
}
