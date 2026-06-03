/**
 * GSAP Motion Engine 
 * Provides: Magnetic Hover, ScrollTrigger Batch, Parallax, and Liquid Veil Routing.
 */

(function() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const CustomEase = window.CustomEase;
  
  if (!gsap || !ScrollTrigger || !CustomEase) {
    console.warn("GSAP Motion Engine requires gsap, ScrollTrigger, and CustomEase.");
    return;
  }

  // Register Eases
  CustomEase.create("fxVeil", "0.76, 0, 0.24, 1");
  CustomEase.create("fxMagnetic", "0.175, 0.885, 0.32, 1.275"); // Springy

  // --- 1. Liquid Veil Routing ---
  function initVeil() {
    // Inject Veil HTML if not present
    if (!document.querySelector(".fx-veil")) {
      const veil = document.createElement("div");
      veil.className = "fx-veil";
      const spinner = document.createElement("div");
      spinner.className = "fx-veil__spinner";
      veil.appendChild(spinner);
      document.body.appendChild(veil);
    }
    
    const veil = document.querySelector(".fx-veil");
    const spinner = document.querySelector(".fx-veil__spinner");

    // Intercept clicks on links with data-fx-link
    const links = document.querySelectorAll("a[data-fx-link]");
    links.forEach(link => {
      link.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.blank) return; // Allow opening in new tab normally
        e.preventDefault();
        const target = link.href;

        const tl = gsap.timeline({
          onComplete: () => { window.location.href = target; }
        });
        
        tl.to(veil, { clipPath: "inset(0% 0 0 0)", duration: 0.8, ease: "fxVeil" })
          .to(spinner, { opacity: 1, duration: 0.3 }, "-=0.3");
      });
    });
    
    // Page Load Exit Animation (If it was previously triggered)
    // For demo purposes, we always open the veil on load
    gsap.set(veil, { clipPath: "inset(0% 0 0 0)" });
    gsap.to(veil, { clipPath: "inset(0% 0 100% 0)", duration: 0.8, ease: "fxVeil", delay: 0.2 });
  }


  // --- 2. Magnetic Hover ---
  function initMagnetic() {
    const magneticEls = document.querySelectorAll("[data-fx-magnetic]");
    
    magneticEls.forEach(el => {
      // Create a bigger hit area so it attracts before actually touching the border
      const strength = el.dataset.fxMagnetic || 20; 
      
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(el, {
          x: x * (strength / 100),
          y: y * (strength / 100),
          duration: 0.4,
          ease: "power2.out",
          overwrite: "auto"
        });
      });
      
      el.addEventListener("mouseleave", () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "fxMagnetic", // Spring back
          overwrite: "auto"
        });
      });
    });
  }


  // --- 3. ScrollTrigger Batching (Staggered Cards) ---
  function initScrollBatch() {
    const groups = document.querySelectorAll("[data-fx-stagger-group]");
    
    groups.forEach(group => {
      const items = group.querySelectorAll("[data-fx-stagger-item]");
      if(items.length === 0) return;
      
      // Setup initial state
      gsap.set(items, { y: 60, opacity: 0, rotationZ: 2 });
      
      ScrollTrigger.batch(items, {
        interval: 0.1, // time between batches if scrolling fast
        batchMax: 3,   // max items per batch
        onEnter: batch => {
          gsap.to(batch, {
            autoAlpha: 1, 
            y: 0,
            rotationZ: 0,
            stagger: 0.15, 
            duration: 1,
            ease: "power3.out",
            overwrite: true
          });
        },
        start: "top 85%"
      });
    });
  }

  // --- 4. Scroll Parallax ---
  function initParallax() {
    const parallaxEls = document.querySelectorAll("[data-fx-parallax]");
    
    parallaxEls.forEach(el => {
      const speed = parseFloat(el.dataset.fxParallax) || 0.2;
      gsap.to(el, {
        y: () => window.innerHeight * speed,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true
        }
      });
    });
  }


  // Initialize Everything
  window.addEventListener("DOMContentLoaded", () => {
    initVeil();
    initMagnetic();
    initScrollBatch();
    initParallax();
  });

})();
