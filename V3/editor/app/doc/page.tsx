import { redirect } from 'next/navigation'

export default function DocPage() {
  // Redirect to home page if accessing /doc without an ID
  redirect('/')
}
