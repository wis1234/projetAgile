import { supabase } from '@/lib/customSupabaseClient';
import * as XLSX from 'xlsx';

export const downloadInterviewDatabase = async (format, onProgress = () => {}) => {
  try {
    onProgress('Fetching real data from database...', 20);
    
    // Fetch unique records from the database
    const [interviewsRes, enumeratorsRes, responsesRes] = await Promise.all([
      supabase.from('survey_interviews').select('*'),
      supabase.from('survey_enumerators').select('*'),
      supabase.from('survey_responses').select('*')
    ]);

    if (interviewsRes.error) throw new Error(`Interviews Fetch Error: ${interviewsRes.error.message}`);
    if (enumeratorsRes.error) throw new Error(`Enumerators Fetch Error: ${enumeratorsRes.error.message}`);
    if (responsesRes.error && responsesRes.error.code !== '42P01') {
      throw new Error(`Responses Fetch Error: ${responsesRes.error.message}`);
    }

    const interviews = interviewsRes.data || [];
    const enumerators = enumeratorsRes.data || [];
    const responses = responsesRes.data || [];

    onProgress('Formatting real data...', 60);

    let content;
    let mimeType;
    let extension;
    let blob;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const totalRecords = interviews.length;

    if (format === 'json') {
      const exportData = { 
        interviews, 
        enumerators, 
        responses,
        exportedAt: timestamp, 
        totalRecords: totalRecords 
      };
      content = JSON.stringify(exportData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      blob = new Blob([content], { type: mimeType });
    } 
    else if (format === 'csv') {
      const headers = ['id', 'interview_id', 'questionnaire_id', 'enumerator_id', 'enumerator_name', 'status', 'errors_count', 'quality_score', 'created_date', 'last_entry_date', 'synced_at', 'record_count'];
      const csvRows = interviews.map(i => 
        headers.map(h => `"${(i[h] !== null && i[h] !== undefined ? i[h] : '').toString().replace(/"/g, '""')}"`).join(',')
      );
      content = [headers.join(','), ...csvRows].join('\n');
      mimeType = 'text/csv;charset=utf-8;';
      extension = 'csv';
      blob = new Blob([content], { type: mimeType });
    }
    else if (format === 'stata') {
      const wb = XLSX.utils.book_new();
      
      if (interviews.length > 0) {
        const wsInterviews = XLSX.utils.json_to_sheet(interviews);
        XLSX.utils.book_append_sheet(wb, wsInterviews, "Real_Interviews");
      }
      
      if (enumerators.length > 0) {
        const wsEnumerators = XLSX.utils.json_to_sheet(enumerators);
        XLSX.utils.book_append_sheet(wb, wsEnumerators, "Real_Enumerators");
      }

      if (responses.length > 0) {
        const wsResponses = XLSX.utils.json_to_sheet(responses);
        XLSX.utils.book_append_sheet(wb, wsResponses, "Real_Responses");
      }
      
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      extension = 'xlsx'; 
    } else {
      throw new Error("Unsupported format");
    }

    onProgress('Generating file...', 90);

    const fileName = `survey_solutions_complete_${totalRecords}_interviews_${timestamp}.${extension}`;
    const fileSize = blob.size;

    try {
      const { error: insertError } = await supabase.from('survey_downloads').insert({
        download_date: new Date().toISOString(),
        file_name: fileName,
        file_size: fileSize,
        record_count: totalRecords,
        status: 'success'
      });
      
      if (insertError) {
        console.warn("Could not log download to database (Possible RLS issue):", insertError.message);
      }
    } catch (logErr) {
      console.warn("Exception while logging download:", logErr.message);
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);

    onProgress('Complete', 100);
    
    return { success: true, fileName, fileSize, recordCount: totalRecords };
  } catch (error) {
    console.error("Download error:", error);
    try {
      await supabase.from('survey_downloads').insert({
        download_date: new Date().toISOString(),
        file_name: `failed_export.${format}`,
        status: 'error',
        error_message: error.message
      });
    } catch (e) {
      console.error("Failed to log download error:", e.message);
    }
    
    throw new Error(error.message || "An unknown error occurred during download.");
  }
};