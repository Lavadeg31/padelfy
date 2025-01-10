import Link from 'next/link'

export function TopNav() {
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="font-semibold">
          Padel Tournament Manager
        </Link>
      </div>
    </div>
  )
}

