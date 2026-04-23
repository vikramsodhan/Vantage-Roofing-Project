import Link from "next/link";

export default function Sidebar() {
  return (
    <nav className="w-48 border-r border-gray-300 p-4">
      <ul className="space-y-2">
        <li>
          <Link href="/" className="text-blue-600">Home</Link>
        </li>
        <li>
          <Link href="/jobs" className="text-blue-600">Jobs</Link>
        </li>
        <li>
          <Link href="/jobs/new" className="text-blue-600">New Job</Link>
        </li>
      </ul>
    </nav>
  );
}
