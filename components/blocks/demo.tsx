import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"

const testimonials = [
  {
    author: {
      name: "Dr. Alok Verma",
      handle: "@alok_foodsec",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face"
    },
    text: "Using the ShareBite platform has transformed how our NGO handles daily surplus. The speed and real-time tracking are unprecedented.",
    href: "https://twitter.com/alok_foodsec"
  },
  {
    author: {
      name: "Simran Kaur",
      handle: "@simran_cares",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
    },
    text: "The integration with local riders is flawless. We've reduced our response time by 60% since implementing this logistics solution.",
    href: "https://twitter.com/simran_cares"
  },
  {
    author: {
      name: "Rajeev Menon",
      handle: "@rajeev_donor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
    },
    text: "Finally, a platform that actually understands scale! The reporting tools and karma points system are incredibly motivating."
  },
  {
    author: {
      name: "Priya Desai",
      handle: "@priyadesaifg",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
    },
    text: "The sub-second matching engine has allowed us to rescue hundreds of pounds of quality food from our restaurant chain every single week."
  }
]

export function TestimonialsSectionDemo() {
  return (
    <TestimonialsSection
      title="Trusted by pioneers worldwide"
      description="Join thousands of leaders who are already redefining food security and rescue operations with our unified platform."
      testimonials={testimonials}
    />
  )
}
