"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JobOption = {
  id: string;
  title: string;
  company: string;
  status: string;
};

type FollowupItem = {
  id: string;
  question: string;
  answer: string;
};

type QuestionItem = {
  id: string;
  question: string;
  category?: string;
  level?: string;
  answer?: string;
  followups: FollowupItem[];
  loadingAnswer?: boolean;
  loadingFollowup?: boolean;
};

type ApiResponse = {
  error?: string;
  questions?: Array<{
    question: string;
    category?: string;
    level?: string;
  }>;
  answer?: string;
  followup_question?: string;
  followup_answer?: string;
};

export function InterviewGuideWorkbench({ jobs }: { jobs: JobOption[] }) {
  const [jobId, setJobId] = useState(jobs[0]?.id ?? "");
  const [count, setCount] = useState(20);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === jobId) ?? null,
    [jobs, jobId],
  );

  async function post(body: Record<string, unknown>): Promise<ApiResponse> {
    const res = await fetch("/api/interview-guide/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as ApiResponse;
    if (!res.ok) {
      throw new Error(json.error || "Interview guide request failed.");
    }
    return json;
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      <header className="space-y-2 border-b border-slate-200 pb-5">
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-cyan-700">
          Interview Guide
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
          AI interview prep coach
        </h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Select a job and generate structured interview questions based on the
          job description plus your Bio-Vault. Open any question to get a model
          answer, then go deeper with unlimited follow-up drills.
        </p>
      </header>

      <Card className="border-cyan-200 bg-cyan-50/40">
        <CardHeader>
          <CardTitle className="text-base">Build your question set</CardTitle>
          <CardDescription>
            20-30 core questions: technical depth, system design, product
            thinking, and behavioral focus.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_120px_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="ig-job">Target job</Label>
              <select
                id="ig-job"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company} ({j.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ig-count">Questions</Label>
              <Input
                id="ig-count"
                type="number"
                min={20}
                max={30}
                value={count}
                onChange={(e) => {
                  const n = Number.parseInt(e.target.value, 10);
                  if (Number.isFinite(n)) setCount(Math.max(20, Math.min(30, n)));
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                disabled={!jobId || busy}
                className="w-full gap-2 md:w-auto"
                onClick={async () => {
                  if (!jobId) return;
                  setBusy(true);
                  setErr(null);
                  try {
                    const json = await post({
                      action: "generate_questions",
                      jobId,
                      count,
                    });
                    const next = (json.questions ?? []).map((q, idx) => ({
                      id: `q-${idx + 1}-${crypto.randomUUID()}`,
                      question: q.question,
                      category: q.category,
                      level: q.level,
                      followups: [],
                    }));
                    setQuestions(next);
                  } catch (e) {
                    setErr(
                      e instanceof Error
                        ? e.message
                        : "Couldn’t generate interview questions right now.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate interview guide
                  </>
                )}
              </Button>
            </div>
          </div>

          {selectedJob ? (
            <p className="text-xs text-slate-600">
              Targeting: <span className="font-medium">{selectedJob.title}</span> at{" "}
              {selectedJob.company}
            </p>
          ) : null}
          {err ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {questions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
            Generate a question set to start your mock interview practice.
          </div>
        ) : (
          questions.map((q, idx) => (
            <Card key={q.id} className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-slate-900">
                  Q{idx + 1}. {q.question}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {[q.category, q.level].filter(Boolean).join(" · ") || "Core"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {q.answer ? (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                    {q.answer}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={q.loadingAnswer}
                    onClick={async () => {
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id ? { ...item, loadingAnswer: true } : item,
                        ),
                      );
                      try {
                        const json = await post({
                          action: "answer_question",
                          jobId,
                          question: q.question,
                        });
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id
                              ? {
                                  ...item,
                                  answer:
                                    json.answer ||
                                    "No answer returned. Try again.",
                                  loadingAnswer: false,
                                }
                              : item,
                          ),
                        );
                      } catch {
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id ? { ...item, loadingAnswer: false } : item,
                          ),
                        );
                        setErr("Couldn’t generate answer for this question.");
                      }
                    }}
                  >
                    {q.loadingAnswer ? "Generating answer..." : "Generate answer"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={q.loadingFollowup}
                    onClick={async () => {
                      setQuestions((prev) =>
                        prev.map((item) =>
                          item.id === q.id ? { ...item, loadingFollowup: true } : item,
                        ),
                      );
                      try {
                        const history = q.followups.map((f) => ({
                          question: f.question,
                          answer: f.answer,
                        }));
                        const json = await post({
                          action: "followup",
                          jobId,
                          question: q.question,
                          answer: q.answer ?? "",
                          history,
                        });
                        const fq = json.followup_question ?? "Follow-up question";
                        const fa =
                          json.followup_answer ??
                          "No follow-up answer returned. Try again.";
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id
                              ? {
                                  ...item,
                                  followups: [
                                    ...item.followups,
                                    {
                                      id: crypto.randomUUID(),
                                      question: fq,
                                      answer: fa,
                                    },
                                  ],
                                  loadingFollowup: false,
                                }
                              : item,
                          ),
                        );
                      } catch {
                        setQuestions((prev) =>
                          prev.map((item) =>
                            item.id === q.id ? { ...item, loadingFollowup: false } : item,
                          ),
                        );
                        setErr("Couldn’t generate follow-up for this question.");
                      }
                    }}
                  >
                    <Plus className="mr-1 size-4" />
                    {q.loadingFollowup ? "Deepening..." : "Deepen this topic"}
                  </Button>
                </div>

                {q.followups.length > 0 ? (
                  <div className="space-y-2 rounded-lg border border-cyan-200 bg-cyan-50/50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">
                      Follow-up drills
                    </p>
                    {q.followups.map((fup, i) => (
                      <div
                        key={fup.id}
                        className="rounded-md border border-cyan-100 bg-white px-3 py-2 text-sm"
                      >
                        <p className="font-medium text-slate-900">
                          {i + 1}. {fup.question}
                        </p>
                        <p className="mt-1 text-slate-700">{fup.answer}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

