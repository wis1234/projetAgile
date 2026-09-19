import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuizEditor from '@/Components/Quiz/QuizEditor';

function Edit({ project, quiz, structureLocked = false, validated = false }) {
  return <QuizEditor project={project} quiz={quiz} structureLocked={structureLocked} validated={validated} />;
}

Edit.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Edit;
