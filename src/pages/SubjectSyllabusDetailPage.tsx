import { useEffect, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SubjectBadge } from "../components/subjects/SubjectBadge";
import { SubjectDetailUnitAccordion } from "../components/syllabus/SubjectDetailUnitAccordion";
import { Button, Card, SectionContainer, StatCard } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { formatMinutes } from "../utils/date";
import {
  getNextSubjectTopicToStudy,
  getSubjectCompletionPercent,
  getSyllabusStats,
  getSyllabusTopicStatus,
  toggleTopicCompletionStatus,
} from "../utils/syllabus";
import { getSubjectVisuals } from "../utils/subjects";
import type { SyllabusTopic, SyllabusTopicStatus } from "../types/models";

type TopicStatusFilter = "all" | SyllabusTopicStatus;
type TopicSortOption = "syllabus" | "recent" | "incomplete";

const STATUS_FILTER_OPTIONS: Array<{ value: TopicStatusFilter; label: string }> = [
  { value: "all", label: "All topics" },
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

const SORT_OPTIONS: Array<{ value: TopicSortOption; label: string }> = [
  { value: "syllabus", label: "Syllabus order" },
  { value: "recent", label: "Recently studied" },
  { value: "incomplete", label: "Incomplete first" },
];

const getIncompleteRank = (topic: SyllabusTopic) => {
  const status = getSyllabusTopicStatus(topic);

  if (status === "in_progress") {
    return 0;
  }

  if (status === "not_started") {
    return 1;
  }

  return 2;
};

const sortTopics = (topics: SyllabusTopic[], sortOption: TopicSortOption) => {
  const entries = topics.map((topic, index) => ({ topic, index }));

  if (sortOption === "syllabus") {
    return topics;
  }

  return [...entries]
    .sort((left, right) => {
      if (sortOption === "recent") {
        const leftTime = left.topic.lastStudiedAt ? new Date(left.topic.lastStudiedAt).getTime() : 0;
        const rightTime = right.topic.lastStudiedAt ? new Date(right.topic.lastStudiedAt).getTime() : 0;

        if (leftTime === rightTime) {
          return left.index - right.index;
        }

        return rightTime - leftTime;
      }

      const rankDifference = getIncompleteRank(left.topic) - getIncompleteRank(right.topic);

      if (rankDifference !== 0) {
        return rankDifference;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.topic);
};

export const SubjectSyllabusDetailPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { subjects, getSubjectSyllabus, updateSubject } = useFocusFlowData();
  const [examDate, setExamDate] = useState("");
  const [expandedUnitId, setExpandedUnitId] = useState<string | null>(null);
  const [showAllTopics, setShowAllTopics] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TopicStatusFilter>("all");
  const [sortOption, setSortOption] = useState<TopicSortOption>("syllabus");

  const baseSubject = subjectId ? subjects.find((subject) => subject.id === subjectId) : undefined;

  useEffect(() => {
    setExamDate(baseSubject?.examDate ?? "");
  }, [baseSubject?.examDate]);

  useEffect(() => {
    setExpandedUnitId(null);
    setShowAllTopics({});
    setSearchQuery("");
    setStatusFilter("all");
    setSortOption("syllabus");
  }, [subjectId]);

  const subject = baseSubject
    ? {
        ...baseSubject,
        syllabusUnits: getSubjectSyllabus(baseSubject.id),
      }
    : null;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || statusFilter !== "all";

  const processedUnits = (subject?.syllabusUnits ?? [])
      .map((unit) => {
        const statusFilteredTopics =
          statusFilter === "all"
            ? unit.topics
            : unit.topics.filter((topic) => getSyllabusTopicStatus(topic) === statusFilter);
        const unitMatchesSearch =
          normalizedQuery.length > 0 && unit.title.toLowerCase().includes(normalizedQuery);
        const searchFilteredTopics =
          normalizedQuery.length === 0 || unitMatchesSearch
            ? statusFilteredTopics
            : statusFilteredTopics.filter((topic) =>
                topic.title.toLowerCase().includes(normalizedQuery),
              );
        const displayTopics = sortTopics(searchFilteredTopics, sortOption);

        return {
          unit,
          displayTopics,
          matchSummary:
            normalizedQuery.length > 0 || statusFilter !== "all"
              ? `${displayTopics.length} matching topic${displayTopics.length === 1 ? "" : "s"}`
              : null,
        };
      })
      .filter((entry) => !isFiltering || entry.displayTopics.length > 0);

  useEffect(() => {
    if (
      expandedUnitId &&
      !processedUnits.some((entry) => entry.unit.id === expandedUnitId)
    ) {
      setExpandedUnitId(null);
    }
  }, [expandedUnitId, processedUnits]);

  if (!subject) {
    return <Navigate to="/syllabus" replace />;
  }

  const stats = getSyllabusStats(subject);
  const visuals = getSubjectVisuals(subject.color);
  const subjectCompletion = getSubjectCompletionPercent(subject);
  const nextTopicMatch = getNextSubjectTopicToStudy(subject);

  const statItems = [
    { label: "Units", value: String(stats.unitCount) },
    { label: "Topics", value: String(stats.topicCount) },
    { label: "Studied", value: formatMinutes(stats.studiedMinutes) },
    { label: "Completion", value: `${subjectCompletion}%` },
  ];

  const visibleTopicCount = processedUnits.reduce(
    (sum, entry) => sum + entry.displayTopics.length,
    0,
  );

  const updateSyllabusUnits = (nextUnits: typeof subject.syllabusUnits) =>
    updateSubject(subject.id, { syllabusUnits: nextUnits });

  const handleRenameTopic = (unitId: string, topicId: string, title: string) => {
    const nextUnits = subject.syllabusUnits.map((unit) =>
      unit.id === unitId
        ? {
            ...unit,
            topics: unit.topics.map((topic) => (topic.id === topicId ? { ...topic, title } : topic)),
          }
        : unit,
    );

    updateSyllabusUnits(nextUnits);
  };

  const handleDeleteTopic = (unitId: string, topicId: string) => {
    const nextUnits = subject.syllabusUnits.map((unit) =>
      unit.id === unitId
        ? {
            ...unit,
            topics: unit.topics.filter((topic) => topic.id !== topicId),
          }
        : unit,
    );

    updateSyllabusUnits(nextUnits);
  };

  const handleToggleTopic = (unitId: string, topicId: string) => {
    const nextUnits = subject.syllabusUnits.map((unit) =>
      unit.id === unitId
        ? {
            ...unit,
            topics: unit.topics.map((topic) =>
              topic.id === topicId ? toggleTopicCompletionStatus(topic) : topic,
            ),
          }
        : unit,
    );

    updateSyllabusUnits(nextUnits);
  };

  return (
    <DashboardContainer>
      <SectionContainer
        title="Subject Detail"
        description="Navigate the syllabus by unit with search, filters, and one clear next step at a time."
      >
        <Card className="p-5 sm:p-6" style={visuals.panelStyle}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <Button variant="secondary" onClick={() => navigate("/syllabus")} className="rounded-full px-4">
                <ArrowLeft size={15} />
                Back to Syllabus Map
              </Button>
              <SubjectBadge subject={{ id: subject.id, name: subject.name, color: subject.color }} />
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {subject.name}
                </h2>
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Move through units one at a time instead of scanning the whole syllabus at once.
                </p>
              </div>
            </div>

            <div className="rounded-[1.4rem] bg-white/78 px-4 py-4 shadow-soft dark:bg-slate-900/72">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Overall Completion
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {subjectCompletion}%
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {stats.coveredTopicCount} of {stats.topicCount} topics started or completed
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
            <div className="rounded-[1.4rem] bg-white/75 p-4 shadow-soft dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Next Topic To Study
              </p>
              {nextTopicMatch ? (
                <div className="mt-2 space-y-1">
                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {nextTopicMatch.topic.title}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {nextTopicMatch.unit.title}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Every topic in this subject is already marked covered.
                </p>
              )}
            </div>

            <div className="rounded-[1.4rem] bg-white/75 p-4 shadow-soft dark:bg-slate-900/70">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Exam Date
                  </span>
                  <input
                    type="date"
                    value={examDate}
                    onChange={(event) => setExamDate(event.target.value)}
                    className="field-surface"
                  />
                </label>
                <Button
                  variant="secondary"
                  onClick={() => updateSubject(subject.id, { examDate: examDate || undefined })}
                >
                  Save Exam Date
                </Button>
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-500 dark:text-slate-400">
                Suggestions will prioritize this subject when the exam is near.
              </p>
            </div>
          </div>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statItems.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} compact />
          ))}
        </section>

        {subject.syllabusUnits.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
              This subject has no units yet. Add units and topics from the Syllabus Map to start tracking detail here.
            </p>
          </Card>
        ) : (
          <>
            <Card className="p-4 sm:p-5">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(180px,220px)_minmax(180px,220px)]">
                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Search Topics
                  </span>
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search unit or topic"
                      className="field-surface pl-10"
                    />
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Status
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as TopicStatusFilter)}
                    className="field-surface"
                  >
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Sort
                  </span>
                  <select
                    value={sortOption}
                    onChange={(event) => setSortOption(event.target.value as TopicSortOption)}
                    className="field-surface"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {visibleTopicCount} topic{visibleTopicCount === 1 ? "" : "s"} across{" "}
                  {processedUnits.length} unit{processedUnits.length === 1 ? "" : "s"}.
                </p>
                {(searchQuery || statusFilter !== "all" || sortOption !== "syllabus") ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setSortOption("syllabus");
                    }}
                    className="rounded-full px-4 text-xs"
                  >
                    Reset View
                  </Button>
                ) : null}
              </div>
            </Card>

            {processedUnits.length === 0 ? (
              <Card className="p-6">
                <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  No topics match the current search or filter. Try widening the view to see more of the syllabus again.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {processedUnits.map(({ unit, displayTopics, matchSummary }) => (
                  <SubjectDetailUnitAccordion
                    key={unit.id}
                    subjectName={subject.name}
                    unit={unit}
                    displayTopics={displayTopics}
                    isExpanded={expandedUnitId === unit.id}
                    showAllTopics={showAllTopics[unit.id] === true}
                    onToggle={() => {
                      setExpandedUnitId((current) => (current === unit.id ? null : unit.id));
                    }}
                    onToggleShowAll={() =>
                      setShowAllTopics((current) => ({
                        ...current,
                        [unit.id]: !current[unit.id],
                      }))
                    }
                    onToggleTopic={(topicId) => handleToggleTopic(unit.id, topicId)}
                    onRenameTopic={(topicId, title) => handleRenameTopic(unit.id, topicId, title)}
                    onDeleteTopic={(topicId) => handleDeleteTopic(unit.id, topicId)}
                    progressFillStyle={visuals.fillStyle}
                    matchSummary={matchSummary}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </SectionContainer>
    </DashboardContainer>
  );
};
