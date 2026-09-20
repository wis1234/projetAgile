import React from 'react';
import MobileLayout from '@/Layouts/MobileLayout';
import Desktop from '../../Quizzes/Results';

/** Résultats détaillés d une copie. */
export default function MobileQuizResults(props) {
  return (
    <MobileLayout title="Résultats" backHref={route('projects.quizzes.show', [props.project.id, props.quiz.id])}>
      <div className="mobile-native-content py-3"><Desktop {...props} /></div>
    </MobileLayout>
  );
}
