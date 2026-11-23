'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlaceHolderImages } from '@/lib/placeholder-images'
import { ShieldCheck, TrendingUp, Users, UserPlus, CreditCard, Coins, Icon } from "lucide-react"

const about = [
  {
    id: 'First',
    title: 'Security First',
    desc: 'We prioritize the security of your investments with advanced encryption and multi-layered protection.',
    icon: <ShieldCheck className="text-white" />,
  },
  {
    id: 'Second',
    title: 'Consistent Returns',
    desc: 'Our proven strategies and expert team work tirelessly to deliver consistent returns on your investments.',
    icon: <TrendingUp className="text-white" />,
  },
  {    
    id: 'Third',
    title: 'Global Community',
    desc: 'Join a thriving community of investors worldwide who trust us to grow their wealth.',
    icon: <Users className="text-white" />,
  }
]

const steps = [
  {
    number: '01',
    title: 'Create\nAccount',
    description: 'Create and verify your account for free to get started.',
    icon: <UserPlus size={28} />,
  },
  {
    number: '02',
    title: 'Make\nDeposit',
    description: 'After account verification, make deposits from the funding page in your dashboard.',
    icon: <CreditCard size={28} />,
  },
  {
    number: '03',
    title: 'Earn &\nGet Paid',
    description: 'You can make withdrawals as soon as you start making profits.',
    icon: <Coins size={28} />,
  },
]

export default function HowItWorks() {
  const summaryImage = PlaceHolderImages.find((p) => p.id === 'about-summary-image');

  return (
    <>
      <div className="bg-white">
        <div className="container py-5">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
            <div className="">
              <h2 className="mb-4 text-3xl text-black font-bold font-headline md:text-4xl">
                A Trusted Partner for Your Financial Growth
              </h2>
              <p className="mb-6 text-muted-foreground">
                PipsTrust is dedicated to providing a secure and reliable
                platform for individuals seeking to grow their wealth. Our mission
                is to democratize investment opportunities with transparency and
                cutting edge technology.
              </p>
              <ul className="mb-8 space-y-4">
                {about.map((item) => (
                  <li key={item.id} className="flex items-start gap-4">
                    <div className="rounded-full p-3" 
                      style={{ backgroundColor: '#10b981' }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-black">{item.title}</h3>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <Button asChild variant="link" className="p-0 text-emerald-300 font-medium">
                <Link href="/about">Learn more about us &rarr;</Link>
              </Button>
            </div>
            <div className="col-md-5">
              {summaryImage && (
                <Image
                  src={summaryImage.imageUrl}
                  alt={summaryImage.description}
                  width={600}
                  height={400}
                  data-ai-hint={summaryImage.imageHint}
                  className="rounded-lg shadow-lg img-thumbnail p-3"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      
      <section
        className="relative py-16 px-4 sm:px-6 overflow-hidden"
        style={{ backgroundColor: '#10b981' }}
      >
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Heading */}
        <div className="relative text-center mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-snug">
            Three Simple Steps To Start
            <br />
            Earning
          </h2>
        </div>

        {/* Steps */}
        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center w-full max-w-[260px] shrink-0"
            >
              {/* Circle card */}
              <div className="relative w-[230px] h-[230px] sm:w-[250px] sm:h-[250px] bg-white rounded-full flex items-center justify-center p-5 shadow-xl">

                {/* Number badge */}
                <span
                  className="absolute top-3 right-5 w-9 h-9 rounded-full text-white text-sm font-bold flex items-center justify-center z-10"
                  style={{ backgroundColor: '#10b981' }}
                >
                  {step.number}
                </span>

                {/* Inner circle */}
                <div className="w-full h-full rounded-full border-4 border-teal-500 flex flex-col items-center justify-center text-center p-5 gap-2 transition-colors hover:border-emerald-500">

                  {/* Icon */}
                  <div style={{ color: '#10b981' }}>
                    {step.icon}
                  </div>

                  {/* Title */}
                  <p
                    className="text-sm sm:text-base font-extrabold uppercase tracking-wide leading-tight text-[#1a1a2e]"
                    style={{ whiteSpace: 'pre-line' }}
                  >
                    {step.title}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-snug max-w-[165px]">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Direction connector */}
              {index < steps.length - 1 && (
                <div className="absolute top-full mt-3 lg:mt-0 lg:top-1/2 lg:-right-9 lg:-translate-y-1/2 flex flex-col lg:flex-row items-center justify-center h-8 lg:h-auto lg:w-12 z-10">

                  {/* Dashed line */}
                  <div className="h-full lg:h-0 lg:w-full border-l-2 lg:border-l-0 lg:border-t-2 border-dashed border-white/60" />

                  {/* Arrowhead */}
                  <div
                    className="w-0 h-0 -mt-px lg:mt-0 lg:-ml-px"
                    style={{
                      borderLeft: '7px solid transparent',
                      borderRight: '7px solid transparent',
                      borderTop: '9px solid rgba(255,255,255,0.75)',
                    }}
                  >
                    <span className="hidden"> </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}