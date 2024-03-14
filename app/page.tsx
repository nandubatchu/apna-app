import Link from "next/link";

export default function PageComponent() {
  return (
    <div className="flex w-full h-screen">
      <div className="m-auto">
        <Link href="/social">Apna Social</Link>
      </div>
    </div>
  );
}
