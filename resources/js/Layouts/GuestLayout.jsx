import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 dark:bg-gray-900 transition-colors pt-6 sm:justify-center sm:pt-0">
            <div className="mb-2">
                <Link href="/">
                    <div className="h-auto w-auto text-4xl md:text-5xl" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center flex space-x-4">
                <Link href={route('about')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">About</Link>
                <Link href={route('contact')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Contact</Link>
                <Link href={route('privacy.policy')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Privacy Policy</Link>
                <Link href={route('terms.of.service')} className="text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">Terms</Link>
            </div>
        </div>
    );
}
