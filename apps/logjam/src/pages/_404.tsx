import Logo from 'assets/images/logo.svg?react'

export function NotFound() {
  return (
    <div class="w-full h-screen bg-[#F9F9F9] flex items-center justify-center">
      <div class="md:rounded-xl md:border-2 border-gray-0 flex flex-col items-center md:justify-center gap-12 bg-white p-4 md:p-16 h-screen md:h-auto justify-between md:max-w-[580px] text-left">
        <Logo width="151.67px" height="40px" />
        <div className="flex flex-col gap-4 flex-grow md:flex-grow-0 md:justify-start justify-center">
          <span class="text-black text-semi-bold-32 text-left block w-full">Oops! A 404 Error!</span>
          <span class="text-gray-3 text-regular-16 text-left block w-full">The page you are trying to reach is not found. Please edit the URL and try again.</span>
        </div>
      </div>
    </div>
  )
}
export default NotFound
