"use client";
import { useState, useEffect } from "react";
import { Search, X, Filter, Calendar, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  subject_id: string;
  title: string;
  duration: number;
  date: string;
  transcribed: boolean;
  subjects: {
    name: string;
    icon: string;
    color: string;
  };
  matchedInTitle: boolean;
  matchedInTranscription: boolean;
}

interface GlobalSearchProps {
  onClose?: () => void;
}

export default function GlobalSearch({ onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [transcribedOnly, setTranscribedOnly] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, transcribedOnly, dateFilter]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        ...(transcribedOnly && { transcribed: "true" }),
      });

      const response = await fetch(`/api/search?${params}`);
      const data = await response.json();

      let filteredResults = data.recordings || [];

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        const filterDate = new Date();
        
        if (dateFilter === "today") {
          filterDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === "week") {
          filterDate.setDate(now.getDate() - 7);
        } else if (dateFilter === "month") {
          filterDate.setMonth(now.getMonth() - 1);
        }

        filteredResults = filteredResults.filter((rec: SearchResult) => 
          new Date(rec.date) >= filterDate
        );
      }

      setResults(filteredResults);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/transcription/${result.id}/${result.subject_id}`);
    if (onClose) onClose();
  };

  const clearFilters = () => {
    setTranscribedOnly(false);
    setDateFilter("all");
  };

  const hasActiveFilters = transcribedOnly || dateFilter !== "all";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search all recordings and transcriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <button
              onClick={() => {
                setSearchQuery("");
                setResults([]);
                if (onClose) onClose();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                showFilters || hasActiveFilters
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {(transcribedOnly ? 1 : 0) + (dateFilter !== "all" ? 1 : 0)}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-2xl space-y-3">
              {/* Transcribed Filter */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={transcribedOnly}
                  onChange={(e) => setTranscribedOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Transcribed only</span>
                </div>
              </label>

              {/* Date Filter */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Date range</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "all", label: "All time" },
                    { value: "today", label: "Today" },
                    { value: "week", label: "This week" },
                    { value: "month", label: "This month" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setDateFilter(option.value as any)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        dateFilter === option.value
                          ? "bg-purple-600 text-white"
                          : "bg-white text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              Searching...
            </div>
          )}

          {!loading && searchQuery.trim().length === 0 && (
            <div className="text-center py-12 text-gray-400">
              Start typing to search recordings and transcriptions
            </div>
          )}

          {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No results found for "{searchQuery}"
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm text-gray-500 mb-4">
                Found {results.length} result{results.length !== 1 ? "s" : ""}
              </div>
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-4 border border-purple-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${result.subjects.color}20` }}
                    >
                      {result.subjects.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-purple-700 transition-colors">
                        {result.title}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {result.subjects.name}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {new Date(result.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.floor(result.duration / 60)}:
                          {(result.duration % 60).toString().padStart(2, "0")}
                        </span>
                        {result.transcribed && (
                          <span className="bg-purple-100 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                            ✓ Transcribed
                          </span>
                        )}
                        {result.matchedInTranscription && (
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                            📝 In content
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
