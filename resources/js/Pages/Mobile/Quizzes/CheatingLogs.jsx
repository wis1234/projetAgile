import React from 'react';
import MobileLayout from '@/Layouts/MobileLayout';
import Desktop from '../../Quizzes/CheatingLogs';

/** Journal des incidents suspects. */
export default function MobileQuizCheatingLogs(props) {
  return (
    <MobileLayout title="Cas de triche" backHref={route('projects.quizzes.show', [props.project.id, props.quiz.id])}>
      <div className="mobile-native-content py-3"><Desktop {...props} /></div>
    </MobileLayout>
  );
}
