import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold text-orange-600 mb-4 italic px-2 py-2">Sharebite</h1>
      <p className="text-xl text-gray-600 mb-8">Reducing food waste, one bite at a time.</p>
      <Link 
        href="/login" 
        className="px-6 py-3 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 transition-colors"
      >
        Get Started
      </Link>
    </div>
  );
}
