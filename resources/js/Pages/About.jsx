import { Head, Link } from '@inertiajs/react';

export default function About() {
    return (
        <div className="min-h-screen bg-gray-50 text-black/50 dark:bg-black dark:text-white/50 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="About Us" />
            <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 shadow sm:rounded-lg p-6">
                <Link href="/" className="text-blue-500 hover:underline mb-4 inline-block">&larr; Back to Home</Link>
                <h1 className="text-2xl font-bold text-black dark:text-white mb-4">About Us</h1>
                <p>Welcome to Proja. We are dedicated to providing the best agile project management experience for you and your team.</p>
            </div>
        </div>
    );
}
