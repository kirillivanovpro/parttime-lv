import RegisterForm from './RegisterForm'

interface Props {
  searchParams: Promise<{ error?: string }>
}

export default async function RegisterPage({ searchParams }: Props) {
  const { error } = await searchParams
  return <RegisterForm errorParam={error} />
}
