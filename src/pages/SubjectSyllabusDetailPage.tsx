import { useEffect, useState } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SubjectBadge } from "../components/subjects/SubjectBadge";
import { Button, Card, SectionContainer, StatCard } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { cn } from "../lib/cn";
import { formatMinutes } from "../utils/date";
import {
  formatLastStudiedLabel,
  getNextSubjectTopicToStudy,
  getNextTopicToStudy,
  getSubjectCompletionPercent,
  getSyllabusStats,
  getTopicProgressLabel,
  getTopicProgressPercent,
  getTopicStatusTone,
  getTopicTimeSpentLabel,
  getUnitCompletionPercent,
  getUnitCoveredTopicCount,
} from "../utils/syllabus";
import { getSubjectVisuals } from "../utils/subjects";

const DEFAULT_VISIBLE_TOPICS = 4;

export const SubjectSyllabusDetailPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { subjects, getSubjectSyllabus, updateSubject } = useFocusFlowData();
  const [examDate, setExamDate] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [showAllTopics, setShowAllTopics] = useState<Record<string, boolean>>({});

  const baseSubject = subjectId ? subjects.find((subject) => subject.id === subjectId) : undefined;

  useEffect(() => {
    setExamDate(baseSubject?.examDate ?? "");
  }, [baseSubject?.examDate]);

  useEffect(() => {
    setExpandedUnits({});
    setShowAllTopics({});
  }, [subjectId]);

  if (!baseSubject) {
    return <Navigate to="/syllabus" replace />;
  }

  const subject = {
    ...baseSubject,
    syllabusUnits: getSubjectSyllabus(baseSubject.id),
  };
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

  return (
    <DashboardContainer>
      <SectionContainer
        title="Subject Detail"
        description="Navigate the syllabus by unit with the next topic and progress cues kept easy to scan."
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
          <div className="space-y-3">
            {subject.syllabusUnits.map((unit) => {
              const isExpanded = expandedUnits[unit.id] === true;
              const shouldShowAllTopics = showAllTopics[unit.id] === true;
              const visibleTopics = shouldShowAllTopics
                ? unit.topics
                : unit.topics.slice(0, DEFAULT_VISIBLE_TOPICS);
              const unitCompletion = getUnitCompletionPercent(unit);
              const coveredTopicCount = getUnitCoveredTopicCount(unit);
              const nextTopic = getNextTopicToStudy(unit.topics);

              return (
                <Card key={unit.id} className="overflow-hidden p-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedUnits((current) => ({
                        ...current,
                        [unit.id]: !current[unit.id],
                      }))
                    }
                    className="w-full px-5 py-4 text-left transition-colors hover:bg-slate-50/65 dark:hover:bg-slate-900/35 sm:px-6"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Unit
                        </p>
                        <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          {unit.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {nextTopic
                            ? `Next topic: ${nextTopic.title}`
                            : unit.topics.length
                              ? "All topics in this unit are already covered."
                              : "No topics in this unit yet."}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                          {unit.topics.length} topics
                        </span>
                        <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                          {coveredTopicCount} covered
                        </span>
                        <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                          {unitCompletion}% complete
                        </span>
                        <span
                          className={cn(
                            "inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform dark:bg-slate-800 dark:text-slate-300",
                            isExpanded && "rotate-180",
                          )}
                        >
                          <ChevronDown size={18} />
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${unitCompletion}%`,
                          ...(visuals.fillStyle ?? {}),
                        }}
                      />
                    </div>
                  </button>

                  {isExpanded ? (
                    <div className="border-t border-slate-200/80 px-5 py-4 dark:border-white/10 sm:px-6">
                      {unit.topics.length === 0 ? (
                        <p className="rounded-[1.2rem] bg-slate-50/88 px-4 py-3 text-sm leading-6 text-slate-500 dark:bg-slate-900/72 dark:text-slate-300">
                          No topics in this unit yet.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            {visibleTopics.map((topic) => {
                              const progressPercent = getTopicProgressPercent(topic);
                              const progressLabel = getTopicProgressLabel(topic);
                              const metadata = [
                                topic.studiedMinutes > 0 ? getTopicTimeSpentLabel(topic) : null,
                                topic.lastStudiedAt ? formatLastStudiedLabel(topic.lastStudiedAt) : null,
                              ].filter(Boolean);

                              return (
                                <div
                                  key={topic.id}
                                  className="rounded-[1.15rem] bg-slate-50/88 px-4 py-3 shadow-soft dark:bg-slate-900/72"
                                >
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                          {topic.title}
                                        </p>
                                        <span
                                          className={cn(
                                            "inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]",
                                            getTopicStatusTone(topic),
                                          )}
                                        >
                                          {progressLabel}
                                        </span>
                                      </div>
                                      {metadata.length ? (
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                          {metadata.join(" / ")}
                                        </p>
                                      ) : null}
                                    </div>

                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                      {progressPercent}%
                                    </p>
                                  </div>

                                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/70">
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${progressPercent}%`,
                                        ...(visuals.fillStyle ?? {}),
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {unit.topics.length > DEFAULT_VISIBLE_TOPICS ? (
                            <div className="mt-3 flex justify-start">
                              <Button
                                variant="secondary"
                                onClick={() =>
                                  setShowAllTopics((current) => ({
                                    ...current,
                                    [unit.id]: !current[unit.id],
                                  }))
                                }
                                className="rounded-full px-4 text-xs"
                              >
                                {shouldShowAllTopics ? "Show Less" : `Show ${unit.topics.length - DEFAULT_VISIBLE_TOPICS} More`}
                              </Button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </SectionContainer>
    </DashboardContainer>
  );
};
