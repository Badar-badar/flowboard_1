// NotFound.jsx
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-2 inline-block text-rose-400 hover:underline">
        Back to Home
      </Link>
    </div>
  )
}
