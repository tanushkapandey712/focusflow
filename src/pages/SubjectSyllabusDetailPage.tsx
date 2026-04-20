import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DashboardContainer } from "../components/dashboard/DashboardContainer";
import { SubjectBadge } from "../components/subjects/SubjectBadge";
import { Button, Card, SectionContainer, StatCard } from "../components/ui";
import { useFocusFlowData } from "../hooks/useFocusFlowData";
import { formatMinutes } from "../utils/date";
import {
  formatLastStudiedLabel,
  getSubjectCompletionPercent,
  getSyllabusStats,
  getTopicProgressLabel,
  getTopicProgressPercent,
  getTopicStatusTone,
  getTopicTimeSpentLabel,
  getUnitCompletionPercent,
} from "../utils/syllabus";
import { cn } from "../lib/cn";
import { getSubjectVisuals } from "../utils/subjects";

export const SubjectSyllabusDetailPage = () => {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { subjects, getSubjectSyllabus, updateSubject } = useFocusFlowData();

  const baseSubject = subjectId ? subjects.find((subject) => subject.id === subjectId) : undefined;
  const [examDate, setExamDate] = useState(baseSubject?.examDate ?? "");

  useEffect(() => {
    setExamDate(baseSubject?.examDate ?? "");
  }, [baseSubject?.examDate]);

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
        description="See the full syllabus structure for one subject with topic-level progress kept in view."
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
                  Units, topics, and tracked study progress for this subject in one place.
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

          <div className="mt-5 flex flex-col gap-3 rounded-[1.4rem] bg-white/75 p-4 shadow-soft dark:bg-slate-900/70 sm:flex-row sm:items-end">
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
            <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">
              Suggestions will prioritize this subject when the exam is near.
            </p>
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
          <div className="space-y-4">
            {subject.syllabusUnits.map((unit) => {
              const unitCompletion = getUnitCompletionPercent(unit);

              return (
                <Card key={unit.id} className="p-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Unit
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                          {unit.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                          {unit.topics.length} topics
                        </span>
                        <span className="surface-pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
                          {unitCompletion}% complete
                        </span>
                      </div>
                    </div>

                    {unit.topics.length === 0 ? (
                      <p className="rounded-[1.35rem] bg-slate-50/88 px-4 py-4 text-sm leading-6 text-slate-500 dark:bg-slate-900/72 dark:text-slate-300">
                        No topics in this unit yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {unit.topics.map((topic) => {
                          const progressPercent = getTopicProgressPercent(topic);
                          const progressLabel = getTopicProgressLabel(topic);

                          return (
                            <div
                              key={topic.id}
                              className="rounded-[1.35rem] bg-slate-50/88 px-4 py-4 shadow-soft dark:bg-slate-900/72"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {topic.title}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {getTopicTimeSpentLabel(topic)}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                    {formatLastStudiedLabel(topic.lastStudiedAt)}
                                  </p>
                                </div>

                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                                    getTopicStatusTone(topic),
                                  )}
                                >
                                  {progressLabel}
                                </span>
                              </div>

                              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/75">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${progressPercent}%`,
                                    ...(visuals.fillStyle ?? {}),
                                  }}
                                />
                              </div>

                              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                {progressPercent}% topic progress
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </SectionContainer>
    </DashboardContainer>
  );
};
