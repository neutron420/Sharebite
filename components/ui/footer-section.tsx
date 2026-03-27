"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Moon, Send, Sun } from "lucide-react"
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa"

import { Translate } from "@/components/ui/translate"

function Footerdemo() {
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDarkMode])

  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300 overflow-hidden">
      {/* Premium Background Pattern - Matching Landing Page */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.1),transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)]" />
      </div>

      <div className="w-full px-8 py-16 md:px-16 lg:px-24 xl:px-32 relative z-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-16 xl:gap-20">
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight"><Translate>Stay Connected</Translate></h2>
            <p className="mb-6 text-muted-foreground transition-colors">
              <Translate>Join our newsletter for the latest updates and exclusive mission logs.</Translate>
            </p>
            <form className="relative" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="pr-12 backdrop-blur-sm bg-white/50 border-orange-100 focus:border-orange-500 focus:ring-orange-500 transition-all font-bold"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-orange-600 text-white transition-transform hover:scale-110 active:scale-95 shadow-lg shadow-orange-100"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only"><Translate>Subscribe</Translate></span>
              </Button>
            </form>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold tracking-tight uppercase text-xs italic opacity-40"><Translate>Support Links</Translate></h3>
            <nav className="space-y-3 text-sm font-bold text-slate-500">
              <a href="#" className="block transition-colors hover:text-orange-600 hover:ml-1 transition-all">
                <Translate>The Giver</Translate>
              </a>
              <a href="#" className="block transition-colors hover:text-orange-600 hover:ml-1 transition-all">
                <Translate>The Anchor</Translate>
              </a>
              <a href="#" className="block transition-colors hover:text-orange-600 hover:ml-1 transition-all">
                <Translate>The Fleet</Translate>
              </a>
              <a href="#" className="block transition-colors hover:text-orange-600 hover:ml-1 transition-all">
                <Translate>Mission Impact</Translate>
              </a>
              <a href="#" className="block transition-colors hover:text-orange-600 hover:ml-1 transition-all">
                <Translate>Portal Support</Translate>
              </a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold tracking-tight uppercase text-xs italic opacity-40"><Translate>Command Center</Translate></h3>
            <address className="space-y-3 text-sm not-italic font-bold text-slate-500">
              <p><Translate>ShareBite Global Logistics</Translate></p>
              <p><Translate>77 Tech Avenue, Silicon Valley</Translate></p>
              <p><Translate>Secure: (123) 456-7890</Translate></p>
              <p><Translate>Signal: nexus@sharebite.ai</Translate></p>
            </address>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold tracking-tight uppercase text-xs italic opacity-40"><Translate>Coalition Channels</Translate></h3>
            <div className="mb-6 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-orange-100 bg-white/50 backdrop-blur-md hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                      <FaFacebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p><Translate>ShareBite on Facebook</Translate></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-orange-100 bg-white/50 backdrop-blur-md hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                      <FaTwitter className="h-4 w-4" />
                      <span className="sr-only">Twitter</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p><Translate>Relay on Twitter/X</Translate></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-orange-100 bg-white/50 backdrop-blur-md hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                      <FaInstagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p><Translate>Visual Log on Instagram</Translate></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full border-orange-100 bg-white/50 backdrop-blur-md hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                      <FaLinkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p><Translate>Operational LinkedIn</Translate></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center space-x-3 bg-white/30 backdrop-blur-md border border-orange-100/30 p-2.5 rounded-2xl w-fit">
              <Sun className={`h-4 w-4 ${!isDarkMode ? 'text-orange-500' : 'text-slate-400'}`} />
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={setIsDarkMode}
                className="data-[state=checked]:bg-orange-600"
              />
              <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-500' : 'text-slate-400'}`} />
              <Label htmlFor="dark-mode" className="sr-only">
                Toggle dark mode
              </Label>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-orange-100/10 pt-8 text-center md:flex-row">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
            <Translate>© 2026 SHAREBITE LOGISTICS COALITION. ALL MIGRATIONS SECURE.</Translate>
          </p>
          <nav className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <a href="#" className="transition-colors hover:text-orange-600">
              <Translate>Protocol Privacy</Translate>
            </a>
            <a href="#" className="transition-colors hover:text-orange-600">
              <Translate>Terms of Engagement</Translate>
            </a>
            <a href="#" className="transition-colors hover:text-orange-600">
              <Translate>Cookie Vault</Translate>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
