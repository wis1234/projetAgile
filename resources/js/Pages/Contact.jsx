import { Head, Link } from '@inertiajs/react';

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Contactez-nous | ProJA" />
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-xl sm:rounded-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">Contactez-nous</h1>
                    <p className="mt-2 text-blue-100">Nous sommes là pour vous aider.</p>
                </div>
                
                <div className="p-8 md:p-10 space-y-6">
                    <Link href="/" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium flex items-center mb-4 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Retour à l'accueil
                    </Link>

                    <p className="text-lg text-gray-600 dark:text-gray-300 text-center mb-8">
                        Vous avez des questions concernant nos plans d'abonnement, besoin d'aide avec un projet ou souhaitez simplement nous dire bonjour ? N'hésitez pas !
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                            <svg className="w-10 h-10 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Par e-mail</h3>
                            <a href="mailto:support@proja.com" className="mt-2 text-blue-600 dark:text-blue-400 hover:underline">support@proja.com</a>
                        </div>
                        
                        <div className="flex flex-col items-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                            <svg className="w-10 h-10 text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Par téléphone</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-300">Lun-Ven, 9h-18h</p>
                            <a href="tel:+33100000000" className="mt-1 text-blue-600 dark:text-blue-400 hover:underline">+33 1 00 00 00 00</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
