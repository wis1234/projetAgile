import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FaArrowLeft,
    FaShieldAlt,
    FaDatabase,
    FaCogs,
    FaLock,
    FaUserShield,
} from 'react-icons/fa';

const sections = [
    {
        id: 'donnees-collectees',
        icon: FaDatabase,
        title: '1. Données collectées',
        intro: 'Nous collectons les informations suivantes lorsque vous utilisez notre service :',
        items: [
            "Nom, prénom et adresse e-mail lors de l'inscription.",
            'Informations de paiement traitées par nos prestataires sécurisés (ex : FedaPay).',
            'Données relatives aux projets, tâches et fichiers que vous stockez sur notre plateforme.',
        ],
    },
    {
        id: 'utilisation-des-donnees',
        icon: FaCogs,
        title: '2. Utilisation des données',
        intro: 'Vos données sont utilisées exclusivement pour :',
        items: [
            'Fournir, maintenir et améliorer nos services de gestion de projet.',
            'Traiter les abonnements et paiements.',
            'Vous envoyer des notifications de système (ex : rappels de tâches, alertes).',
        ],
    },
    {
        id: 'securite',
        icon: FaLock,
        title: '3. Sécurité',
        intro: "Nous mettons en œuvre des mesures de sécurité industrielles pour protéger vos données contre l'accès non autorisé, l'altération ou la destruction. Les mots de passe sont hachés et les échanges de données sont chiffrés.",
        items: [],
    },
    {
        id: 'vos-droits',
        icon: FaUserShield,
        title: '4. Vos droits',
        intro: 'Conformément au RGPD et aux lois locales, vous disposez d\u2019un droit d\u2019accès, de rectification et de suppression de vos données. Vous pouvez exercer ce droit depuis les paramètres de votre compte ou en nous contactant.',
        items: [],
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function PrivacyPolicy() {
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
            <Head title="Politique de confidentialité | ProJA" />

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
                        <FaShieldAlt className="h-3 w-3" />
                        Confidentialité &amp; sécurité
                    </motion.span>
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.05 }}
                        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                    >
                        Politique de confidentialité
                    </motion.h1>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.1 }}
                        className="mx-auto mt-4 max-w-2xl text-blue-100"
                    >
                        Chez ProJA, la protection de vos données est notre priorité. Cette politique décrit
                        comment nous collectons, utilisons et protégeons vos informations.
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
                                        <Icon className="h-4.5 w-4.5" />
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
                                Une question sur cette politique ou sur l'exercice de vos droits ?{' '}
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