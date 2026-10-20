import React, { useState, useMemo } from 'react';
import type { ExamRecord, ExamCategory } from '../types/exam';
import CountdownCard from './CountdownCard';
import { Search, Filter, Calendar, X, Sparkles } from 'lucide-react';

interface Props {
  initialExams: ExamRecord[];
  initialCategory?: ExamCategory | 'all';
}

export default function ExamDirectory({ initialExams, initialCategory = 'all' }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | 'all'>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const categories: Array<{ id: ExamCategory | 'all'; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'medical', label: 'Medical' },
    { id: 'engineering', label: 'Engineering' },
    { id: 'board-exams', label: 'Board Exams' },
    { id: 'government', label: 'Govt & Civil Services' },
    { id: 'law', label: 'Law' },
    { id: 'management', label: 'Management' },
    { id: 'other-entrance-exams', label: 'Other Entrances' },
  ];

  const filteredExams = useMemo(() => {
    return initialExams.filter((exam) => {
      // Category filter
      if (selectedCategory !== 'all' && exam.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus !== 'all' && exam.dateStatus !== selectedStatus) {
        return false;
      }
      // Search query (matches name, shortName, aliases, conductingAuthority)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = exam.name.toLowerCase().includes(query);
        const matchesShort = exam.shortName.toLowerCase().includes(query);
        const matchesAuthority = exam.conductingAuthority.toLowerCase().includes(query);
        const matchesAlias = exam.aliases.some((a) => a.toLowerCase().includes(query));
        if (!matchesName && !matchesShort && !matchesAuthority && !matchesAlias) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return a.shortName.localeCompare(b.shortName);
      }
      // Sort by exam date
      return new Date(a.dates.examDate).getTime() - new Date(b.dates.examDate).getTime();
    });
  }, [initialExams, searchQuery, selectedCategory, selectedStatus, sortBy]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSortBy('date');
  };

  const hasActiveFilters = searchQuery !== '' || selectedCategory !== 'all' || selectedStatus !== 'all' || sortBy !== 'date';

  return (
    <div className="w-full">
      {/* Search and Filter Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam name (e.g. NEET, JEE, UPSC, CBSE)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Select Filters */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by verification status"
            >
              <option value="all">All Statuses</option>
              <option value="official">Official Confirmed</option>
              <option value="tentative">Tentative (Calendar)</option>
              <option value="not_announced">Date Not Announced</option>
            </select>

            {/* Sort Select */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sort exams by"
            >
              <option value="date">Sort: Upcoming Date</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3 py-2 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Showing <span className="font-bold text-slate-900 dark:text-slate-100">{filteredExams.length}</span> verified examination schedules
        </p>
      </div>

      {/* Grid of Exam Countdowns */}
      {filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => (
            <CountdownCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            No examinations match your filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search terms or clearing your selected category and status filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
