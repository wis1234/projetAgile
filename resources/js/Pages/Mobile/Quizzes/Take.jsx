import React from 'react';
import MobileLayout from '@/Layouts/MobileLayout';
import DesktopTake from '../../Quizzes/Take';

/** Passage du quiz : plein écran, sans barre de navigation (concentration + anti-triche). */
export default function MobileTake(props) {
  return (
    <MobileLayout hideHeader hideBottomNav fullBleed refreshable={false}>
      <DesktopTake {...props} />
    </MobileLayout>
  );
}
