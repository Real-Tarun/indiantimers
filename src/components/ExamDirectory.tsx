import React, { useState, useMemo } from 'react';
import type { ExamRecord, ExamCategory } from '../types/exam';
import CountdownCard from './CountdownCard';

interface Props {
  initialExams: ExamRecord[];
  initialCategory?: ExamCategory | 'all';
}

export default function ExamDirectory({ initialExams, initialCategory = 'all' }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExamCategory | 'all'>(initialCategory);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');

  const categories: Array<{ id: ExamCategory | 'all'; label: string; iconSrc?: string; emoji?: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'engineering', label: 'Engineering', iconSrc: '/icons/categories/engineering.png', emoji: '⚙️' },
    { id: 'medical', label: 'Medical', iconSrc: '/icons/categories/medical.png', emoji: '💉' },
    { id: 'government', label: 'Govt & Civil Services', iconSrc: '/icons/categories/government.png', emoji: '🏛️' },
    { id: 'board-exams', label: 'Board Exams', iconSrc: '/icons/categories/board-exams.png', emoji: '📚' },
    { id: 'law', label: 'Law', iconSrc: '/icons/categories/law.png', emoji: '⚖️' },
    { id: 'management', label: 'Management', iconSrc: '/icons/categories/management.png', emoji: '💼' },
    { id: 'other-entrance-exams', label: 'Other Entrances', iconSrc: '/icons/categories/other-entrance-exams.png', emoji: '✨' },
  ];

  const filteredExams = useMemo(() => {
    return initialExams
      .filter((exam) => {
        if (selectedCategory !== 'all' && exam.category !== selectedCategory) {
          return false;
        }
        if (selectedStatus !== 'all' && exam.dateStatus !== selectedStatus) {
          return false;
        }
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
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.shortName.localeCompare(b.shortName);
        }
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
      {/* Search and Filter Control Bar (Flux Bento Style) */}
      <div className="bg-white dark:bg-[#171923] border border-black/[0.06] dark:border-white/[0.08] rounded-[24px] p-4 sm:p-6 mb-8 shadow-xs">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:max-w-md">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by exam name (e.g. NEET, JEE, UPSC, CBSE)..."
              className="w-full pl-11 pr-10 py-2.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-[#171923] focus:outline-none focus:ring-2 focus:ring-[#18181B] dark:focus:ring-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Select Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
            {/* Status Select */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none shadow-xs"
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
              className="px-3.5 py-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none shadow-xs"
              aria-label="Sort exams by"
            >
              <option value="date">Sort: Upcoming Date</option>
              <option value="name">Sort: Name (A-Z)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-3.5 py-2 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-colors flex items-center gap-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Pills (Flux style pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 border-t border-black/[0.04] dark:border-white/[0.06] mt-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#111406] shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.iconSrc ? (
                <img src={cat.iconSrc} alt={cat.label} className="w-3.5 h-3.5 object-contain inline-block" />
              ) : cat.emoji ? (
                <span>{cat.emoji}</span>
              ) : null}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Showing <span className="text-slate-900 dark:text-white font-extrabold">{filteredExams.length}</span> verified examination countdowns
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
        <div className="text-center py-16 px-4 bg-white dark:bg-[#171923] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08]">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            🔍
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            No examinations match your filter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            Try adjusting your search terms or clearing your selected category and status filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="btn-primary"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
