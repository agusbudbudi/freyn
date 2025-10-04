"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    text: "Finally found a freelance management tool that actually gets it! Managing 15+ clients was chaos before. Now I can track every project milestone, see which clients need attention, and never miss a deadline. Game changer for my design business.",
    author: "Rina Dewi",
    role: "Graphic Designer",
    image: "/images/testimony-1.png",
  },
  {
    id: 2,
    text: "The client portal feature is brilliant. My clients can now check project progress themselves without constantly messaging me. Plus the automated invoice generation? Saved me at least 5 hours per week on admin work alone.",
    author: "Budi Wijaya",
    role: "Freelance Developer",
    image: "/images/testimony-2.png",
  },
  {
    id: 3,
    text: "Switched from spreadsheets to this platform 3 months ago. Revenue tracking is incredibly detailed - I can see exactly which services are most profitable. Also love how easy it is to share design results with clients through the secure portal.",
    author: "Ayu Safitri",
    role: "Brand Designer",
    image: "/images/testimony-3.png",
  },
  {
    id: 4,
    text: "As someone juggling 20+ projects monthly, this system keeps me sane. The dashboard shows everything at a glance - what's overdue, what's in progress, which clients haven't paid. No more mental overload trying to remember everything.",
    author: "Fajar Hidayat",
    role: "UI/UX Designer",
    image: "/images/testimony-4.png",
  },
  {
    id: 5,
    text: "Best investment for my freelance career. Client management alone is worth it - all communication history, project files, and payment records in one place. When clients come back after 6 months, I have everything at my fingertips.",
    author: "Linda Maharani",
    role: "Creative Director",
    image: "/images/testimony-5.png",
  },
];

export default function TestimonialSlider() {
  const [currentCenter, setCurrentCenter] = useState(1); // Start with second testimonial as center
  const [isHovered, setIsHovered] = useState(false);
  const autoPlayRef = useRef(null);

  // Auto-play functionality
  useEffect(() => {
    if (!isHovered) {
      autoPlayRef.current = setInterval(() => {
        setCurrentCenter((prev) => {
          if (prev < testimonials.length - 1) {
            return prev + 1;
          } else {
            return 0; // Loop back to first
          }
        });
      }, 4000); // Change slide every 4 seconds
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isHovered]);

  const nextSlide = () => {
    if (currentCenter < testimonials.length - 1) {
      setCurrentCenter(currentCenter + 1);
    }
  };

  const prevSlide = () => {
    if (currentCenter > 0) {
      setCurrentCenter(currentCenter - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentCenter(index);
  };

  // Calculate card dimensions for positioning
  const getCardDimensions = () => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const mobileCardWidth = Math.min(window.innerWidth * 0.75, 300);
        return {
          cardWidth: mobileCardWidth,
          cardGap: 16,
          cardWidthWithGap: mobileCardWidth + 16,
        };
      }
    }
    return {
      cardWidth: 500,
      cardGap: 32,
      cardWidthWithGap: 532,
    };
  };

  const { cardWidthWithGap } = getCardDimensions();

  // Calculate transform for centering
  const getTransform = () => {
    if (typeof window !== "undefined") {
      const containerWidth =
        window.innerWidth > 1200 ? 1200 : window.innerWidth;
      const { cardWidth } = getCardDimensions();
      const offsetToCenter = (containerWidth - cardWidth) / 2;
      const translateX = offsetToCenter - currentCenter * cardWidthWithGap;
      return `translateX(${translateX}px)`;
    }
    return "translateX(0)";
  };

  return (
    <div
      className="testimonials-slider"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="testimonials-wrapper">
        <div
          className="testimonials-track"
          style={{
            transform: getTransform(),
            transition: "transform 0.5s ease",
          }}
        >
          {testimonials.map((testimonial, index) => {
            const isActive = index === currentCenter;
            const isSide = Math.abs(index - currentCenter) === 1;

            return (
              <div
                key={testimonial.id}
                className={`testimonial-card ${isActive ? "active" : ""} ${
                  isSide ? "side" : ""
                }`}
              >
                <p className="testimonial-text">{testimonial.text}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.author}
                      width={40}
                      height={40}
                      className="testimony-img"
                    />
                  </div>
                  <div className="author-info">
                    <h4>{testimonial.author}</h4>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="slider-dots">
        {testimonials.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentCenter ? "active" : ""}`}
            onClick={() => goToSlide(index)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="slider-navigation">
        <button
          className="slider-btn slider-prev"
          onClick={prevSlide}
          disabled={currentCenter === 0}
          aria-label="Previous testimonial"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button
          className="slider-btn slider-next"
          onClick={nextSlide}
          disabled={currentCenter === testimonials.length - 1}
          aria-label="Next testimonial"
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>
  );
}
