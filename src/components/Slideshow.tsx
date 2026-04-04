'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const slides = [
  {
    title: 'Servicio profesional de podología médica',
    description: 'Corte correcto de uñas, eliminación de callos, tratamiento de uñas encarnadas y hongos.',
    cta: 'Agenda hoy',
    image: '/images/slide-1.png',
  },
  {
    title: 'Cuidado esencial para pie diabético',
    description: 'Atención especializada para el control de diabetes y prevención de complicaciones en tus pies.',
    cta: 'Tu salud es primero',
    image: '/images/slide-2.png',
  },
  {
    title: '¿Dolor en la uña del pie?',
    description: 'Podría ser una uña encarnada. Tratamiento profesional sin dolor y sin riesgos caseros.',
    cta: 'Agenda tu cita',
    image: '/images/slide-3.png',
  },
  {
    title: 'Eliminación de callos sin dolor',
    description: 'Proceso profesional, seguro y con resultados inmediatos para aliviar el dolor.',
    cta: 'Conoce más',
    image: '/images/slide-4.png',
  },
];

export default function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [parallaxOffset, setParallaxOffset] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Continuous parallax effect
  useEffect(() => {
    const parallaxTimer = setInterval(() => {
      setParallaxOffset(Math.random() * 20 - 10);
    }, 2000);
    return () => clearInterval(parallaxTimer);
  }, []);

  return (
    <div className="relative h-[680px] w-full overflow-hidden bg-slate-950 sm:h-[760px]">
      {slides.map((slide, index) => {
        const isRight = index % 2 === 1;

        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === current ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(13,148,136,0.2),transparent_28%),radial-gradient(circle_at_left,rgba(37,99,235,0.28),transparent_36%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-950/55 to-slate-950/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-950/25" />
            <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8">
              <div
                className={`w-full max-w-6xl px-2 text-white transition-all duration-700 ease-out ${
                  index === current ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{
                  transform: `translateY(${parallaxOffset}px)`,
                }}
              >
                <div className={`grid items-end gap-10 lg:grid-cols-[minmax(0,1.1fr)_320px] ${isRight ? 'lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1' : ''}`}>
                  <div className={`${isRight ? 'text-left lg:text-right' : 'text-left'}`}>
                    <p
                      className={`mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-teal-200 backdrop-blur-md transition-all duration-500 ${
                        index === current ? 'animate-slide-in-left' : ''
                      }`}
                    >
                      PodoMedic
                    </p>
                    <h2
                      className={`max-w-4xl text-4xl font-black leading-[0.98] sm:text-5xl lg:text-7xl drop-shadow-[0_18px_36px_rgba(0,0,0,0.42)] transition-all duration-700 ${
                        index === current ? 'animate-fade-in-up' : 'opacity-0 translate-y-4'
                      } ${isRight ? 'lg:ml-auto' : ''}`}
                    >
                      {slide.title}
                    </h2>
                    <p
                      className={`mt-6 max-w-2xl text-base font-medium leading-relaxed text-white/90 sm:text-xl ${
                        isRight ? 'lg:ml-auto' : ''
                      } transition-all duration-700 ${
                        index === current ? 'animate-fade-in-up animation-delay-200' : 'opacity-0 translate-y-4'
                      }`}
                    >
                      {slide.description}
                    </p>
                    <div className={`mt-8 flex flex-wrap gap-4 ${isRight ? 'lg:justify-end' : ''}`}>
                      <Link
                        href="/booking"
                        className={`inline-flex items-center justify-center rounded-full bg-teal-400 px-7 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-teal-500/25 transition-all duration-300 hover:scale-105 hover:bg-teal-300 sm:text-base ${
                          index === current ? 'animate-slide-in-right animation-delay-400' : 'opacity-0 translate-y-4'
                        }`}
                      >
                        {slide.cta}
                      </Link>
                      <Link
                        href="/contact"
                        className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-white/18 sm:text-base ${
                          index === current ? 'animate-fade-in-up animation-delay-400' : 'opacity-0 translate-y-4'
                        }`}
                      >
                        Conoce más
                      </Link>
                    </div>
                  </div>

                  <div className="hidden rounded-[2rem] border border-white/12 bg-white/10 p-6 backdrop-blur-xl lg:block">
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-200">
                      Atención especializada
                    </p>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-3xl font-black text-white">+10 años</p>
                        <p className="mt-1 text-sm text-white/75">Experiencia clínica en cuidado podológico.</p>
                      </div>
                      <div className="rounded-2xl bg-white/8 p-4">
                        <p className="text-3xl font-black text-white">100%</p>
                        <p className="mt-1 text-sm text-white/75">Atención personalizada en cada valoración.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 gap-3 rounded-full border border-white/10 bg-slate-950/35 px-4 py-2 backdrop-blur-md">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            aria-label={`Ver slide ${index + 1}`}
            className={`h-3 w-3 rounded-full transition-all duration-300 ${
              index === current ? 'scale-125 bg-teal-300 shadow-[0_0_0_6px_rgba(94,234,212,0.14)]' : 'bg-white/45 hover:bg-white hover:scale-110'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
