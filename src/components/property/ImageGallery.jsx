import { useState } from "react"

export default function ImageGallery({ images, title }) {
  const [active, setActive] = useState(0)

  return (
    <div className="space-y-3">
      <img
        src={images[active]}
        alt={`${title} photo ${active + 1}`}
        className="h-72 w-full rounded-2xl object-cover md:h-[420px]"
      />
      <div className="flex gap-2 overflow-x-auto">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(index)}
            className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 ${
              active === index ? "ring-brand-700" : "ring-transparent"
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  )
}
