import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, Search, RefreshCw } from 'lucide-react';

const LiveRankings = () => {
  const [rankings, setRankings] = useState([]);
  const [filteredRankings, setFilteredRankings] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterQuizId, setFilterQuizId] = useState('all');

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = rankings;
    if (filterQuizId !== 'all') filtered = filtered.filter(r => r.quiz_id === filterQuizId);
    if (searchQuery) filtered = filtered.filter(r => r.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredRankings(filtered.slice(0, 100));
  }, [rankings, searchQuery, filterQuizId]);

  const loadData = async () => {
    try {
      const [rRes, qRes] = await Promise.all([
        supabase.from('quiz_results').select('*, users(full_name), quizzes(title)').order('score', { ascending: false }).order('completed_at', { ascending: true }).limit(500),
        supabase.from('quizzes').select('id, title')
      ]);
      if (rRes.data) {
        const unique = [];
        const seen = new Set();
        for (const item of rRes.data) {
          const key = `${item.user_id}-${item.quiz_id}`;
          if (!seen.has(key)) { seen.add(key); unique.push(item); }
        }
        setRankings(unique.sort((a,b)=>b.score-a.score));
      }
      if (qRes.data) setQuizzes(qRes.data);
    } catch (err) {} finally { setLoading(false); }
  };

  const getTrophyColor = (index) => {
    if (index === 0) return 'text-yellow-400';
    if (index === 1) return 'text-gray-400';
    if (index === 2) return 'text-amber-600';
    return 'text-gray-300';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center"><Trophy className="w-6 h-6 mr-2 text-blue-600"/> Live Top 100 Leaderboard</h2>
        <div className="text-sm text-gray-500 animate-pulse flex items-center"><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Live Updates</div>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search user..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterQuizId} onValueChange={setFilterQuizId}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Filter Quiz" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Quizzes</SelectItem>
            {quizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="text-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" /></div> : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr><th className="p-4 w-16 text-center">Rank</th><th className="p-4">User</th><th className="p-4">Quiz</th><th className="p-4 text-center">Score</th><th className="p-4 text-right">Completed</th></tr>
              </thead>
              <tbody className="divide-y">
                {filteredRankings.map((r, i) => (
                  <tr key={r.id} className={`hover:bg-blue-50 transition-colors ${i < 3 ? 'bg-amber-50/30' : ''}`}>
                    <td className="p-4 text-center font-bold text-lg">
                      {i < 3 ? <Trophy className={`w-6 h-6 mx-auto ${getTrophyColor(i)}`} /> : `#${i + 1}`}
                    </td>
                    <td className="p-4 font-bold text-gray-900">{r.users?.full_name || 'Unknown'}</td>
                    <td className="p-4 text-gray-600">{r.quizzes?.title}</td>
                    <td className="p-4 text-center"><span className="text-xl font-bold text-blue-600">{r.score}%</span><div className="text-xs text-gray-500">{r.correct_answers}/{r.total_questions}</div></td>
                    <td className="p-4 text-right text-gray-500 text-xs">{new Date(r.completed_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRankings.length === 0 && <div className="p-8 text-center text-gray-500">No rankings available yet.</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LiveRankings;