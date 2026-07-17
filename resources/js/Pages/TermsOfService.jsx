import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FaArrowLeft,
    FaGavel,
    FaBan,
    FaIdCard,
    FaCopyright,
    FaExclamationTriangle,
} from 'react-icons/fa';

const sections = [
    {
        id: 'utilisation-du-service',
        icon: FaBan,
        title: '1. Utilisation du service',
        intro: 'ProJA est un logiciel de gestion de projet. Vous vous engagez à ne pas utiliser la plateforme pour :',
        items: [
            'Diffuser du contenu illégal, préjudiciable ou abusif.',
            "Tenter de contourner nos systèmes de sécurité ou l'authentification.",
            'Surcharger notre infrastructure par une utilisation déraisonnable.',
        ],
    },
    {
        id: 'comptes-et-abonnements',
        icon: FaIdCard,
        title: '2. Comptes et abonnements',
        intro: 'Pour accéder à certaines fonctionnalités, vous devez créer un compte et souscrire à un plan. Vous êtes responsable du maintien de la confidentialité de votre compte. Les paiements ne sont généralement pas remboursables, sauf disposition légale contraire.',
        items: [],
    },
    {
        id: 'propriete-intellectuelle',
        icon: FaCopyright,
        title: '3. Propriété intellectuelle',
        intro: "Vous conservez l'intégralité des droits sur les données, fichiers et projets que vous importez sur ProJA. ProJA conserve tous les droits relatifs au code source, au design et à l'architecture de l'application.",
        items: [],
    },
    {
        id: 'limitation-de-responsabilite',
        icon: FaExclamationTriangle,
        title: '4. Limitation de responsabilité',
        intro: 'Le service est fourni « en l\u2019état ». Bien que nous nous efforcions d\u2019assurer une disponibilité maximale (uptime), nous ne pouvons être tenus responsables des pertes de données indirectes résultant d\u2019une panne du système.',
        items: [],
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function TermsOfService() {
    const [activeId, setActiveId] = useState(sections[0].id);
    const lastUpdated = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) setActiveId(entry.target.id);
                });
            },
            { rootMargin: '-40% 0px -50% 0px' }
        );
        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Head title="Conditions d'utilisation | ProJA" />

            {/* Barre supérieure */}
            <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
                            P
                        </span>
                        ProJA
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                    >
                        <FaArrowLeft className="h-3.5 w-3.5" />
                        Retour à l'accueil
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
                <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
                    <motion.span
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100"
                    >
                        <FaGavel className="h-3 w-3" />
                        Cadre contractuel
                    </motion.span>
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.05 }}
                        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                    >
                        Conditions d'utilisation
                    </motion.h1>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.1 }}
                        className="mx-auto mt-4 max-w-2xl text-blue-100"
                    >
                        En utilisant ProJA, vous acceptez d'être lié par les présentes conditions générales
                        d'utilisation.
                    </motion.p>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.15 }}
                        className="mt-5 text-sm text-blue-200"
                    >
                        Dernière mise à jour : {lastUpdated}
                    </motion.p>
                </div>
            </section>

            {/* Contenu : sommaire + sections */}
            <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                    {/* Sommaire (sticky sur desktop) */}
                    <aside className="lg:col-span-3">
                        <nav className="lg:sticky lg:top-24">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Sommaire
                            </span>
<ul className="mt-4 space-y-1 border-l border-gray-200 dark:border-gray-700">
  {sections.map(({ id, title }) => (
    <li key={id}>
      <a
        href={`#${id}`}
        className={`block border-l-2 py-1.5 pl-4 text-sm transition-colors ${
          activeId === id
            ? 'border-blue-600 font-semibold text-blue-600 dark:border-blue-400 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
        }`}
        style={{ marginLeft: '-1px' }}
      >
        {title}
      </a>
    </li>
  ))}
</ul>

                        </nav>
                    </aside>

                    {/* Sections */}
                    <div className="space-y-8 lg:col-span-9">
                        {sections.map(({ id, icon: Icon, title, intro, items }) => (
                            <section
                                key={id}
                                id={id}
                                className="scroll-mt-24 rounded-xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-800/60"
                            >
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                                </div>
                                <p className="leading-relaxed text-gray-600 dark:text-gray-300">{intro}</p>
                                {items.length > 0 && (
                                    <ul className="mt-4 space-y-2">
                                        {items.map((item) => (
                                            <li
                                                key={item}
                                                className="flex items-start gap-3 text-gray-600 dark:text-gray-300"
                                            >
                                                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}

                        {/* Bloc contact discret en clôture */}
                        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-900/20">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Une question sur ces conditions ?{' '}
                                <Link href="/contact" className="font-semibold underline hover:no-underline">
                                    Contactez-nous
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
                <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400 lg:px-8">
                    © {new Date().getFullYear()} ProJA — Gestion de projet agile.
                </div>
            </footer>
        </div>
    );
}