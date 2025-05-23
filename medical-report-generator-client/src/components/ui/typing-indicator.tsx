import { Dot } from "lucide-react"
import { motion } from "framer-motion"

const bounceTransition = {
    repeat: Infinity,
    duration: 0.8, // Slightly faster for a snappier feel
    ease: "easeOut", // Smoother easing for a natural bounce
}

const dotVariants = {
    bounce: {
        y: [0, -8, 0], // Increased bounce height for more emphasis
        scale: [1, 1.2, 1], // Subtle scale for a "pop" effect
        opacity: [0.4, 1, 0.4], // Slightly higher opacity range for visibility
        filter: ["blur(0px)", "blur(2px)", "blur(0px)"], // Subtle glow effect
        transition: bounceTransition,
    },
}

export function TypingIndicator() {
    return (
        <div className="flex justify-left items-center space-x-1">
            <div className="rounded-full bg-muted/80 p-2.5 shadow-sm backdrop-blur-sm">
                <div className="flex space-x-0.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            variants={dotVariants}
                            animate="bounce"
                            custom={i}
                            transition={{ ...bounceTransition, delay: i * 0.15 }} // Tighter stagger for smoother rhythm
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <Dot
                                className="h-4 w-4 text-primary/80" // Smaller dots with theme-aware color
                                style={{
                                    filter: "drop-shadow(0 0 3px rgba(59, 130, 246, 0.5))", // Subtle glow
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}