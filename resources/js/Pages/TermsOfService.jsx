import { Head, Link } from '@inertiajs/react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Conditions d'utilisation | ProJA" />
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-xl sm:rounded-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">Conditions d'utilisation</h1>
                    <p className="mt-2 text-blue-100">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                
                <div className="p-8 md:p-12 space-y-6">
                    <Link href="/" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium flex items-center mb-6 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Retour à l'accueil
                    </Link>

                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        <p className="text-lg font-medium">En utilisant ProJA, vous acceptez d'être lié par les présentes conditions générales d'utilisation.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Utilisation du service</h2>
                        <p>ProJA est un logiciel de gestion de projet. Vous vous engagez à ne pas utiliser la plateforme pour :</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Diffuser du contenu illégal, préjudiciable ou abusif.</li>
                            <li>Tenter de contourner nos systèmes de sécurité ou l'authentification.</li>
                            <li>Surcharger notre infrastructure par une utilisation déraisonnable.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Comptes et Abonnements</h2>
                        <p>Pour accéder à certaines fonctionnalités, vous devez créer un compte et souscrire à un plan. Vous êtes responsable du maintien de la confidentialité de votre compte. Les paiements ne sont généralement pas remboursables, sauf disposition légale contraire.</p>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Propriété Intellectuelle</h2>
                        <p>Vous conservez l'intégralité des droits sur les données, fichiers et projets que vous importez sur ProJA. ProJA conserve tous les droits relatifs au code source, au design et à l'architecture de l'application.</p>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Limitation de Responsabilité</h2>
                        <p>Le service est fourni "en l'état". Bien que nous nous efforcions d'assurer une disponibilité maximale (uptime), nous ne pouvons être tenus responsables des pertes de données indirectes résultant d'une panne du système.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
