import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    FaArrowLeft,
    FaArrowRight,
    FaProjectDiagram,
    FaFlagCheckered,
    FaTasks,
    FaChartLine,
    FaDollarSign,
    FaBell,
    FaRocket,
    FaCheckCircle,
} from 'react-icons/fa';

const features = [
    {
        icon: FaProjectDiagram,
        title: 'Projets',
        text: "Organisez vos projets et invitez les bons membres, avec des rôles clairs (manager ou administrateur).",
    },
    {
        icon: FaFlagCheckered,
        title: 'Sprints',
        text: "Planifiez des sprints avec dates de début et de fin, et verrouillez les tâches non terminées à leur clôture.",
    },
    {
        icon: FaTasks,
        title: 'Tâches & Kanban',
        text: "Organisez le travail par statut, priorité et échéance, avec une vue Kanban pour visualiser l'avancement.",
    },
    {
        icon: FaChartLine,
        title: 'Suivi de performance',
        text: "Mesurez le taux de complétion et le respect des délais, membre par membre et projet par projet.",
    },
    {
        icon: FaDollarSign,
        title: 'Paiements',
        text: "Suivez la rémunération des tâches, validez les paiements et générez un reçu en un clic.",
    },
    {
        icon: FaBell,
        title: 'Notifications',
        text: "Chaque assignation ou changement de statut prévient automatiquement les bonnes personnes.",
    },
];

const steps = [
    {
        number: '01',
        title: 'Créer un projet',
        text: "Nommez votre projet et invitez les membres qui vont y contribuer.",
    },
    {
        number: '02',
        title: 'Planifier un sprint',
        text: "Définissez une période de travail avec une date de début et une date de fin.",
    },
    {
        number: '03',
        title: 'Assigner les tâches',
        text: "Répartissez le travail par priorité, échéance et responsable.",
    },
    {
        number: '04',
        title: 'Suivre la progression',
        text: "Visualisez l'avancement en Kanban et recevez une alerte en cas de retard.",
    },
];

const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function About() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Head title="À propos de ProJA" />

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
                        <FaRocket className="h-3 w-3" />
                        Gestion de projet agile
                    </motion.span>
                    <motion.h1
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.05 }}
                        className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl"
                    >
                        À propos de ProJA
                    </motion.h1>
                    <motion.p
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.1 }}
                        className="mx-auto mt-5 max-w-2xl text-lg text-blue-100"
                    >
                        Votre partenaire pour une gestion de projet agile et efficace — des projets aux sprints,
                        des tâches à la paie de vos collaborateurs.
                    </motion.p>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.15 }}
                        className="mt-9 flex flex-wrap items-center justify-center gap-3"
                    >
                        {['Projets', 'Sprints', 'Tâches', 'Paiements'].map((label) => (
                            <span
                                key={label}
                                className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white"
                            >
                                {label}
                            </span>
                        ))}
                    </motion.div>
                    <motion.a
                        href="#fonctionnalites"
                        initial="hidden"
                        animate="visible"
                        variants={fadeUp}
                        transition={{ delay: 0.2 }}
                        className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
                    >
                        Découvrir les fonctionnalités
                        <FaArrowRight className="h-3.5 w-3.5" />
                    </motion.a>
                </div>
            </section>

            <main>
                {/* Mission */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
                >
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Notre mission
                            </span>
                            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                                Un outil qui s'efface pour laisser la place au travail
                            </h2>
                        </div>
                        <div className="lg:col-span-8">
                            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                Chez ProJA, nous croyons que la gestion de projet ne devrait pas être un fardeau,
                                mais un moteur de réussite. Notre mission est de fournir des outils intuitifs,
                                puissants et collaboratifs qui permettent aux équipes de toutes tailles d'adopter
                                des méthodologies agiles sans effort.
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                Chaque fonctionnalité — des sprints au suivi des paiements — est pensée pour
                                réduire les allers-retours et donner à chacun une vision claire de ce qu'il reste
                                à faire.
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Fonctionnalités */}
                <motion.section
                    id="fonctionnalites"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={fadeUp}
                    className="border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/40"
                >
                    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                        <div className="max-w-2xl">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Ce que nous faisons
                            </span>
                            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                                Tout ce qu'il faut pour piloter un projet, au même endroit
                            </h2>
                        </div>
                        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {features.map(({ icon: Icon, title, text }) => (
                                <div
                                    key={title}
                                    className="group rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all duration-200 hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
                                >
                                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:bg-blue-500/10 dark:text-blue-400">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <h3 className="mb-1.5 font-semibold text-gray-900 dark:text-white">{title}</h3>
                                    <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                        {text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* Comment ça marche */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={fadeUp}
                    className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
                >
                    <div className="max-w-2xl">
                        <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                            Comment ça marche
                        </span>
                        <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
                            De l'idée au suivi, en quatre étapes
                        </h2>
                    </div>
                    <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {steps.map(({ number, title, text }, i) => (
                            <div key={number} className="relative">
                                <span className="select-none text-5xl font-extrabold text-blue-600/15 dark:text-blue-400/20">
                                    {number}
                                </span>
                                <h3 className="-mt-6 font-semibold text-gray-900 dark:text-white">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                                    {text}
                                </p>
                                {i < steps.length - 1 && (
                                    <FaArrowRight className="absolute -right-5 top-3 hidden h-4 w-4 text-gray-300 dark:text-gray-700 lg:block" />
                                )}
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* Notre histoire */}
                <motion.section
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.2 }}
                    variants={fadeUp}
                    className="border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800/40"
                >
                    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:px-8">
                        <div className="lg:col-span-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                Notre histoire
                            </span>
                            <h2 className="mt-3 text-3xl font-bold leading-tight text-gray-900 dark:text-white">
                                Conçu par des équipes, pour des équipes
                            </h2>
                        </div>
                        <div className="lg:col-span-8">
                            <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                Né de la frustration face aux outils de gestion complexes et peu intuitifs, ProJA
                                a été conçu par des développeurs passionnés pour répondre aux besoins réels des
                                équipes modernes.
                            </p>
                            <p className="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                                Depuis notre lancement, nous accompagnons des équipes dans la structuration de
                                leurs projets, sprint après sprint, tâche après tâche.
                            </p>
                            <ul className="mt-6 space-y-3">
                                {[
                                    "Suivi en temps réel de l'avancement des sprints",
                                    'Notifications automatiques à chaque étape clé',
                                    'Gestion transparente des paiements liés aux tâches',
                                ].map((item) => (
                                    <li key={item} className="flex items-start gap-3 text-gray-700 dark:text-gray-200">
                                        <FaCheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
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
                        <h2 className="text-3xl font-bold text-white">Prêt à organiser votre prochain projet ?</h2>
                        <p className="mx-auto mt-3 max-w-xl text-blue-100">
                            Créez votre premier projet, planifiez un sprint et assignez vos premières tâches en
                            quelques minutes.
                        </p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-blue-700 transition-colors hover:bg-blue-50"
                            >
                                Retour à l'accueil
                                <FaArrowRight className="h-4 w-4" />
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