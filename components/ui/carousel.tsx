"use client"

import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination, Autoplay, EffectFade, EffectCube, EffectCoverflow } from 'swiper/modules'
import { cn } from '@/lib/utils'

// استيراد CSS الخاص بـ Swiper
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import 'swiper/css/effect-fade'
import 'swiper/css/effect-cube'
import 'swiper/css/effect-coverflow'

// أنواع البيانات
export interface CarouselProps {
  children: React.ReactNode
  className?: string
  slidesPerView?: number
  spaceBetween?: number
  navigation?: boolean
  pagination?: boolean
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  effect?: 'slide' | 'fade' | 'cube' | 'coverflow'
  direction?: 'horizontal' | 'vertical'
  breakpoints?: {
    [key: number]: {
      slidesPerView: number
      spaceBetween: number
    }
  }
  onSlideChange?: (swiper: any) => void
  onSwiper?: (swiper: any) => void
}

// مكون Carousel محسن
export const Carousel: React.FC<CarouselProps> = ({
  children,
  className,
  slidesPerView = 1,
  spaceBetween = 30,
  navigation = true,
  pagination = true,
  autoplay = false,
  autoplayDelay = 3000,
  loop = false,
  effect = 'slide',
  direction = 'horizontal',
  breakpoints,
  onSlideChange,
  onSwiper,
}) => {
  // تحديد الوحدات المطلوبة بناءً على الإعدادات
  const modules = [Navigation, Pagination]
  
  if (autoplay) {
    modules.push(Autoplay)
  }
  
  if (effect === 'fade') {
    modules.push(EffectFade)
  } else if (effect === 'cube') {
    modules.push(EffectCube)
  } else if (effect === 'coverflow') {
    modules.push(EffectCoverflow)
  }

  // إعدادات Autoplay
  const autoplayConfig = autoplay ? {
    delay: autoplayDelay,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  } : false

  // إعدادات Pagination
  const paginationConfig = pagination ? {
    clickable: true,
    dynamicBullets: true,
  } : false

  // إعدادات Navigation
  const navigationConfig = navigation ? {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  } : false

  return (
    <div className={cn('relative', className)}>
      <Swiper
        modules={modules}
        slidesPerView={slidesPerView}
        spaceBetween={spaceBetween}
        navigation={navigationConfig}
        pagination={paginationConfig}
        autoplay={autoplayConfig}
        loop={loop}
        effect={effect}
        direction={direction}
        breakpoints={breakpoints}
        onSlideChange={onSlideChange}
        onSwiper={onSwiper}
        className="w-full"
      >
        {React.Children.map(children, (child, index) => (
          <SwiperSlide key={index}>
            {child}
          </SwiperSlide>
        ))}
      </Swiper>
      
      {/* أزرار التنقل المخصصة */}
      {navigation && (
        <>
          <button className="swiper-button-prev absolute left-2 top-1/2 z-10 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="swiper-button-next absolute right-2 top-1/2 z-10 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}

// مكون Carousel للصور
export const ImageCarousel: React.FC<{
  images: string[]
  className?: string
  height?: string
  autoplay?: boolean
  showThumbnails?: boolean
}> = ({ images, className, height = 'h-64', autoplay = true, showThumbnails = false }) => {
  const [activeIndex, setActiveIndex] = React.useState(0)

  return (
    <div className={cn('space-y-4', className)}>
      <Carousel
        slidesPerView={1}
        autoplay={autoplay}
        pagination={true}
        navigation={true}
        loop={true}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className={height}
      >
        {images.map((image, index) => (
          <div key={index} className="relative w-full h-full">
            <img
              src={image}
              alt={`صورة ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        ))}
      </Carousel>
      
      {/* الصور المصغرة */}
      {showThumbnails && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200',
                activeIndex === index ? 'border-primary' : 'border-gray-200'
              )}
            >
              <img
                src={image}
                alt={`صورة مصغرة ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// مكون Carousel للبطاقات
export const CardCarousel: React.FC<{
  children: React.ReactNode
  className?: string
  slidesPerView?: number
  autoplay?: boolean
}> = ({ children, className, slidesPerView = 3, autoplay = false }) => {
  return (
    <Carousel
      slidesPerView={slidesPerView}
      spaceBetween={20}
      autoplay={autoplay}
      pagination={true}
      navigation={true}
      breakpoints={{
        320: { slidesPerView: 1, spaceBetween: 10 },
        768: { slidesPerView: 2, spaceBetween: 15 },
        1024: { slidesPerView: slidesPerView, spaceBetween: 20 },
      }}
      className={className}
    >
      {children}
    </Carousel>
  )
}

// مكون Carousel للشهادات
export const TestimonialCarousel: React.FC<{
  testimonials: Array<{
    id: string
    name: string
    role: string
    content: string
    avatar?: string
    rating?: number
  }>
  className?: string
}> = ({ testimonials, className }) => {
  return (
    <Carousel
      slidesPerView={1}
      spaceBetween={30}
      autoplay={true}
      autoplayDelay={5000}
      pagination={true}
      navigation={true}
      loop={true}
      effect="fade"
      className={className}
    >
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="text-center p-6">
          <div className="max-w-2xl mx-auto">
            {/* التقييم */}
            {testimonial.rating && (
              <div className="flex justify-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={cn(
                      'w-5 h-5',
                      i < testimonial.rating! ? 'text-yellow-400' : 'text-gray-300'
                    )}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            )}
            
            {/* المحتوى */}
            <blockquote className="text-lg text-gray-700 mb-6 italic">
              "{testimonial.content}"
            </blockquote>
            
            {/* معلومات الشخص */}
            <div className="flex items-center justify-center space-x-3 space-x-reverse">
              {testimonial.avatar && (
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="text-right">
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.role}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </Carousel>
  )
}

// Hook لاستخدام Carousel
export const useCarousel = () => {
  const [swiper, setSwiper] = React.useState<any>(null)
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isBeginning, setIsBeginning] = React.useState(true)
  const [isEnd, setIsEnd] = React.useState(false)

  const handleSwiper = (swiperInstance: any) => {
    setSwiper(swiperInstance)
  }

  const handleSlideChange = (swiperInstance: any) => {
    setActiveIndex(swiperInstance.realIndex)
    setIsBeginning(swiperInstance.isBeginning)
    setIsEnd(swiperInstance.isEnd)
  }

  const slideTo = (index: number) => {
    if (swiper) {
      swiper.slideTo(index)
    }
  }

  const slideNext = () => {
    if (swiper) {
      swiper.slideNext()
    }
  }

  const slidePrev = () => {
    if (swiper) {
      swiper.slidePrev()
    }
  }

  return {
    swiper,
    activeIndex,
    isBeginning,
    isEnd,
    handleSwiper,
    handleSlideChange,
    slideTo,
    slideNext,
    slidePrev,
  }
}
