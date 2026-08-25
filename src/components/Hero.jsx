import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "../gsapSetup";

export default function Hero() {
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const mediaWrapRef = useRef(null);
  const mediaRef = useRef(null);
  const posterRef = useRef(null);
  const videoRef = useRef(null);
  const subRef = useRef(null);

  // entrance
  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(line1Ref.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, 0.05)
      .fromTo(mediaWrapRef.current, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 1 }, 0.25)
      .fromTo(line2Ref.current, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, 0.35)
      .fromTo(subRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, 0.7);
  }, []);

  // start-frame -> video crossfade once the video can actually play
  useGSAP(() => {
    const video = videoRef.current;
    if (!video) return;

    const reveal = () => {
      gsap.to(posterRef.current, { opacity: 0, duration: 0.6, ease: "power2.out" });
      gsap.to(video, { opacity: 1, duration: 0.6, ease: "power2.out" });
    };

    if (video.readyState >= 3) {
      reveal();
    } else {
      video.addEventListener("canplay", reveal, { once: true });
    }

    video.muted = true;
    const playPromise = video.play();
    if (playPromise) playPromise.catch(() => {});

    return () => video.removeEventListener("canplay", reveal);
  }, []);

  // Two ongoing costs keep running forever once the hero has played once,
  // regardless of scroll position, because neither a <video> nor a CSS
  // `animation` is paused automatically just for being off-screen:
  //   1. the looping alpha-channel video decode
  //   2. .hero-media's infinite `hoverFloat` animation — made much worse by
  //      its `drop-shadow` filter, which forces a pixel-level repaint on
  //      every frame the element moves, unlike a plain (GPU-only) transform.
  // (2) is the pricier of the two, and it's what was still eating frame
  // budget from the bread carousel even after the video alone got paused.
  // Both are driven off one observer so they start/stop together.
  useEffect(() => {
    const video = videoRef.current;
    const media = mediaRef.current;
    if (!video || !media) return;

    // A 1px-sliver threshold meant playback kept going right up to the
    // moment the hero fully left the screen — on mobile that sliver can
    // linger for a while during scroll, so it barely helped. Shrinking the
    // intersection root by a margin means it actually stops once the hero's
    // bottom edge has cleared the viewport with some buffer to spare,
    // instead of only at the literal last pixel.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const playPromise = video.play();
          if (playPromise) playPromise.catch(() => {});
          media.classList.remove("hero-media--paused");
        } else {
          video.pause();
          media.classList.add("hero-media--paused");
        }
      },
      { rootMargin: "-150px 0px -150px 0px", threshold: 0 }
    );
    observer.observe(media);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-line" ref={line1Ref}>Panes</div>
        <div className="hero-video-gap" />
        <div className="hero-line" ref={line2Ref}>Patagonia</div>

        <div className="hero-video-wrap">
          {/* .hero-enter carries the one-time GSAP scale/opacity entrance;
              .hero-media carries the permanent CSS hoverFloat animation.
              Kept on separate elements so they don't both fight over the
              same `transform` property (a CSS animation always wins that
              fight, which silently ate the entrance scale before). Poster
              and video both live inside .hero-media, so they float as one
              unit whichever layer is currently visible. */}
          <div className="hero-enter" ref={mediaWrapRef}>
            <div className="hero-media" ref={mediaRef}>
              <img
                ref={posterRef}
                className="hero-poster"
                src="/uploads/hero_start_frame.png"
                alt=""
                aria-hidden="true"
              />
              <video
                ref={videoRef}
                className="hero-video"
                poster="/uploads/hero_start_frame.png"
                autoPlay
                loop
                muted
                playsInline
              >
                {/* Safari/iOS: HEVC+Alpha .mov, encoded via macOS's native
                    Finder "Encode Selected Video Files" (Preserve Transparency)
                    rather than ffmpeg's hevc_videotoolbox — the ffmpeg path
                    left a systematic alpha-channel floor (background never
                    quite reached 0) that showed up as a faint veil on iOS.
                    WebKit otherwise ignores the WebM alpha channel entirely. */}
                <source src="/uploads/hero_video_alpha.mov" type="video/mp4; codecs=hvc1" />
                <source src="/uploads/magnific_video-background-removal_vQqGduda47.webm" type="video/webm" />
              </video>
            </div>
          </div>
        </div>
      </div>

      <div className="hero-sub" ref={subRef}>
        <p>Pan artesanal de hamburguesa, elaborado en obrador propio y servido a la hostelería de toda España.</p>
      </div>
    </section>
  );
}
