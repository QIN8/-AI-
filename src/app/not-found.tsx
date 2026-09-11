import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-center">
      <div>
        <p className="font-mono text-gold">404</p>
        <h1 className="mt-2 text-2xl font-bold">没有这页</h1>
        <Link href="/" className="mt-4 inline-block text-sm text-gold hover:underline">
          回首页
        </Link>
      </div>
    </div>
  );
}
