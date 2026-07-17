import { Head, Link } from '@inertiajs/react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200 py-12 px-4 sm:px-6 lg:px-8">
            <Head title="Politique de Confidentialité | ProJA" />
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-xl sm:rounded-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-3xl font-extrabold tracking-tight">Politique de Confidentialité</h1>
                    <p className="mt-2 text-blue-100">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
                </div>
                
                <div className="p-8 md:p-12 space-y-6">
                    <Link href="/" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-medium flex items-center mb-6 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Retour à l'accueil
                    </Link>

                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
                        <p className="text-lg font-medium">Chez ProJA, la protection de vos données est notre priorité. Cette politique décrit comment nous collectons, utilisons et protégeons vos informations.</p>
                        
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">1. Données collectées</h2>
                        <p>Nous collectons les informations suivantes lorsque vous utilisez notre service :</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Nom, prénom et adresse e-mail lors de l'inscription.</li>
                            <li>Informations de paiement traitées par nos prestataires sécurisés (ex: FedaPay).</li>
                            <li>Données relatives aux projets, tâches et fichiers que vous stockez sur notre plateforme.</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">2. Utilisation des données</h2>
                        <p>Vos données sont utilisées exclusivement pour :</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Fournir, maintenir et améliorer nos services de gestion de projet.</li>
                            <li>Traiter les abonnements et paiements.</li>
                            <li>Vous envoyer des notifications de système (ex: rappels de tâches, alertes).</li>
                        </ul>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">3. Sécurité</h2>
                        <p>Nous mettons en œuvre des mesures de sécurité industrielles pour protéger vos données contre l'accès non autorisé, l'altération ou la destruction. Les mots de passe sont hachés et les échanges de données sont chiffrés.</p>

                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">4. Vos droits</h2>
                        <p>Conformément au RGPD et aux lois locales, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez exercer ce droit depuis les paramètres de votre compte ou en nous contactant.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
