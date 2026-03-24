import React from 'react';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Phone, MessageCircle } from 'lucide-react';

export function FaqsSection() {
	return (
		<div className="relative w-full space-y-7 pt-4 pb-24 overflow-hidden bg-gradient-to-b from-orange-900/10 to-slate-900/30">
            {/* Background Orange Grid + Glow Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,100,50,0.1),transparent_70%)] opacity-70" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(234,88,12,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(234,88,12,0.07)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            </div>

            <div className="relative z-10 mx-auto max-w-4xl space-y-12 px-6">
                <div className="space-y-4 text-center">
                    <h2 className="text-4xl font-semibold md:text-5xl tracking-tight text-slate-50">Frequently Asked Questions</h2>
                    <p className="text-slate-300 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
                        Here are some common questions and answers you might encounter when jumping into ShareBite. If
                        you don't find the answer you're looking for, feel free to reach out.
                    </p>
                </div>
                <Accordion
                    type="single"
                    collapsible
                    className="bg-white/80 backdrop-blur-md w-full rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-4"
                    defaultValue="item-1"
                >
                    {questions.map((item) => (
                        <AccordionItem
                            value={item.id}
                            key={item.id}
                            className="relative border-slate-100 px-4 last:border-b-0"
                        >
                            <AccordionTrigger className="py-5 text-lg font-semibold text-slate-800 leading-6 hover:no-underline hover:text-orange-600 transition-colors">
                                {item.title}
                            </AccordionTrigger>
                            <AccordionContent className="text-slate-500 pb-5 font-medium leading-relaxed text-base">
                                {item.content}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                <div className="flex flex-col items-center justify-center pt-8 gap-5 border-t border-slate-200/50">
                    <p className="text-slate-300 font-bold uppercase text-[11px] tracking-widest">
                        Can't find what you're looking for? Contact our support agents:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <a href="tel:+1234567890" className="flex items-center gap-3 px-8 py-4 bg-slate-950 text-white rounded-2xl hover:bg-orange-600 transition-all font-semibold shadow-lg hover:-translate-y-1 group">
                            <Phone className="w-5 h-5 group-hover:scale-110 transition-transform" /> <span className="tracking-tight">Phone Support</span>
                        </a>
                        <a href="https://wa.me/1234567890" className="flex items-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-2xl hover:bg-[#1ebe57] transition-all font-semibold shadow-lg hover:-translate-y-1 group">
                            <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" /> <span className="tracking-tight">WhatsApp Link</span>
                        </a>
                    </div>
                </div>
            </div>
		</div>
	);
}

const questions = [
	{
		id: 'item-1',
		title: 'What is ShareBite?',
		content:
			'ShareBite is a sophisticated platform dedicated to zero waste and unlimited hope. It connects donors, NGOs, and food-riders to seamlessly and instantly distribute surplus food to those in need, using military-grade security and sub-second matching.',
	},
	{
		id: 'item-2',
		title: 'Who can benefit from ShareBite?',
		content:
			'ShareBite is built for individuals ("Givers"), NGOs ("Anchors"), and delivery riders ("Fleet") who wish to create a meaningful community legacy while helping eliminate food insecurity in their cities.',
	},
	{
		id: 'item-3',
		title: 'How does the tracking process work?',
		content:
			'ShareBite provides real-time fleet dispatch, allowing NGOs and Donors to secure a live GPS tracking view of the driver. Every step utilizes zero-latency tracking updates.',
	},
	{
		id: 'item-4',
		title: 'Is my donation properly secured?',
		content:
			'Yes! We utilize a strict 4-digit PIN verification algorithm to ensure that food changes hands safely, transparently, and only to verified NGO personnel and authorized riders.',
	},
	{
		id: 'item-5',
		title: 'Does ShareBite reward contributors?',
		content:
			'Absolutely! The platform introduces a fully integrated Gamification Experience containing badges, tiers, and Karma Points, granting members an elite ranking and honoring their continual effort to support the cause.',
	},
	{
		id: 'item-6',
		title: 'How can an NGO join the Coalition?',
		content:
			'Any verified organization can register under the "NGO Partner" role. Upon passing the rigorous internal review by ShareBite admins, they gain full access to the high-fidelity operations dashboard to receive automatic local food listings.',
	},
];
