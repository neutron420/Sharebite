"use client";
import Link from "next/link";

import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";

function Footer() {
  return (
    <footer className="w-full py-12 bg-gradient-to-t from-orange-500/10 to-slate-500/30 mt-20 relative z-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <Link href="/" className="flex items-center gap-2">
              <Icons.logo className="icon-class w-8 text-orange-600" />
              <h2 className="text-lg font-black italic tracking-tighter text-white">ShareBite</h2>
            </Link>

            <h1 className="mt-4 text-white font-medium max-w-xs">
              Building the operating system for global food rescue and logistics.
            </h1>
            <div className="mt-6">
            <Link href="https://x.com/compose/tweet?text=I%27ve%20been%20using%20%23ShareBite%20to%20reduce%20food%20waste%21">
              <Button variant='secondary' className="bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200">
                Share Your Thoughts On
                <Icons.twitter className="ml-2 w-3.5 fill-current" />
              </Button>
            </Link>
            </div>
            <p className="text-sm text-white mt-8 font-bold">
              © {new Date().getFullYear()} ShareBite. All rights reserved.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-white mb-4">Platform</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Technology
                  </Link>
                </li>
                <li>
                  <Link href="#roles" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Roles
                  </Link>
                </li>
                <li>
                  <Link href="#impact" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Impact
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Socials</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Github
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    LinkedIn
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Twitter / X
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-4">Legal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="#" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm font-medium text-gray-300 hover:text-orange-600 transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="w-full flex mt-20 items-center justify-center relative">
           <div className="absolute inset-0 bg-transparent z-10 pointer-events-none" />
           <h1 className="text-center text-6xl md:text-8xl lg:text-[14rem] font-black lowercase tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-orange-800 to-amber-500 select-none relative z-0 drop-shadow-2xl">
            sharebite
          </h1>
        </div>
      
      </div>
    </footer>
  );
}

export { Footer };
