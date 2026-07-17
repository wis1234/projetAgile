import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FaArrowLeft,
    FaArrowRight,
    FaEnvelope,
    FaPhoneAlt,
    FaClock,
    FaCommentDots,
} from 'react-icons/fa';

const channels = [
    {
        icon: FaEnvelope,
        title: 'Par e-mail',
        lead: 'Pour toute question détaillée ou demande écrite.',
        value: 'ronaldoagbohou@gmail.com',
        href: 'mailto:ronaldoagbohou@gmail.com',
    },
    {
        icon: FaPhoneAlt,
        title: 'Par téléphone',
        lead: 'Pour un échange direct et rapide.',
        value: '+229 01 67 41 94 14',
        href: 'tel:+2290167419414',
        meta: 'Lun–Ven, 9h–18h',
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Contact() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Head title="Contactez-nous | ProJA" />

            {/* Barre supérieure */}
            <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
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
                <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
                    <motion.span
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100"
                    >
                        <FaCommentDots className="h-3 w-3" />
                        Nous sommes à l'écoute
                    </motion.span>
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.05 }}
                        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                    >
                        Contactez-nous
                    </motion.h1>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.1 }}
                        className="mx-auto mt-5 max-w-2xl text-lg text-blue-100"
                    >
                        Une question sur nos plans d'abonnement, besoin d'aide sur un projet, ou simplement envie
                        de nous dire bonjour ? N'hésitez pas.
                    </motion.p>
                </div>
            </section>

            <main>
                {/* Moyens de contact */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
                >
                    <div className="max-w-2xl">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Nous joindre
                        </span>
                        <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                            Choisissez le canal qui vous convient
                        </h2>
                    </div>

                    <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
{channels.map(({ icon: Icon, title, lead, value, href, meta }) => (
  <a
    key={title}
    href={href}
    className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-center transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
  >
    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
    <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">{lead}</p>
    <span className="mt-4 text-base font-semibold text-blue-600 group-hover:underline dark:text-blue-400">
      {value}
    </span>
    {meta && (
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
        <FaClock className="h-3 w-3" /> {meta}
      </span>
    )}
  </a>
))}

                    </div>
                </motion.section>

                {/* Bande d'information pratique */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeUp}
                    className="border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/40"
                >
                    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            Nous faisons de notre mieux pour répondre à chaque message aussi rapidement que
                            possible, par e-mail comme par téléphone.
                        </p>
                    </div>
                </motion.section>

                {/* Appel à l'action */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeUp}
                    className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
                >
                    <div className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-700 px-8 py-14 text-center sm:px-14">
                        <h2 className="text-3xl font-bold text-white">Envie d'en savoir plus sur ProJA ?</h2>
                        <p className="mx-auto mt-3 max-w-xl text-blue-100">
                            Découvrez comment ProJA vous aide à organiser vos projets, sprints et tâches au même
                            endroit.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href="/about"
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                            >
                                À propos de ProJA
                                <FaArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                            >
                                Retour à l'accueil
                            </Link>
                        </div>
                    </div>
                </motion.section>
            </main>

            <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
                <div className="mx-auto max-w-6xl px-4 text-center text-sm text-gray-500 sm:px-6 dark:text-gray-400 lg:px-8">
                    © {new Date().getFullYear()} ProJA — Gestion de projet agile.
                </div>
            </footer>
        </div>
    );
}