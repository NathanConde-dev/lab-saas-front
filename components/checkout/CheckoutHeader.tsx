import Image from 'next/image'

interface CheckoutHeaderProps {
  logoSrc?: string
  logoAlt?: string
}

export function CheckoutHeader({ 
  logoSrc = '/logo.png', 
  logoAlt = 'Logo' 
}: CheckoutHeaderProps) {
  return (
    <header className="w-full flex justify-between items-center mb-8">
      <div className="relative h-12 w-auto">
        <Image
          src={logoSrc}
          alt={logoAlt}
          width={150}
          height={48}
          className="h-auto w-auto object-contain"
          priority
        />
      </div>
      <div className="text-xs uppercase text-gray-600 font-medium tracking-wide">
        AMBIENTE 100% SEGURO
      </div>
    </header>
  )
}

