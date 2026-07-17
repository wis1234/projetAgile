import { Head, Link } from '@inertiajs/react';

export default function About() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="À propos de ProJA" />
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-xl sm:rounded-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">À propos de ProJA</h1>
                    <p className="mt-2 text-blue-100">Votre partenaire pour une gestion de projet agile et efficace.</p>
                </div>
                <div className="p-8 md:p-12 space-y-8">
                    <Link href="/" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium flex items-center mb-6 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Retour à l'accueil
                    </Link>
                    
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notre Mission</h2>
                        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                            Chez ProJA, nous croyons que la gestion de projet ne devrait pas être un fardeau, mais un moteur de réussite. Notre mission est de fournir des outils intuitifs, puissants et collaboratifs qui permettent aux équipes de toutes tailles d'adopter des méthodologies agiles sans effort.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Ce que nous faisons</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg">
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Collaboration en temps réel</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Restez connecté avec votre équipe, partagez des fichiers et prenez des décisions rapidement.</p>
                            </div>
                            <div className="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg">
                                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">Suivi de la performance</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300">Visualisez l'avancement de vos sprints et de vos projets grâce à des tableaux de bord interactifs.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Notre Histoire</h2>
                        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                            Né de la frustration face aux outils de gestion complexes et peu intuitifs, ProJA a été conçu par des développeurs passionnés pour répondre aux besoins réels des équipes modernes. Depuis notre lancement, nous aidons des centaines d'entreprises à transformer leurs idées en succès.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
