import LoginForm from './LoginForm'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams
  return <LoginForm errorParam={error} />
}
