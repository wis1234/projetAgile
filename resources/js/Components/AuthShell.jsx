import { Link } from '@inertiajs/react';
import GlobalFooter from '@/Components/GlobalFooter';

/**
 * Habillage commun des écrans d'authentification « secondaires » (confirmation d'inscription,
 * vérification d'e-mail…) : même en-tête PROJA que la page d'inscription.
 */
export default function AuthShell({ children, headerAction }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#F8FAFC] font-sans antialiased dark:bg-gray-950">
            <header className="border-b border-gray-200/70 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                            P
                        </span>
                        <span className="text-lg font-extrabold uppercase tracking-wide text-gray-900 dark:text-white">
                            PROJA
                        </span>
                    </Link>
                    {headerAction}
                </div>
            </header>

            <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-lg">{children}</div>
            </main>

            <GlobalFooter />
        </div>
    );
}
