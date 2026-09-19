import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import QuizEditor from '@/Components/Quiz/QuizEditor';

function Create({ project }) {
  return <QuizEditor project={project} />;
}

Create.layout = (page) => <AdminLayout>{page}</AdminLayout>;
export default Create;
