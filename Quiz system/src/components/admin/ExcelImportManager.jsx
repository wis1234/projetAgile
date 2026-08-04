import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLanguage } from '@/contexts/LanguageContext.jsx';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Download, Upload, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

const ExcelImportManager = ({ type = 'candidates', quizId = null, onSuccess }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const handleDownloadTemplate = () => {
    let wsData = [];
    let fileName = '';

    if (type === 'candidates') {
      wsData = [
        ['Nom Complet', 'Email', 'Mot de Passe', 'Téléphone', 'Entreprise'],
        ['Jean Dupont', 'jean.dupont@example.com', 'password123', '+33123456789', 'Acme Corp']
      ];
      fileName = 'template_candidats.xlsx';
    } else if (type === 'questions') {
      wsData = [
        ['Question', 'Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Réponse Correcte (A,B,C,D)', 'Points'],
        ['Quelle est la capitale de la France ?', 'QCM', 'Lyon', 'Marseille', 'Paris', 'Bordeaux', 'C', '1']
      ];
      fileName = 'template_questions.xlsx';
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, fileName);
  };

  const processCandidates = async (rows) => {
    let successCount = 0;
    let errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const email = row['Email'] || row['email'];
      const fullName = row['Nom Complet'] || row['name'] || row['full_name'];
      const password = row['Mot de Passe'] || row['password'] || 'defaultPass123';
      
      if (!email || !fullName) {
        errors.push(`Ligne ${i + 2}: Email ou Nom manquant.`);
        continue;
      }

      try {
        // Create user via edge function to bypass RLS for auth creation
        const { data, error } = await supabase.functions.invoke('manage-users?action=create', {
          body: { email, password, fullName, role: 'user' }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        // Update created_by
        await supabase.from('users').update({ created_by: user.id }).eq('email', email);
        successCount++;
      } catch (err) {
        errors.push(`Ligne ${i + 2} (${email}): ${err.message}`);
      }
    }

    return { successCount, errors };
  };

  const processQuestions = async (rows) => {
    if (!quizId) {
      throw new Error("Veuillez sélectionner un quiz avant d'importer des questions.");
    }

    let successCount = 0;
    let errors = [];
    const questionsToInsert = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const questionText = row['Question'];
      const optA = row['Option A'];
      const optB = row['Option B'];
      const optC = row['Option C'];
      const optD = row['Option D'];
      const correctLetter = (row['Réponse Correcte (A,B,C,D)'] || '').toString().toUpperCase().trim();

      if (!questionText || !optA || !optB || !correctLetter) {
        errors.push(`Ligne ${i + 2}: Données requises manquantes.`);
        continue;
      }

      let correctIndex = 0;
      if (correctLetter === 'B') correctIndex = 1;
      else if (correctLetter === 'C') correctIndex = 2;
      else if (correctLetter === 'D') correctIndex = 3;
      else if (correctLetter !== 'A') {
        errors.push(`Ligne ${i + 2}: Réponse correcte invalide (doit être A, B, C ou D).`);
        continue;
      }

      questionsToInsert.push({
        quiz_id: quizId,
        question_text: questionText,
        option_a: optA,
        option_b: optB,
        option_c: optC || '',
        option_d: optD || '',
        correct_answer: correctIndex,
        created_by: user.id
      });
    }

    if (questionsToInsert.length > 0) {
      const { error } = await supabase.from('questions').insert(questionsToInsert);
      if (error) {
        errors.push(`Erreur d'insertion globale: ${error.message}`);
      } else {
        successCount = questionsToInsert.length;
      }
    }

    return { successCount, errors };
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setSummary(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          throw new Error("Le fichier est vide.");
        }

        let result;
        if (type === 'candidates') {
          result = await processCandidates(data);
        } else if (type === 'questions') {
          result = await processQuestions(data);
        }

        setSummary(result);
        
        if (result.errors.length === 0) {
          toast({ title: "Import réussi", description: `${result.successCount} éléments importés avec succès.` });
          if (onSuccess) onSuccess();
        } else {
          toast({ variant: "destructive", title: "Import partiel", description: `${result.successCount} succès, ${result.errors.length} erreurs.` });
          if (result.successCount > 0 && onSuccess) onSuccess();
        }

      } catch (error) {
        console.error("Import error:", error);
        toast({ variant: "destructive", title: "Erreur d'import", description: error.message || "Impossible de traiter le fichier." });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null; // Reset input
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
        {loading ? (
          <div className="flex flex-col items-center text-blue-600">
            <RefreshCw className="w-10 h-10 animate-spin mb-3" />
            <p className="text-sm font-medium">Traitement en cours...</p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-4 text-center">
              Téléchargez votre fichier Excel (.xlsx) contenant les {type === 'candidates' ? 'candidats' : 'questions'}.
            </p>
            <div className="relative">
              <Button className="bg-blue-600 hover:bg-blue-700">Sélectionner un fichier</Button>
              <input 
                type="file" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                accept=".xlsx, .xls" 
                onChange={handleFileUpload} 
                disabled={loading || (type === 'questions' && !quizId)} 
              />
            </div>
            {type === 'questions' && !quizId && (
              <p className="text-xs text-red-500 mt-2">Sélectionnez d'abord un quiz ci-dessus.</p>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-500">Besoin du format exact ?</span>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="w-4 h-4 mr-2" /> Télécharger le Modèle
        </Button>
      </div>

      {summary && (
        <div className={`p-4 rounded-lg border ${summary.errors.length > 0 ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-center mb-2">
            {summary.errors.length > 0 ? (
              <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
            )}
            <h4 className="font-semibold text-gray-900">Résumé de l'import</h4>
          </div>
          <p className="text-sm text-gray-700">
            <strong>{summary.successCount}</strong> ligne(s) importée(s) avec succès.
          </p>
          {summary.errors.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-orange-800 mb-1">{summary.errors.length} erreur(s) rencontrée(s) :</p>
              <ul className="text-xs text-orange-700 max-h-32 overflow-y-auto list-disc pl-5 space-y-1">
                {summary.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExcelImportManager;