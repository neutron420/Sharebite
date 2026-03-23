import { cn } from "@/lib/utils"
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card"
import Marquee from "@/components/magicui/marquee"

interface TestimonialsSectionProps {
  title: string
  description: string
  testimonials: Array<{
    author: TestimonialAuthor
    text: string
    href?: string
  }>
  className?: string
}

export function TestimonialsSection({ 
  title,
  description,
  testimonials,
  className 
}: TestimonialsSectionProps) {
  // Split testimonials to create two rows (optional but makes it look fuller and more dynamic)
  const firstRow = testimonials.slice(0, Math.ceil(testimonials.length / 2))
  const secondRow = testimonials.slice(Math.ceil(testimonials.length / 2))

  return (
    <section className={cn(
      "relative text-slate-950 overflow-hidden",
      "pt-12 pb-6 sm:pt-24 sm:pb-8 md:pt-32 md:pb-12 px-0",
      className
    )}>
      {/* Background Orange Grid + Glow Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.1),transparent_70%)] opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(234,88,12,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(234,88,12,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8 max-w-7xl mx-auto">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight tracking-tight">
            {title}
          </h2>
          <p className="text-md max-w-[600px] font-medium text-slate-500 sm:text-xl">
            {description}
          </p>
        </div>

        <div className="relative flex h-[350px] w-full flex-col items-center justify-center overflow-hidden py-10">
          <Marquee pauseOnHover className="[--duration:30s]">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="mx-4">
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </Marquee>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/4 bg-gradient-to-r from-white sm:block z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/4 bg-gradient-to-l from-white sm:block z-10" />
        </div>
      </div>
    </section>
  )
}

