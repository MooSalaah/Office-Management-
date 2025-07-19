import React, { useRef, useState } from "react"
import { Trash2 } from "lucide-react"

interface SwipeToDeleteProps {
  onDelete: () => void
  children: React.ReactNode
  threshold?: number // المسافة المطلوبة للحذف
  className?: string
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  onDelete,
  children,
  threshold = 120,
  className = "",
}) => {
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const start = useRef<{ x: number; y: number } | null>(null)
  const deleted = useRef(false)

  // Mouse/touch events
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if ("touches" in e) {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    } else {
      start.current = { x: e.clientX, y: e.clientY }
    }
    setIsDragging(true)
    deleted.current = false
  }

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !start.current) return
    let x, y
    if ("touches" in e) {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else {
      x = e.clientX
      y = e.clientY
    }
    setDragX(x - start.current.x)
    setDragY(y - start.current.y)
    if (!deleted.current && Math.abs(x - start.current.x) > threshold) {
      deleted.current = true
      onDelete()
      setDragX(0)
      setDragY(0)
      setIsDragging(false)
    } else if (!deleted.current && Math.abs(y - start.current.y) > threshold) {
      deleted.current = true
      onDelete()
      setDragX(0)
      setDragY(0)
      setIsDragging(false)
    }
  }

  const handleEnd = () => {
    setIsDragging(false)
    setDragX(0)
    setDragY(0)
    start.current = null
  }

  return (
    <div
      className={`relative select-none ${className}`}
      style={{
        touchAction: "pan-y",
        userSelect: "none",
      }}
      onMouseDown={handleStart}
      onMouseMove={isDragging ? handleMove : undefined}
      onMouseUp={handleEnd}
      onMouseLeave={isDragging ? handleEnd : undefined}
      onTouchStart={handleStart}
      onTouchMove={isDragging ? handleMove : undefined}
      onTouchEnd={handleEnd}
    >
      {/* خلفية الحذف */}
      <div
        className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
        style={{
          opacity: isDragging && (Math.abs(dragX) > 30 || Math.abs(dragY) > 30) ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      >
        <Trash2 className="w-10 h-10 text-red-600 opacity-80" />
      </div>
      {/* العنصر نفسه */}
      <div
        className="relative z-10"
        style={{
          transform: `translate(${dragX}px, ${dragY}px)`,
          transition: isDragging ? "none" : "transform 0.2s",
        }}
      >
        {children}
      </div>
    </div>
  )
} 