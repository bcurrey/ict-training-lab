import type { BookmarkItem, CertificationProgress, ChartAnnotation, QuizResult } from "./types";

const resultKey = "ict-training-lab-results";
const annotationKey = "ict-training-lab-annotations";
const certificationKey = "ict-training-lab-certification-progress";
const bookmarkKey = "ict-training-lab-bookmarks";

function read<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadResults() {
  return read<QuizResult[]>(resultKey, []);
}

export function saveResults(results: QuizResult[]) {
  write(resultKey, results);
}

export function loadAnnotations() {
  return read<ChartAnnotation[]>(annotationKey, []);
}

export function saveAnnotations(annotations: ChartAnnotation[]) {
  write(annotationKey, annotations);
}

export function loadCertificationProgress(): CertificationProgress {
  return read<CertificationProgress>(certificationKey, {
    watchedVideos: {},
    videoStatus: {},
    videoCompletedAt: {},
    videoNotes: {},
    quizScores: {},
    chartDrills: {},
    replayExercises: {},
    examScores: {}
  });
}

export function saveCertificationProgress(progress: CertificationProgress) {
  write(certificationKey, progress);
}

export function loadBookmarks() {
  return read<BookmarkItem[]>(bookmarkKey, []);
}

export function saveBookmarks(bookmarks: BookmarkItem[]) {
  write(bookmarkKey, bookmarks);
}

export function nextReviewDate(correct: boolean, difficulty: number) {
  const days = correct ? Math.max(1, difficulty * 2) : 1;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
