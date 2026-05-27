import { Link, useParams } from "react-router-dom";

export function ExamLandingPage() {
  const examSlug = useParams().examSlug ?? "sap-c02";

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-8 sm:px-6 lg:py-12">
        <Link to="/" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
          홈으로
        </Link>
        <h1 className="text-3xl font-semibold text-zinc-950">시험 랜딩</h1>
        <p className="text-zinc-600">{examSlug} 랜딩 화면은 다음 작업에서 채웁니다.</p>
      </div>
    </main>
  );
}
