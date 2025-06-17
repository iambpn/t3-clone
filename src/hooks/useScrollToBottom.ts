import { useEffect, useState, type RefObject } from "react";

export function useScrolledToBottom(ref: RefObject<HTMLElement | null>, offset = 0) {
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    if (!ref || !ref.current) {
      return;
    }

    const element = ref.current;

    const handleScroll = () => {
      const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + offset;
      setIsAtBottom(atBottom);
    };

    element.addEventListener("scroll", handleScroll);

    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  }, [ref, offset]);

  return { isAtBottom };
}
