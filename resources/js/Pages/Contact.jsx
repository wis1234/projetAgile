import { Head, Link } from '@inertiajs/react';

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-50 text-black/50 dark:bg-black dark:text-white/50 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Contact Us" />
            <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 shadow sm:rounded-lg p-6">
                <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Home</Link>
                <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Contact Us</h1>
                <p>If you have any questions, feel free to reach out to us at support@proja.com.</p>
            </div>
        </div>
    );
}
