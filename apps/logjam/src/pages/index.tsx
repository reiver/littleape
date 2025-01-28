import Logo from 'assets/images/Logo + Type.svg?react'

export function Home() {
  return (
    <div class="w-full h-screen bg-primary flex items-center justify-center">
      <div class="flex flex-col items-center justify-center gap-10">
        <Logo />
        <span class="text-medium-12">Version {import.meta.env.VITE_APP_GREATAPE_VERSION}</span>
      </div>
    </div>
  )
}

export default Home
