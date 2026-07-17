import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import GlobalFooter from '@/Components/GlobalFooter';

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
            <div className="mt-8 mb-6 w-full">
                <GlobalFooter />
            </div>
        </div>
    );
}
