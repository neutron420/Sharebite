'use client'
import Link from 'next/link'
import { Equal, X, Heart, ChevronRight } from 'lucide-react'
import { Button } from '@/components/liquid-glass-button'
import React from 'react'
import { cn } from '@/lib/utils' 
import { Translate } from './ui/translate'
import { LanguageSwitcher } from './ui/language-switcher'

const menuItems = [
    { name: <Translate>Tech Stack</Translate>, href: '#features' },
    { name: <Translate>Impact Log</Translate>, href: '#impact' },
    { name: <Translate>Coalition</Translate>, href: '#roles' },
    { name: <Translate>Portal</Translate>, href: '/login' },
]

export const Header = () => {
    const [menuState, setMenuState] = React.useState(false)

    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed left-0 w-full z-[60] px-3 top-0 sm:top-4">
                <div className="mx-auto mt-2 max-w-7xl rounded-[2.5rem] border border-orange-100 bg-white/80 backdrop-blur-2xl px-6 sm:px-8 py-4 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            aria-label="home"
                            className="flex gap-3 items-center group">
                            <div className="w-10 h-10 bg-orange-600 rounded-2xl shadow-[0_8px_20px_rgba(234,88,12,0.2)] flex items-center justify-center group-hover:rotate-6 transition-all">
                                <Heart className="w-5 h-5 text-white" fill="white" />
                            </div>
                            <span className="text-xl sm:text-2xl font-medium tracking-tighter text-slate-900 uppercase italic underline decoration-orange-600/10">ShareBite</span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-10">
                        <ul className="flex gap-10 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">
                            {menuItems.map((item, index) => (
                                <li key={index}>
                                    <Link
                                        href={item.href as string}
                                        className="hover:text-orange-600 transition-colors block duration-150">
                                        <span>{item.name}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden lg:flex items-center gap-4">
                            <LanguageSwitcher />
                            <Button
                                asChild
                                size="sm"
                                className="px-8 py-3 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-100 transition-all active:scale-95 items-center gap-2">
                                <Link href="/register">
                                    <Translate>JOIN MOVEMENT</Translate> <ChevronRight className="w-4 h-4 ml-1" />
                                </Link>
                            </Button>
                        </div>

                        <div className="flex lg:hidden items-center gap-3">
                            <LanguageSwitcher />
                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 m-0 block cursor-pointer p-2.5 text-slate-900 bg-slate-50 border border-slate-100 rounded-2xl">
                                {menuState ? <X className="size-6 transition-all" /> : <Equal className="size-6 transition-all" />}
                            </button>
                        </div>
                    </div>

                    <div className={cn(
                        "bg-white lg:hidden absolute top-[100%] left-0 right-0 p-8 shadow-2xl rounded-b-[2rem] border-x border-b border-orange-100 transition-all duration-300 ease-in-out z-50",
                        menuState ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-4 pointer-events-none"
                    )}>
                        <div className="w-full">
                            <ul className="flex flex-col items-center gap-6 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 w-full text-center">
                                {menuItems.map((item, index) => (
                                    <li key={index} className="w-full border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                        <Link
                                            href={item.href as string}
                                            onClick={() => setMenuState(false)}
                                            className="hover:text-orange-600 transition-colors block py-1">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                                <li className="w-full pt-2">
                                    <Button
                                        asChild
                                        size="sm"
                                        className="w-full px-8 py-6 bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <Link href="/register">
                                            <Translate>JOIN MOVEMENT</Translate> <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}