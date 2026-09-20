import React from 'react';
import MobileLayout from '@/Layouts/MobileLayout';
import Desktop from '../../Quizzes/Create';

/** Création : le formulaire (déjà adaptatif) dans le shell natif. */
export default function MobileQuizCreate(props) {
  return (
    <MobileLayout title="Nouveau quiz" backHref={route('projects.quizzes.index', props.project.id)} hideBottomNav refreshable={false}>
      <div className="mobile-native-content py-3"><Desktop {...props} /></div>
    </MobileLayout>
  );
}
